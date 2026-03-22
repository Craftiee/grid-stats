'use client';

import NewsCarousel from '@/components/NewsCarousel';

export default function NewsPage() {
  return (
    <div className="mx-auto mt-6 px-4 pb-6" style={{ maxWidth: '1280px' }}>
      <div className="mb-6">
        <h1 className="text-xl font-black uppercase tracking-wide" style={{ color: '#e2e8f0' }}>
          Latest F1 News
        </h1>
        <div className="h-1 w-16 mt-2 rounded" style={{ backgroundColor: '#dc2626' }} />
      </div>
      <NewsCarousel layout="full" limit={100} showLoadMore={true} />
    </div>
  );
}
