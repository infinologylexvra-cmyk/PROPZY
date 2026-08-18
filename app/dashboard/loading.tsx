import { BrandSpinner } from '@/components/Loader';

export default function DashboardLoading() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <BrandSpinner 
        message="Loading User Dashboard..." 
        size="lg" 
      />
    </div>
  );
}
