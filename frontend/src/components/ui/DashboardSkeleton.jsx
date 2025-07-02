import React from 'react';

const SkeletonCard = () => (
  <div className="bg-gray-200 rounded-[30px] p-4 sm:p-[22px] flex flex-col justify-between min-h-[140px] sm:min-h-[165px] animate-pulse">
    <div className="w-8 h-8 bg-gray-300 rounded-lg"></div>
    <div>
      <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
      <div className="h-6 bg-gray-300 rounded w-1/2"></div>
    </div>
  </div>
);

const SkeletonReportItem = () => (
    <div className="bg-gray-200 rounded-[30px] p-4 sm:p-[22px] animate-pulse">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
            <div className="flex-grow">
                <div className="h-5 bg-gray-300 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-full"></div>
            </div>
            <div className="text-left sm:text-right flex-shrink-0 mt-2 sm:mt-0">
                <div className="h-4 bg-gray-300 rounded w-20"></div>
            </div>
        </div>
    </div>
);


const DashboardSkeleton = () => (
  <div className="flex flex-col h-full overflow-y-auto pb-6">
    <div className="bg-[rgba(255,255,255,0.6)] rounded-[19px] p-[13px] mb-[23px]">
      <div className="mb-4 sm:mb-6">
        <div className="h-6 bg-gray-300 rounded w-1/4 mb-2 animate-pulse"></div>
        <div className="h-4 bg-gray-300 rounded w-1/2 animate-pulse"></div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-[3px]">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>

    <div className="bg-[rgba(255,255,255,0.6)] rounded-[19px] p-[13px]">
      <div className="h-6 bg-gray-300 rounded w-1/3 mb-4 sm:mb-[20px] animate-pulse"></div>
      <div className="flex flex-col gap-2 sm:gap-[3px]">
        <SkeletonReportItem />
        <SkeletonReportItem />
        <SkeletonReportItem />
      </div>
    </div>
  </div>
);

export default DashboardSkeleton; 