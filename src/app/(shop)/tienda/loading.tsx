import { ProductGridSkeleton, PageHeaderSkeleton } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="container-custom py-8">
      <PageHeaderSkeleton />
      <ProductGridSkeleton count={12} />
    </div>
  );
}
