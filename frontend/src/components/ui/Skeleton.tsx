import React from 'react';
import { BaseComponentProps } from '../../types';

interface SkeletonProps extends BaseComponentProps {
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | false;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  animation = 'pulse',
  className = '',
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'circular':
        return 'rounded-full';
      case 'rectangular':
        return 'rounded-md';
      default:
        return 'rounded';
    }
  };

  const getAnimationStyles = () => {
    switch (animation) {
      case 'pulse':
        return 'animate-pulse';
      case 'wave':
        return 'animate-pulse'; // You can implement wave animation if needed
      default:
        return '';
    }
  };

  const getSizeStyles = () => {
    const styles: string[] = [];

    if (width) {
      styles.push(typeof width === 'number' ? `w-${width}` : `w-[${width}]`);
    } else if (variant === 'text') {
      styles.push('w-full');
    }

    if (height) {
      styles.push(typeof height === 'number' ? `h-${height}` : `h-[${height}]`);
    } else if (variant === 'text') {
      styles.push('h-4');
    } else if (variant === 'circular') {
      styles.push('h-10 w-10');
    }

    return styles.join(' ');
  };

  return (
    <div
      className={`
        bg-gray-200 dark:bg-gray-700
        ${getVariantStyles()}
        ${getAnimationStyles()}
        ${getSizeStyles()}
        ${className}
      `}
    />
  );
};

// Predefined skeleton components for common use cases
export const SkeletonText: React.FC<Omit<SkeletonProps, 'variant'>> = (props) => (
  <Skeleton variant="text" {...props} />
);

export const SkeletonAvatar: React.FC<Omit<SkeletonProps, 'variant'>> = (props) => (
  <Skeleton variant="circular" {...props} />
);

export const SkeletonButton: React.FC<Omit<SkeletonProps, 'variant'>> = (props) => (
  <Skeleton variant="rectangular" height="2.5rem" {...props} />
);

export const SkeletonCard: React.FC<BaseComponentProps> = ({ className = '' }) => (
  <div className={`card-enhanced p-6 ${className}`}>
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <SkeletonAvatar width="3rem" height="3rem" />
        <div className="space-y-2 flex-1">
          <SkeletonText width="60%" />
          <SkeletonText width="40%" />
        </div>
      </div>
      <div className="space-y-2">
        <SkeletonText />
        <SkeletonText />
        <SkeletonText width="80%" />
      </div>
    </div>
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number; columns?: number } & BaseComponentProps> = ({
  rows = 5,
  columns = 4,
  className = '',
}) => (
  <div className={`card-enhanced p-6 ${className}`}>
    <div className="space-y-3">
      {/* Table header */}
      <div className="flex space-x-4">
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonText key={i} width="100%" height="1rem" />
        ))}
      </div>
      {/* Table rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, j) => (
            <SkeletonText key={j} width="100%" height="0.875rem" />
          ))}
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonList: React.FC<{ items?: number } & BaseComponentProps> = ({
  items = 3,
  className = '',
}) => (
  <div className={`space-y-4 ${className}`}>
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="flex items-center space-x-4">
        <SkeletonAvatar width="2.5rem" height="2.5rem" />
        <div className="space-y-2 flex-1">
          <SkeletonText width="80%" />
          <SkeletonText width="60%" />
        </div>
      </div>
    ))}
  </div>
);