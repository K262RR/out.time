import React from 'react';

const SkeletonEmployeeItem = () => (
    <div className="bg-gray-200 rounded-[16px] p-4 animate-pulse">
        <div className="flex justify-between items-center mb-4">
            <div className="h-5 bg-gray-300 rounded w-1/3"></div>
            <div className="h-5 bg-gray-300 rounded w-1/4"></div>
        </div>
        <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-2/3"></div>
        <div className="border-t border-gray-300 pt-2 mt-4 flex justify-end">
             <div className="h-4 bg-gray-300 rounded w-16"></div>
        </div>
    </div>
);

const EmployeeListSkeleton = ({ count = 5 }) => (
    <div className="flex flex-col gap-2">
        {Array.from({ length: count }).map((_, i) => (
            <SkeletonEmployeeItem key={i} />
        ))}
    </div>
);

export default EmployeeListSkeleton; 