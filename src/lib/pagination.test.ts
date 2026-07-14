import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { usePaginationRange, getPaginationInfo, PaginationDots } from './pagination';

describe('pagination helpers', () => {
    describe('getPaginationInfo', () => {
        it('calculates page range bounds correctly on the first page', () => {
            const result = getPaginationInfo(12, 5, 1);
            expect(result).toEqual({
                lowest: 1,
                highest: 5,
                total: 12,
            });
        });

        it('calculates page range bounds correctly on the middle page', () => {
            const result = getPaginationInfo(12, 5, 2);
            expect(result).toEqual({
                lowest: 6,
                highest: 10,
                total: 12,
            });
        });

        it('restricts highest index to total count on the last page', () => {
            const result = getPaginationInfo(12, 5, 3);
            expect(result).toEqual({
                lowest: 11,
                highest: 12,
                total: 12,
            });
        });

        it('handles empty results correctly', () => {
            const result = getPaginationInfo(0, 5, 1);
            expect(result).toEqual({
                lowest: 1,
                highest: 0,
                total: 0,
            });
        });
    });

    describe('usePaginationRange', () => {
        it('returns all pages without ellipsis when pages fit within threshold', () => {
            const { result } = renderHook(() =>
                usePaginationRange({
                    total: 20,
                    limit: 5,
                    current: 2,
                    sibling: 1,
                }),
            );
            expect(result.current).toEqual([1, 2, 3, 4]);
        });

        it('shows only right ellipsis when user is near the beginning', () => {
            const { result } = renderHook(() =>
                usePaginationRange({
                    total: 50,
                    limit: 5,
                    current: 2,
                    sibling: 1,
                }),
            );
            expect(result.current).toEqual([1, 2, 3, 4, 5, PaginationDots, 10]);
        });

        it('shows only left ellipsis when user is near the end', () => {
            const { result } = renderHook(() =>
                usePaginationRange({
                    total: 50,
                    limit: 5,
                    current: 9,
                    sibling: 1,
                }),
            );
            expect(result.current).toEqual([1, PaginationDots, 6, 7, 8, 9, 10]);
        });

        it('shows both left and right ellipses when user is in the middle', () => {
            const { result } = renderHook(() =>
                usePaginationRange({
                    total: 50,
                    limit: 5,
                    current: 5,
                    sibling: 1,
                }),
            );
            expect(result.current).toEqual([1, PaginationDots, 4, 5, 6, PaginationDots, 10]);
        });
    });
});
