import prisma from '@/lib/prisma';

// Auto-prune expired entries at most once per hour
let lastPruneTime = 0;
const PRUNE_INTERVAL = 60 * 60 * 1000; // 1 hour

async function maybePrune() {
  const now = Date.now();
  if (now - lastPruneTime < PRUNE_INTERVAL) return;
  lastPruneTime = now;
  // Fire-and-forget — don't block the request
  pruneRateLimits().catch(() => {});
}

/**
 * Database-backed rate limiter using atomic SQL to prevent race conditions.
 * Returns true if the request is allowed, false if blocked.
 */
export async function rateLimit(key: string, maxAttempts: number, windowMs: number): Promise<boolean> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);

  // Trigger background cleanup periodically
  maybePrune();

  // Atomic upsert + conditional increment in a single query.
  // If the window expired, reset count to 1 and set a new window.
  // If within window, increment count.
  // Returns the resulting count so we can check against maxAttempts.
  const result: Array<{ count: number }> = await prisma.$queryRaw`
    INSERT INTO "rate_limit_entries" ("key", "count", "resetAt", "createdAt")
    VALUES (${key}, 1, ${resetAt}, ${now})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "rate_limit_entries"."resetAt" <= ${now} THEN 1
        ELSE "rate_limit_entries"."count" + 1
      END,
      "resetAt" = CASE
        WHEN "rate_limit_entries"."resetAt" <= ${now} THEN ${resetAt}
        ELSE "rate_limit_entries"."resetAt"
      END
    RETURNING "count"
  `;

  return result[0].count <= maxAttempts;
}

/**
 * Clean up expired rate limit entries.
 */
export async function pruneRateLimits() {
  await prisma.rateLimitEntry.deleteMany({
    where: { resetAt: { lt: new Date() } },
  });
}
