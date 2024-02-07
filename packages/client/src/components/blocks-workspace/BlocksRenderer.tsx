import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useNotification } from '@/component-library';

import { runPixel } from '@/api';
import { SerializedState, StateStore } from '@/stores';
import { DefaultCellTypes } from '@/components/cell-defaults';
import { DefaultBlocks } from '@/components/block-defaults';
import { Blocks, Renderer } from '@/components/blocks';
import { LoadingScreen } from '@/components/ui';

const ACTIVE = 'page-1';

interface BlocksRendererProps {
    /** App to render */
    appId?: string;

    /** State to render */
    state?: SerializedState;
}

/**
 * Render a block app
 */
export const BlocksRenderer = observer((props: BlocksRendererProps) => {
    const { appId, state } = props;
    const notification = useNotification();

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [stateStore, setStateStore] = useState<StateStore | null>();

    useEffect(() => {
        // start the loading
        setIsLoading(true);

        // initialize a new insight
        let pixel = '';
        if (appId) {
            pixel = `GetAppBlocksJson ( project=["${appId}"]);`;
        } else if (state) {
            pixel = `true`;
        } else {
            console.error('Missing appId or state');
        }

        // ignore if there is not pixel
        if (!pixel) {
            return;
        }

        // load the app
        runPixel<[SerializedState]>(pixel, 'new')
            .then(({ pixelReturn, errors, insightId }) => {
                if (errors.length) {
                    throw new Error(errors.join(''));
                }

                // set the state
                let s: SerializedState;
                if (appId) {
                    s = pixelReturn[0].output;
                } else if (state) {
                    s = state;
                } else {
                    return;
                }

                // ignore if there is state
                if (!s) {
                    return;
                }

                // create a new state store
                const store = new StateStore({
                    mode: 'interactive',
                    insightId: insightId,
                    state: s,
                    cellTypeRegistry: DefaultCellTypes,
                });

                // set it
                setStateStore(store);
            })
            .catch((e) => {
                notification.add({
                    color: 'error',
                    message: e.message,
                });

                console.log(e);
            })
            .finally(() => {
                // close the loading screen
                setIsLoading(false);
            });
    }, [state, appId]);

    if (!stateStore || isLoading) {
        return <LoadingScreen.Trigger />;
    }

    return (
        <Blocks state={stateStore} registry={DefaultBlocks}>
            <Renderer id={ACTIVE} />
        </Blocks>
    );
});
