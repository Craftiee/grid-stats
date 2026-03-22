import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import dns from 'node:dns/promises';
import { isIP } from 'node:net';
import prisma from '@/lib/prisma';
import { rateLimit, pruneRateLimits } from '@/lib/rate-limit';

interface ParsedArticle {
  url: string;
  title: string;
  imageUrl: string;
  sourceName: string;
  sourceFavicon: string;
  publishedAt: string;
}

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const SCRAPE_INTERVAL = 10 * 60 * 1000; // 10 minutes
const PRUNE_DAYS = 7;
let lastFetchTime = 0;

// ── RSS Feed Sources ─────────────────────────────────────────
const RSS_FEEDS: { url: string; name: string; type: 'bing' | 'google' | 'standard' }[] = [
  { url: 'https://www.bing.com/news/search?q=formula+1+f1&format=rss&count=100', name: 'Bing News', type: 'bing' },
  { url: 'https://news.google.com/rss/search?q=formula+1+F1&hl=en-US&gl=US&ceid=US:en', name: 'Google News', type: 'google' },
  { url: 'https://www.motorsport.com/rss/f1/news/', name: 'Motorsport.com', type: 'standard' },
  { url: 'https://www.autosport.com/rss/f1/news/', name: 'Autosport', type: 'standard' },
  { url: 'https://www.racefans.net/feed/', name: 'RaceFans', type: 'standard' },
];

// ── Helpers ──────────────────────────────────────────────────

