import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useNotification } from '@semoss/ui';

import { runPixel } from '@/api';
import { SerializedState, StateStore } from '@/stores';
import { DefaultCellTypes } from '@/components/cell-defaults';
import { DefaultBlocks } from '@/components/block-defaults';
import { Blocks, Renderer } from '@/components/blocks';
import { LoadingScreen } from '@/components/ui';

const ACTIVE = 'page-1';

interface BlocksRendererProps {
    /** App to render */
    appId: string;
}

/**
 * Render a block app
 */
export const BlocksRenderer = observer((props: BlocksRendererProps) => {
    const { appId } = props;
    const notification = useNotification();

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [state, setState] = useState<StateStore>();

    useEffect(() => {
        // start the loading
        setIsLoading(true);

        // load the app
        runPixel<[SerializedState]>(
            `GetAppBlocksJson ( project=["${appId}"]);`,
            'new',
        )
            .then(({ pixelReturn, errors, insightId }) => {
                if (errors.length) {
                    throw new Error(errors.join(''));
                }

                // get the output (SerializedState)
                const { output } = pixelReturn[0];

                // create a new state store
                const s = new StateStore({
                    insightId: insightId,
                    state: output,
                    cellTypeRegistry: DefaultCellTypes,
                });

                // set it
                setState(s);
            })
            .catch((e) => {
                notification.add({
                    color: 'error',
                    message: e.message,
                });
            })
            .finally(() => {
                // close the loading screen
                setIsLoading(false);
            });
    }, [appId]);

    if (!state || isLoading) {
        return <LoadingScreen.Trigger />;
    }

    return (
        <Blocks state={state} registry={DefaultBlocks}>
            <Renderer id={ACTIVE} />
        </Blocks>
    );
});
