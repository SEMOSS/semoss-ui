import { useCallback, useContext, useEffect, useState } from 'react';
import { BlocksContext } from '@/contexts';

import { usePixel } from './usePixel';

/**
 * Use a frame's in an insight
 *
 * @param frame
 * @param options
 */
export function useFrame(
    /** Frame to get data from */
    frame = '',

    /** Options for the frame */
    options: Partial<{
        /** Selector to grab the data */
        selector: string;

        /** Where to start grabbing the data */
        offset: number;

        /** How many to collect */
        limit: number;

        /** Enable the count */
        enableCount: boolean;
    }> = {},
) {
    const {
        selector = 'QueryAll()',
        offset = 0,
        limit = 1000,
        enableCount = false,
    } = options;

    const [isLoading, setIsLoading] = useState<boolean>(false);

    const context = useContext(BlocksContext);
    if (context === undefined) {
        throw new Error('useFrame must be used within Blocks');
    }

    const { state } = context;

    // get the frameKey, this will change whenever the data does
    const frameKey = state.getFrameKey(frame);

    /**
     * Filter the frame
     *
     * @param - filterPixel
     */
    const filterFrame = useCallback(
        async (filterPixel: string): Promise<boolean> => {
            try {
                setIsLoading(true);
                // filter the frame
                const response = await state.runSideEffect(
                    `META | ${frame} | ${filterPixel};`,
                );

                console.group(response);

                return true;
            } catch (e) {
                // log the error
                console.error(e);
                return false;
            } finally {
                setIsLoading(false);
            }
        },
        [frame],
    );

    /**
     * Filter the frame
     *
     * @param - filterPixel
     */
    const unfilterFrame = useCallback(async (): Promise<boolean> => {
        try {
            setIsLoading(true);

            // filter the frame
            const response = await state.runSideEffect(
                `META | UnfilterFrame("${frame}");`,
            );

            console.group(response);

            return true;
        } catch (e) {
            // log the error
            console.error(e);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Get the data
     */
    const getData = usePixel<{
        data: {
            headers: string[];
            values: unknown[][];
        };
    }>(
        frame
            ? `META | Frame("${frame}") | ${selector} | Offset(${offset}) ${
                  limit !== -1 ? `| Limit(${limit})` : ''
              } | Collect(${limit});`
            : '',
        {
            silent: true,
        },
        context.state.insightId,
    );

    /**
     * Get the count of all of the values
     */
    const getCount = usePixel<number>(
        enableCount && frame
            ? `META | Frame("${frame}") | ${selector} | Distinct(false) | QueryRowCount();`
            : '',
        {
            silent: true,
        },
        context.state.insightId,
    );

    // refresh the data whenever the key changes
    useEffect(() => {
        getData.refresh();
        getCount.refresh();
    }, [frameKey]);

    return {
        isLoading: isLoading || getData.status === 'LOADING',
        data:
            getData.status === 'SUCCESS'
                ? getData.data.data
                : {
                      headers: [],
                      values: [],
                  },
        error: getData.error,
        count: getCount.status === 'SUCCESS' ? getCount.data : -1,
        /** Actions */
        filter: filterFrame,
        unfilter: unfilterFrame,
    };
}
