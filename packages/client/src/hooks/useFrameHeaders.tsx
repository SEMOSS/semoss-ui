import { useContext, useEffect } from 'react';
import { BlocksContext } from '@/contexts';

import { usePixel } from './usePixel';

/**
 * Use a frame's header's in an insight
 *
 * @param frame
 * @param options
 */
export function useFrameHeaders(
    /** Frame to get data from */
    frame = '',

    /** Options for the frame */
    options: Partial<{
        /** Selector to grab the data */
        headerTypes: string[];
    }> = {},
) {
    const { headerTypes = [] } = options;

    const context = useContext(BlocksContext);
    if (context === undefined) {
        throw new Error('useFrameHeaders must be used within Blocks');
    }

    const { state } = context;

    // get the frameKey, this will change whenever the data does
    const frameKey = state.getFrameKey(frame);

    /**
     * Get the headers
     */
    const getHeaders = usePixel<{
        name: string;
        type: string;
        headerInfo: {
            headers: {
                alias: string;
                header: string;
                dataType: string;
                adtlType: string;
                qsName: unknown;
            }[];
            joins: unknown[];
        };
    }>(
        frame
            ? `META | ${frame} | FrameHeaders(${
                  headerTypes && headerTypes.length !== 0
                      ? `headerTypes=${JSON.stringify(headerTypes)}`
                      : ''
              });`
            : '',
        {
            silent: true,
        },
        context.state.insightId,
    );

    // refresh the data whenever the key changes
    useEffect(() => {
        getHeaders.refresh();
    }, [frameKey]);

    return {
        isLoading: getHeaders.status === 'LOADING',
        data:
            getHeaders.status === 'SUCCESS'
                ? {
                      list: getHeaders.data.headerInfo.headers,
                  }
                : {
                      list: [],
                  },
        error: getHeaders.error,
    };
}
