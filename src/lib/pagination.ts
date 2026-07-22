import { useMemo } from 'react';

export const PaginationDots = '...';

export interface PaginationRangeParams {
    total: number;
    limit: number;
    current: number;
    sibling?: number;
}

export function usePaginationRange({
    total,
    limit,
    current,
    sibling = 1,
}: PaginationRangeParams): (number | typeof PaginationDots)[] {
    return useMemo(() => {
        const totalPageCount = Math.ceil(total / limit);

        const totalPageNumbers = sibling + 5;

        if (totalPageNumbers >= totalPageCount) {
            return range(1, totalPageCount);
        }

        const leftSiblingIndex = Math.max(current - sibling, 1);
        const rightSiblingIndex = Math.min(current + sibling, totalPageCount);

        const shouldShowLeftDots = leftSiblingIndex > 2;
        const shouldShowRightDots = rightSiblingIndex < totalPageCount - 2;

        const firstPageIndex = 1;
        const lastPageIndex = totalPageCount;

        if (!shouldShowLeftDots && shouldShowRightDots) {
            const leftItemCount = 3 + 2 * sibling;
            const leftRange = range(1, leftItemCount);
            return [...leftRange, PaginationDots, lastPageIndex];
        }

        if (shouldShowLeftDots && !shouldShowRightDots) {
            const rightItemCount = 3 + 2 * sibling;
            const rightRange = range(totalPageCount - rightItemCount + 1, totalPageCount);
            return [firstPageIndex, PaginationDots, ...rightRange];
        }

        if (shouldShowLeftDots && shouldShowRightDots) {
            const middleRange = range(leftSiblingIndex, rightSiblingIndex);
            return [firstPageIndex, PaginationDots, ...middleRange, PaginationDots, lastPageIndex];
        }

        return [];
    }, [total, limit, sibling, current]);
}

function range(start: number, end: number): number[] {
    const length = end - start + 1;
    return Array.from({ length }, (_, idx) => idx + start);
}

export interface PaginationInfoResult {
    lowest: number;
    highest: number;
    total: number;
}

export function getPaginationInfo(total: number, limit: number, current: number): PaginationInfoResult {
    const firstIndex = current * limit - limit + 1;
    let lastIndex = current * limit;

    if (lastIndex > total) {
        lastIndex = total;
    }

    return {
        lowest: firstIndex,
        highest: lastIndex,
        total,
    };
}
