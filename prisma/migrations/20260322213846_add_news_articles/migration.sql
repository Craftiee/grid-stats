-- CreateTable
CREATE TABLE "news_articles" (
    "id" SERIAL NOT NULL,
    "url" VARCHAR(2000) NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "imageUrl" VARCHAR(2000),
    "sourceName" VARCHAR(200) NOT NULL,
    "sourceFavicon" VARCHAR(500),
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "scrapedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "news_articles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "news_articles_url_key" ON "news_articles"("url");

-- CreateIndex
CREATE INDEX "news_articles_publishedAt_idx" ON "news_articles"("publishedAt" DESC);
