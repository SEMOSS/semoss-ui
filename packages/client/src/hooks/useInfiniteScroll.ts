import { useEffect, useRef, useState } from 'react';

export function useInfiniteScroll({
    limit = 10,
    scrollElementId = null,
}: {
    limit?: number;
    scrollElementId?: string;
}) {
    const [canCollect, setCanCollect] = useState(true);
    const [offset, setOffset] = useState(0);

    const scrollElRef = useRef(null);
    const scrollTimeoutRef = useRef(null);
    const previousScrollRef = useRef(0);
    let currentScroll;

    const offsetRef = useRef(0);
    offsetRef.current = offset;
    const canCollectRef = useRef(true);
    canCollectRef.current = canCollect;

    const reset = () => {
        setOffset(0);
        setCanCollect(true);
    };

    const checkHasReached = (len: number) => {
        if (len < limit) {
            setCanCollect(false);
        } else {
            if (!canCollectRef.current) {
                setCanCollect(true);
            }
        }
    };

    const scrollAll = () => {
        currentScroll =
            scrollElRef.current.scrollTop + scrollElRef.current.offsetHeight;
        if (
            currentScroll > scrollElRef.current.scrollHeight * 0.75 &&
            currentScroll > previousScrollRef.current
        ) {
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }

            scrollTimeoutRef.current = setTimeout(() => {
                if (!canCollectRef.current) {
                    return;
                }

                setOffset(offsetRef.current + limit);
                offsetRef.current = offsetRef.current + limit;
            }, 500);
        }

        previousScrollRef.current = currentScroll;
    };

    useEffect(() => {
        reset();
    }, [limit]);

    useEffect(() => {
        scrollElRef.current = document.querySelector(
            scrollElementId || '#home__content',
        );

        if (!scrollElRef.current) {
            return;
        }

        scrollElRef.current?.addEventListener('scroll', scrollAll);
        return () => {
            scrollElRef.current?.removeEventListener('scroll', scrollAll);
        };
    }, [scrollElementId]);

    return {
        offset,
        checkHasReached,
        reset,
    };
}

export default useInfiniteScroll;
