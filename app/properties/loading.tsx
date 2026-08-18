import { SkeletonGrid } from '@/components/Loader';

export default function PropertiesLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-950 pb-6">
        <div className="space-y-2">
          <div className="h-8 bg-[#0a1811] rounded-xl w-64 animate-pulse border border-emerald-950" />
          <div className="h-4 bg-[#0a1811] rounded-md w-96 animate-pulse border border-emerald-950/60" />
        </div>
      </div>
      <SkeletonGrid count={6} />
    </div>
  );
}
