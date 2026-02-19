'use client';

import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height,
  animation = 'pulse',
}) => {
  const baseClasses = 'bg-gray-200';
  
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  };

  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
  );
};

// Componentes especializados de skeleton

export const ProductCardSkeleton: React.FC = () => (
  <div className="card p-4">
    <Skeleton variant="rectangular" height={300} className="mb-4" />
    <Skeleton variant="text" height={20} width="80%" className="mb-2" />
    <Skeleton variant="text" height={16} width="60%" className="mb-4" />
    <Skeleton variant="text" height={24} width="40%" />
  </div>
);

export const ProductGridSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
    {Array.from({ length: count }).map((_, index) => (
      <ProductCardSkeleton key={index} />
    ))}
  </div>
);

export const HeroSkeleton: React.FC = () => (
  <div className="relative h-[500px] md:h-[600px] overflow-hidden bg-gray-200">
    <Skeleton variant="rectangular" className="w-full h-full" animation="wave" />
  </div>
);

export const PageHeaderSkeleton: React.FC = () => (
  <div className="mb-8">
    <Skeleton variant="text" height={40} width="60%" className="mb-4" />
    <Skeleton variant="text" height={20} width="80%" />
  </div>
);

export const FormSkeleton: React.FC = () => (
  <div className="space-y-4">
    <Skeleton variant="rectangular" height={56} />
    <Skeleton variant="rectangular" height={56} />
    <Skeleton variant="rectangular" height={120} />
    <Skeleton variant="rectangular" height={48} width="30%" />
  </div>
);

export default Skeleton;