function timeAgo(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  if (isNaN(then)) return '';
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

function normalizeUrl(raw: string): string {
  try {
    const u = new URL(raw);
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach((p) =>
      u.searchParams.delete(p),
    );
    return u.origin + u.pathname.replace(/\/+$/, '') + u.search;
  } catch {
    return raw;
  }
}

function normalizeTitle(title: string): string {
  return title.toLowerCase().trim().replace(/[\s]+/g, ' ');
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

function faviconUrl(domain: string): string {
  return domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=32` : '';
}

// Extract real URL from Bing redirect wrapper
function extractBingRealUrl(bingUrl: string): string {
  try {
    const u = new URL(bingUrl);
    const real = u.searchParams.get('url');
    return real ? decodeURIComponent(real) : bingUrl;
  } catch {
    return bingUrl;
  }
}

// ── Parsers ──────────────────────────────────────────────────

function parseBingRss(xml: string): ParsedArticle[] {
  const $ = cheerio.load(xml, { xmlMode: true });
  const articles: ParsedArticle[] = [];

  $('item').each((_, el) => {
    const $item = $(el);
    const title = $item.find('title').text().trim();
    const rawUrl = $item.find('link').text().trim();
    const url = extractBingRealUrl(rawUrl);
    const imageUrl = $item.find('News\\:Image, Image').text().trim();
    const sourceName = $item.find('News\\:Source, Source').text().trim();
    const pubDate = $item.find('pubDate').text().trim();
    const domain = getDomain(url);

    if (title && url) {
      articles.push({
        title,
        url: normalizeUrl(url),
        imageUrl: imageUrl ? `${imageUrl}&w=700&h=400&c=7` : '',
        sourceName: sourceName || domain,
        sourceFavicon: faviconUrl(domain),
        publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      });
    }
  });

  return articles;
}

function parseGoogleRss(xml: string): ParsedArticle[] {
  const $ = cheerio.load(xml, { xmlMode: true });
  const articles: ParsedArticle[] = [];

  $('item').each((_, el) => {
    const $item = $(el);
    const rawTitle = $item.find('title').text().trim();
    const url = $item.find('link').text().trim();
    const pubDate = $item.find('pubDate').text().trim();
    const sourceTag = $item.find('source').text().trim();

    // Google News format: "Article Title - Source Name"
    const lastDash = rawTitle.lastIndexOf(' - ');
    const title = lastDash > 0 ? rawTitle.substring(0, lastDash).trim() : rawTitle;
    const sourceName = sourceTag || (lastDash > 0 ? rawTitle.substring(lastDash + 3).trim() : '');
    const domain = getDomain(url);

    if (title && url) {
      articles.push({
        title,
        url: normalizeUrl(url),
        imageUrl: '',
        sourceName: sourceName || domain,
        sourceFavicon: faviconUrl(domain),
        publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      });
    }
  });

  return articles;
}

function parseStandardRss(xml: string, feedName: string): ParsedArticle[] {
  const $ = cheerio.load(xml, { xmlMode: true });
  const articles: ParsedArticle[] = [];

  $('item').each((_, el) => {
    const $item = $(el);
    const title = $item.find('title').text().trim();
    const url = $item.find('link').text().trim() || $item.find('guid').text().trim();
    const pubDate = $item.find('pubDate').text().trim();

    // Try multiple image sources
    let imageUrl = '';
    const mediaContent = $item.find('media\\:content, content').attr('url');
    const mediaThumbnail = $item.find('media\\:thumbnail, thumbnail').attr('url');
    const enclosure = $item.find('enclosure[type^="image"]').attr('url');
    imageUrl = mediaContent || mediaThumbnail || enclosure || '';

    // Try extracting image from description HTML if no image found
    if (!imageUrl) {
      const desc = $item.find('description').text();
      if (desc) {
        const $desc = cheerio.load(desc);
        const descImg = $desc('img').attr('src');
        if (descImg) imageUrl = descImg;
      }
    }

    const domain = getDomain(url);

    if (title && url) {
      articles.push({
        title,
        url: normalizeUrl(url),
        imageUrl,
        sourceName: feedName,
        sourceFavicon: faviconUrl(domain),
        publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      });
    }
  });

  return articles;
}

// ── Scraping ─────────────────────────────────────────────────

async function fetchFeed(feed: (typeof RSS_FEEDS)[number]): Promise<ParsedArticle[]> {
  const res = await fetch(feed.url, {
    headers: { 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    throw new Error(`${feed.name} returned ${res.status}`);
  }

  // Limit RSS response to 5MB to prevent memory exhaustion
  const reader = res.body?.getReader();
  if (!reader) throw new Error(`${feed.name} returned no body`);
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  const MAX_RSS_BYTES = 5 * 1024 * 1024;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > MAX_RSS_BYTES) {
      reader.cancel();
      throw new Error(`${feed.name} response too large (>${MAX_RSS_BYTES / 1024 / 1024}MB)`);
    }
    chunks.push(value);
  }
  const xml = Buffer.concat(chunks).toString('utf-8');

  switch (feed.type) {
    case 'bing':
      return parseBingRss(xml);
    case 'google':
      return parseGoogleRss(xml);
    case 'standard':
      return parseStandardRss(xml, feed.name);
  }
}

async function scrapeAllFeeds(): Promise<ParsedArticle[]> {
  const results = await Promise.allSettled(RSS_FEEDS.map((feed) => fetchFeed(feed)));

  const all: ParsedArticle[] = [];
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      all.push(...result.value);
      console.log(`[News] ${RSS_FEEDS[i].name}: ${result.value.length} articles`);
    } else {
      console.warn(`[News] ${RSS_FEEDS[i].name} failed: ${result.reason}`);
    }
  });

  return all;
}

// ── Dedup within batch: same normalized title → prefer version with image ──
function dedupBatch(articles: ParsedArticle[]): ParsedArticle[] {
  const titleMap = new Map<string, ParsedArticle>();

  for (const a of articles) {
    const key = normalizeTitle(a.title);
    const existing = titleMap.get(key);

    if (!existing) {
      titleMap.set(key, a);
    } else {
      // Prefer the one with an image
      if (!existing.imageUrl && a.imageUrl) {
        titleMap.set(key, a);
      }
    }
  }

  return Array.from(titleMap.values());
}

// ── Database persistence ─────────────────────────────────────

async function persistArticles(articles: ParsedArticle[]) {
  if (articles.length === 0) return;

  // Filter invalid dates
  const valid = articles.filter((a) => !isNaN(new Date(a.publishedAt).getTime()));

  // Dedup within the batch by title (prefer versions with images)
  const deduped = dedupBatch(valid);

  // Check existing titles in DB to avoid cross-source duplicates
  const cutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  const existing = await prisma.newsArticle.findMany({
    where: { publishedAt: { gte: cutoff } },
    select: { title: true, url: true, imageUrl: true },
  });

  const existingTitles = new Set(existing.map((e) => normalizeTitle(e.title)));
  const existingUrlsWithoutImage = new Set(
    existing.filter((e) => !e.imageUrl).map((e) => e.url),
  );

  // Split: new articles vs articles that can update an existing row's image
  const toInsert: typeof deduped = [];
  const toUpdateImage: { url: string; imageUrl: string }[] = [];

  for (const a of deduped) {
    const normTitle = normalizeTitle(a.title);

    if (existingTitles.has(normTitle)) {
      // Article already exists by title — but if we have an image and existing doesn't, update it
      if (a.imageUrl && existingUrlsWithoutImage.has(a.url)) {
        toUpdateImage.push({ url: a.url, imageUrl: a.imageUrl });
      }
      continue; // skip duplicate title
    }

    toInsert.push(a);
  }

  // Insert new articles
  if (toInsert.length > 0) {
    await prisma.newsArticle.createMany({
      data: toInsert.map((a) => ({
        url: a.url,
        title: a.title.slice(0, 500),
        imageUrl: a.imageUrl || null,
        sourceName: a.sourceName.slice(0, 200),
        sourceFavicon: a.sourceFavicon || null,
        publishedAt: new Date(a.publishedAt),
      })),
      skipDuplicates: true,
    });
  }

  // Update images for existing articles that were missing them
  for (const upd of toUpdateImage) {
    await prisma.newsArticle.update({
      where: { url: upd.url },
      data: { imageUrl: upd.imageUrl },
    }).catch(() => {}); // ignore if URL doesn't match
  }

  console.log(`[News] Persisted ${toInsert.length} new, updated ${toUpdateImage.length} images, skipped ${deduped.length - toInsert.length} dupes`);
}

// ── SSRF protection ──────────────────────────────────────────

/**
 * Check if an IP address string (v4 or v6) is private/reserved.
 * Handles decimal, octal, hex IPv4, IPv6, and IPv4-mapped IPv6.
 */
function isPrivateIP(ip: string): boolean {
  // Normalize IPv4-mapped IPv6 (::ffff:1.2.3.4 → 1.2.3.4)
  const v4Mapped = ip.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/i);
  const normalized = v4Mapped ? v4Mapped[1] : ip;

  // IPv6 checks
  if (normalized.includes(':')) {
    const expanded = normalized.toLowerCase();
    if (expanded === '::1') return true;                          // loopback
    if (expanded.startsWith('fe80')) return true;                  // link-local
    if (expanded.startsWith('fc') || expanded.startsWith('fd')) return true; // ULA
    if (expanded === '::') return true;                           // unspecified
    return false;
  }

  // IPv4: parse each octet (supports decimal, 0x hex, and 0 octal notation)
  const rawParts = normalized.split('.');
  if (rawParts.length !== 4) return true; // malformed → block
  const parts: number[] = [];
  for (const raw of rawParts) {
    const n = Number(raw); // Number() handles 0x hex and 0-prefixed octal
    if (!Number.isInteger(n) || n < 0 || n > 255) return true; // invalid → block
    parts.push(n);
  }

  if (parts[0] === 127) return true;                              // loopback
  if (parts[0] === 10) return true;                               // 10.0.0.0/8
  if (parts[0] === 192 && parts[1] === 168) return true;          // 192.168.0.0/16
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true; // 172.16.0.0/12
  if (parts[0] === 169 && parts[1] === 254) return true;          // link-local
  if (parts[0] === 0) return true;                                 // 0.0.0.0/8
  if (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) return true; // CGNAT
  if (parts[0] === 198 && (parts[1] === 18 || parts[1] === 19)) return true; // benchmark
  if (parts[0] >= 224 && parts[0] <= 239) return true;                   // multicast 224.0.0.0/4
  if (parts[0] >= 240) return true;                                       // reserved 240.0.0.0/4 + broadcast
  return false;
}

/**
 * Validate a URL is safe to fetch: correct protocol, non-private hostname.
 * Resolves DNS to check the actual IP the hostname points to (prevents DNS rebinding).
 */
async function isSafeUrl(urlStr: string): Promise<boolean> {
  try {
    const u = new URL(urlStr);
    if (!['http:', 'https:'].includes(u.protocol)) return false;
    const host = u.hostname;
    if (host === 'localhost') return false;

    // If hostname is already an IP literal, check directly
    if (isIP(host)) return !isPrivateIP(host);

    // Resolve DNS and check all returned addresses
    try {
      const addresses = await dns.resolve4(host).catch(() => [] as string[]);
      const addresses6 = await dns.resolve6(host).catch(() => [] as string[]);
      const allAddrs = [...addresses, ...addresses6];
      if (allAddrs.length === 0) return false; // can't resolve → block
      return allAddrs.every((addr) => !isPrivateIP(addr));
    } catch {
      return false; // DNS failure → block
    }
  } catch {
    return false;
  }
}

// ── OG image enrichment for articles missing thumbnails ──────

async function fetchOgImage(url: string): Promise<string | null> {
  // Skip Google News redirect URLs (can't resolve)
  if (url.includes('news.google.com/rss/articles/')) return null;
  if (!(await isSafeUrl(url))) return null;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(5000),
      redirect: 'manual',
    });
    if (!res.ok) return null;

    // Validate Content-Type is HTML before parsing
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
      return null;
    }

    // Limit response size to 512KB to prevent memory exhaustion
    const reader = res.body?.getReader();
    if (!reader) return null;
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    const MAX_BYTES = 512 * 1024;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_BYTES) {
        reader.cancel();
        break;
      }
      chunks.push(value);
    }
    const html = Buffer.concat(chunks).toString('utf-8');

    const $ = cheerio.load(html);
    const ogUrl =
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      null;

    // Validate extracted image URL has a safe protocol before persisting
    if (ogUrl) {
      try {
        const parsed = new URL(ogUrl);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
      } catch {
        return null;
      }
    }

    return ogUrl;
  } catch {
    return null;
  }
}

async function enrichMissingImages() {
  // Find articles missing images (limit to 15 per cycle to avoid hammering)
  const articlesWithoutImages = await prisma.newsArticle.findMany({
    where: {
      OR: [{ imageUrl: null }, { imageUrl: '' }],
    },
    orderBy: { publishedAt: 'desc' },
    take: 15,
    select: { id: true, url: true },
  });

  if (articlesWithoutImages.length === 0) return;

  const results = await Promise.allSettled(
    articlesWithoutImages.map(async (article) => {
      const ogImage = await fetchOgImage(article.url);
      if (ogImage) {
        await prisma.newsArticle.update({
          where: { id: article.id },
          data: { imageUrl: ogImage },
        });
        return true;
      }
      return false;
    }),
  );

  const enriched = results.filter((r) => r.status === 'fulfilled' && r.value).length;
  if (enriched > 0) {
    console.log(`[News] Enriched ${enriched} articles with OG images`);
  }
}

// ── Pruning ──────────────────────────────────────────────────

async function pruneOldArticles() {
  const cutoff = new Date(Date.now() - PRUNE_DAYS * 24 * 60 * 60 * 1000);
  const result = await prisma.newsArticle.deleteMany({
    where: { publishedAt: { lt: cutoff } },
  });
  if (result.count > 0) {
    console.log(`[News] Pruned ${result.count} articles older than ${PRUNE_DAYS} days`);
  }
}

// ── Background scrape loop ───────────────────────────────────

async function doScrape() {
  try {
    const articles = await scrapeAllFeeds();
    if (articles.length > 0) {
      await persistArticles(articles);
    }
    await enrichMissingImages();
    await pruneOldArticles();
    await pruneRateLimits();
    lastFetchTime = Date.now();

    const total = await prisma.newsArticle.count();
    console.log(`[News] Scrape complete — ${total} articles in DB`);
  } catch (error) {
    console.error('[News] Scrape failed:', error);
  }
}

let intervalStarted = false;
function ensureInterval() {
  if (intervalStarted) return;
  intervalStarted = true;
  setInterval(doScrape, SCRAPE_INTERVAL);
  console.log(`[News] Background scrape started (every ${SCRAPE_INTERVAL / 60000}min)`);
}

// ── API handler ──────────────────────────────────────────────

export async function GET(request: NextRequest) {
  // Rate limit: 60 requests per IP per minute
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = (forwarded ? forwarded.split(',')[0].trim() : null)
    ?? request.headers.get('x-real-ip')
    ?? 'unknown';
  if (!(await rateLimit(`news:${ip}`, 60, 60 * 1000))) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  ensureInterval();

  // On cold start or stale, scrape immediately
  if (lastFetchTime === 0 || Date.now() - lastFetchTime > SCRAPE_INTERVAL) {
    await doScrape();
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.max(1, Math.min(parseInt(searchParams.get('limit') || '30', 10) || 30, 200));
  const offset = Math.max(0, Math.min(parseInt(searchParams.get('offset') || '0', 10) || 0, 1000));

  const articles = await prisma.newsArticle.findMany({
    orderBy: { publishedAt: 'desc' },
    take: limit,
    skip: offset,
    select: {
      title: true,
      url: true,
      imageUrl: true,
      sourceName: true,
      sourceFavicon: true,
      publishedAt: true,
    },
  });

  const response = articles.map((a) => ({
    title: a.title,
    url: a.url,
    imageUrl: a.imageUrl || '',
    sourceName: a.sourceName,
    sourceFavicon: a.sourceFavicon || '',
    timeAgo: timeAgo(a.publishedAt.toISOString()),
  }));

  return NextResponse.json(response);
}
