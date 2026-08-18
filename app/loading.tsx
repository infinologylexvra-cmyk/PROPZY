import { PageLoader } from '@/components/Loader';

export default function Loading() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <PageLoader 
        message="Loading Propzy Real Estate Portal..." 
        subMessage="Fetching verified 0% brokerage listings..." 
      />
    </div>
  );
}
