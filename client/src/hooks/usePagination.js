import { useState, useMemo, useCallback } from "react";

/**
 * Custom hook for managing pagination state.
 * @param {object} initial - { initialPage, initialLimit, initialTotal }
 * @returns {object} - Pagination state and handlers
 */
export function usePagination({ initialPage = 1, initialLimit = 20, initialTotal = 0 } = {}) {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [total, setTotal] = useState(initialTotal);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(total / limit));
  }, [total, limit]);

  const canPrev = page > 1;
  const canNext = page < totalPages;

  const nextPage = useCallback(() => {
    setPage((p) => Math.min(totalPages, p + 1));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setPage((p) => Math.max(1, p - 1));
  }, []);

  const goToPage = useCallback(
    (targetPage) => {
      const p = Math.max(1, Math.min(totalPages, targetPage));
      setPage(p);
    },
    [totalPages]
  );

  const resetPagination = useCallback(() => {
    setPage(1);
  }, []);

  return {
    page,
    setPage,
    limit,
    setLimit,
    total,
    setTotal,
    totalPages,
    canPrev,
    canNext,
    nextPage,
    prevPage,
    goToPage,
    resetPagination,
  };
}

export default usePagination;
