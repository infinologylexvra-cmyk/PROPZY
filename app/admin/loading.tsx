import { BrandSpinner } from '@/components/Loader';

export default function AdminLoading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 space-y-4">
      <BrandSpinner 
        message="Loading Propzy Admin Portal..." 
        size="lg" 
      />
      <p className="text-xs text-gray-500 font-mono">
        Synchronizing real-time database records...
      </p>
    </div>
  );
}
