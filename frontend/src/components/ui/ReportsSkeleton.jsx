import React from 'react';

const ReportsSkeleton = () => {
  const SkeletonRow = () => (
    <div className="bg-[#f8f8f8] rounded-[16px] p-4 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2">
        <div className="h-5 bg-gray-200 rounded w-1/3"></div>
        <div className="h-5 bg-gray-200 rounded w-2/3 col-span-1 md:col-span-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/4 md:col-start-3 md:justify-self-end"></div>
      </div>
    </div>
  );

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        {/* Skeleton Header */}
        <div className="hidden md:grid grid-cols-3 gap-4 px-4 py-2">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4 justify-self-end"></div>
        </div>
        {/* Skeleton Body */}
        <div className="flex flex-col gap-2">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      </div>
    </div>
  );
};

export default ReportsSkeleton; 