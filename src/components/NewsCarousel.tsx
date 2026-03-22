'use client';

import { useState, useEffect } from 'react';

interface NewsArticle {
  title: string;
  url: string;
  imageUrl: string;
  sourceName: string;
  sourceFavicon: string;
  timeAgo: string;
}

interface NewsCarouselProps {
  layout?: 'sidebar' | 'full';
  limit?: number;
  showLoadMore?: boolean;
}

export default function NewsCarousel({ layout = 'full', limit = 10, showLoadMore = false }: NewsCarouselProps) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const pageSize = showLoadMore ? 20 : limit;

  useEffect(() => {
    fetch(`/api/news?limit=${pageSize}`)
      .then((res) => res.json())
      .then((data) => {
        setArticles(data);
        setHasMore(showLoadMore && data.length >= pageSize);
      })
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, [pageSize, showLoadMore]);

  const loadMore = () => {
    setLoadingMore(true);
    fetch(`/api/news?limit=20&offset=${articles.length}`)
      .then((res) => res.json())
      .then((data: NewsArticle[]) => {
        setArticles((prev) => [...prev, ...data]);
        setHasMore(data.length >= 20);
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  };

  // ── Loading skeletons ──
  if (loading) {
    const count = layout === 'sidebar' ? Math.min(limit, 5) : Math.min(pageSize, 6);
    return (
      <div className={layout === 'sidebar' ? 'flex flex-col gap-2' : 'flex flex-col gap-3'}>
        {[...Array(count)].map((_, i) => (
          <div
            key={i}
            className="flex gap-3 rounded-lg overflow-hidden animate-pulse"
            style={{ backgroundColor: '#1a1a1f', border: '1px solid #27272a' }}
          >
            <div
              className={layout === 'sidebar' ? 'w-[106px] h-[130px] flex-shrink-0' : 'w-[350px] h-[150px] flex-shrink-0'}
              style={{ backgroundColor: '#27272a' }}
            />
            <div className="flex-1 flex flex-col gap-1.5 p-3">
              <div className="h-3 rounded w-full" style={{ backgroundColor: '#27272a' }} />
              <div className="h-3 rounded w-3/4" style={{ backgroundColor: '#27272a' }} />
              <div className="h-2 rounded w-1/3 mt-auto" style={{ backgroundColor: '#27272a' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── Empty state ──
  if (articles.length === 0) {
    return (
      <div className="rounded-lg p-6 text-center" style={{ backgroundColor: '#1a1a1f', border: '1px solid #27272a' }}>
        <svg className="w-8 h-8 mx-auto mb-2" style={{ color: '#3f3f46' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
        <p className="text-xs font-medium" style={{ color: '#71717a' }}>No current news</p>
      </div>
    );
  }

  // ── Thumbnail with fallback ──
  const Thumbnail = ({ article, size }: { article: NewsArticle; size: 'sm' | 'lg' }) => {
    const sizeClass = size === 'sm' ? 'w-[106px] h-[125px] object-[left_top]' : 'w-[350px] h-[150px]';

    if (article.imageUrl) {
      return (
        <img
          src={article.imageUrl}
          alt=""
          className={`${sizeClass} object-cover flex-shrink-0`}
          onError={(e) => {
            const el = e.target as HTMLImageElement;
            el.style.display = 'none';
            el.nextElementSibling?.classList.remove('hidden');
          }}
        />
      );
    }

    return (
      <div
        className={`${sizeClass} flex-shrink-0 flex items-center justify-center`}
        style={{ backgroundColor: '#111113' }}
      >
        {article.sourceFavicon ? (
          <img src={article.sourceFavicon} alt="" className="w-6 h-6 opacity-40" />
        ) : (
          <svg className="w-6 h-6 opacity-20" style={{ color: '#52525b' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
        )}
      </div>
    );
  };

  // ── Load More button ──
  const LoadMoreButton = () => {
    if (!showLoadMore || !hasMore) return null;
    return (
      <button
        onClick={loadMore}
        disabled={loadingMore}
        className="mt-4 w-full py-3 rounded-lg text-sm font-bold uppercase tracking-widest transition-colors hover:bg-white/5 disabled:opacity-50"
        style={{ backgroundColor: '#1a1a1f', border: '1px solid #27272a', color: '#dc2626' }}
      >
        {loadingMore ? 'Loading...' : 'Load More'}
      </button>
    );
  };

  // ── Sidebar layout (compact) ──
  if (layout === 'sidebar') {
    return (
      <div className="flex flex-col gap-2">
        {articles.map((article, i) => (
          <a
            key={i}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-stretch rounded-lg overflow-hidden transition-colors hover:bg-white/5"
            style={{ backgroundColor: '#1a1a1f', border: '1px solid #27272a', minHeight: '125px', marginBottom: '10px' }}
          >
            <Thumbnail article={article} size="sm" />
            {/* Hidden fallback for broken images */}
            <div
              className="w-[106px] h-[125px] flex-shrink-0 hidden items-center justify-center"
              style={{ backgroundColor: '#111113' }}
            >
              {article.sourceFavicon && <img src={article.sourceFavicon} alt="" className="w-5 h-5 opacity-40" />}
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-between py-3 pr-3 pl-3">
              <p className="text-xs font-semibold line-clamp-2 leading-tight" style={{ color: '#e2e8f0' }}>
                {article.title}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                {article.sourceFavicon && (
                  <img src={article.sourceFavicon} alt="" className="w-3 h-3 rounded-sm flex-shrink-0" />
                )}
                <span className="text-[9px] truncate" style={{ color: '#52525b' }}>
                  {article.sourceName}
                </span>
                {article.timeAgo && (
                  <span className="text-[9px] flex-shrink-0" style={{ color: '#3f3f46' }}>
                    · {article.timeAgo}
                  </span>
                )}
              </div>
            </div>
          </a>
        ))}
      </div>
    );
  }

  // ── Full layout (larger horizontal cards) ──
  return (
    <div>
      <div className="flex flex-col gap-3">
        {articles.map((article, i) => (
          <a
            key={i}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex gap-0 rounded-lg overflow-hidden transition-all hover:bg-white/5 hover:scale-[1.005]"
            style={{ backgroundColor: '#1a1a1f', border: '1px solid #27272a' }}
          >
            <Thumbnail article={article} size="lg" />
            {/* Hidden fallback for broken images */}
            <div
              className="w-[300px] h-[150px] flex-shrink-0 hidden items-center justify-center"
              style={{ backgroundColor: '#111113' }}
            >
              {article.sourceFavicon && <img src={article.sourceFavicon} alt="" className="w-8 h-8 opacity-40" />}
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-between p-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {article.sourceFavicon && (
                    <img src={article.sourceFavicon} alt="" className="w-4 h-4 rounded-sm flex-shrink-0" />
                  )}
                  <span className="text-[10px] font-bold uppercase tracking-wide truncate" style={{ color: '#71717a' }}>
                    {article.sourceName}
                  </span>
                </div>
                <h3 className="text-sm font-semibold line-clamp-2 leading-snug" style={{ color: '#e2e8f0' }}>
                  {article.title}
                </h3>
              </div>
              {article.timeAgo && (
                <p className="text-[10px] mt-2" style={{ color: '#52525b' }}>
                  {article.timeAgo}
                </p>
              )}
            </div>
          </a>
        ))}
      </div>

      <LoadMoreButton />
    </div>
  );
}
