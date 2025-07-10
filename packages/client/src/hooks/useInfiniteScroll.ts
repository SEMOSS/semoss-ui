import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { EngineContext } from '../contexts';
import { useBlock, useBlocks } from '../../../../libs/renderer/src/hooks';
import { usePixel } from './usePixel';
import { AppMetadata } from '@/components/app';
// const [isLoading, setIsLoading] = useState<boolean>(false);
// const [sortOrder, setSortOrder] = useState('ASC');
// const [canCollect, setCanCollect] = useState(true);
// const [offset, setOffset] = useState(0);
export function useInfiniteScroll(engine: string, metaKey: string) {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [sortOrder, setSortOrder] = useState('ASC');
    const [data, setData] = useState<AppMetadata[]>();
    const [canCollect, setCanCollect] = useState(true);
    const [offset, setOffset] = useState(0);
    let scrollEle, scrollTimeout, currentScroll, previousScroll;
    const limit = 5;
    const offsetRef = useRef(0);
    offsetRef.current = offset;
    const canCollectRef = useRef(true);
    canCollectRef.current = canCollect;

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
            }, 500);
        }

        previousScroll = currentScroll;
    };

    const Myprojects = usePixel<AppMetadata[]>(
        engine
            ? `${engine}(metaKeys = [${metaKey}], limit=[${limit}], offset=[${offset}]);`
            : '',
        {
            silent: true,
        },
        // context.state.insightId,
    );
    useEffect(() => {
        if (Myprojects.status === 'SUCCESS') {
            setData(Myprojects.data);
        }
    }, [Myprojects.status, Myprojects.data]);
    /**
     * @desc infinite scroll
     */
    useEffect(() => {
        scrollEle = document.querySelector('#home__content');

        scrollEle.addEventListener('scroll', scrollAll);
        return () => {
            scrollEle.removeEventListener('scroll', scrollAll);
        };
    }, [scrollEle]);
    //);
    return { data };
}
