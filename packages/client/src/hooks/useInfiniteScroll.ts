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

    let scrollEle, scrollTimeout, currentScroll, previousScroll;
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
        currentScroll = scrollEle.scrollTop + scrollEle.offsetHeight;
        if (
            currentScroll > scrollEle.scrollHeight * 0.75 &&
            currentScroll > previousScroll
        ) {
            if (scrollTimeout) {
                clearTimeout(scrollTimeout);
            }

            scrollTimeout = setTimeout(() => {
                if (!canCollectRef.current) {
                    return;
                }

                setOffset(offsetRef.current + limit);
                offsetRef.current = offsetRef.current + limit;
            }, 500);
        }

        previousScroll = currentScroll;
    };

    useEffect(() => {
        reset();
    }, [limit]);

    useEffect(() => {
        scrollEle = document.querySelector(scrollElementId || '#home__content');

        scrollEle?.addEventListener('scroll', scrollAll);
        return () => {
            scrollEle?.removeEventListener('scroll', scrollAll);
        };
    }, [scrollEle]);

    return {
        offset,
        checkHasReached,
        reset,
    };
}

export default useInfiniteScroll;
