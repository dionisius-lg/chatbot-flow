import { usePaginationRange, getPaginationInfo, PaginationDots } from '../../lib/pagination';

import type { PaginationInfo } from '../../types';

interface PaginationProps {
    pagination: PaginationInfo;
    onPageChange: (page: number) => void;
}

export default function Pagination({ pagination, onPageChange }: PaginationProps) {
    const { total, per_page, current_page, paging } = pagination;
    const pageRange = usePaginationRange({ total, limit: per_page, current: current_page });
    const info = getPaginationInfo(total, per_page, current_page);

    if (!pageRange || pageRange.length < 2) {
        return null;
    }

    return (
        <div className='flex items-center justify-between mt-6 pt-4 border-t border-gray-200'>
            {/* Info text */}
            <div className='text-xs text-gray-500'>
                Showing {info.lowest} to {info.highest} of {info.total.toLocaleString()} entries
            </div>

            {/* Page buttons */}
            <nav className='flex items-center gap-1'>
                {/* Previous button */}
                <button
                    type='button'
                    onClick={() => onPageChange(paging.previous)}
                    disabled={current_page === paging.first}
                    className='px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer'
                >
                    Prev
                </button>

                {/* Page numbers */}
                {pageRange.map((pageNumber, idx) => {
                    if (pageNumber === PaginationDots) {
                        return (
                            <span key={`dots-${idx}`} className='px-2 py-1.5 text-xs text-gray-400'>
                                &hellip;
                            </span>
                        );
                    }

                    const isActive = pageNumber === current_page;

                    return (
                        <button
                            key={pageNumber}
                            type='button'
                            onClick={() => onPageChange(pageNumber)}
                            className={`px-3 py-1.5 text-xs border rounded-lg cursor-pointer ${
                                isActive
                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                    : 'border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            {pageNumber}
                        </button>
                    );
                })}

                {/* Next button */}
                <button
                    type='button'
                    onClick={() => onPageChange(paging.next)}
                    disabled={current_page === paging.last}
                    className='px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer'
                >
                    Next
                </button>
            </nav>
        </div>
    );
}
