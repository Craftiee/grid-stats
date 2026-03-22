-- DropForeignKey
ALTER TABLE "forum_replies" DROP CONSTRAINT "forum_replies_userId_fkey";

-- DropForeignKey
ALTER TABLE "forum_threads" DROP CONSTRAINT "forum_threads_userId_fkey";

-- AlterTable
ALTER TABLE "forum_replies" ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "forum_threads" ALTER COLUMN "userId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "forum_threads" ADD CONSTRAINT "forum_threads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_replies" ADD CONSTRAINT "forum_replies_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
