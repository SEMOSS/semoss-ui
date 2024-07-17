import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useNotification } from '@semoss/ui';

import { runPixel } from '@/api';
import { SerializedState, StateStore } from '@/stores';
import { STATE_STORE_CURRENT_VERSION } from '@/stores/state/MigrationManager';
import { DefaultCells } from '@/components/cell-defaults';
import { DefaultBlocks } from '@/components/block-defaults';
import { Blocks, Renderer } from '@/components/blocks';
import { LoadingScreen } from '@/components/ui';
import { Typography } from '@semoss/ui';
import { MigrationManager } from '@/stores/state/MigrationManager';

const ACTIVE = 'page-1';

interface BlocksRendererProps {
    /** App to render */
    appId?: string;

    /** State to render */
    state?: SerializedState;

    /** Do we want to see load screen. Ex: preview on tooltip */
    preview?: boolean;
}

/**
 * Render a block app
 */
export const BlocksRenderer = observer((props: BlocksRendererProps) => {
    const { appId, state, preview } = props;
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
            .then(async ({ pixelReturn, errors, insightId }) => {
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

                // Run migration if not up to date
                if (s.version !== STATE_STORE_CURRENT_VERSION) {
                    const migration = await new MigrationManager();
                    s = await migration.run(s);
                }

                // create a new state store
                const store = new StateStore({
                    mode: 'interactive',
                    insightId: insightId,
                    state: s,
                    cellRegistry: DefaultCells,
                });

                // set it
                setStateStore(store);

                if (appId) {
                    const { errors: errs } = await runPixel(
                        `SetContext("${appId}");`,
                        insightId,
                    );

                    if (errs.length) {
                        notification.add({
                            color: 'error',
                            message: errs.join(''),
                        });
                    }
                }
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

    if (!stateStore || (isLoading && !preview)) {
        if (!preview) {
            return <LoadingScreen.Trigger />;
        } else {
            return <Typography variant="h6">Fetching Preview...</Typography>;
        }
    }

    return (
        <Blocks state={stateStore} registry={DefaultBlocks}>
            <Renderer id={ACTIVE} />
        </Blocks>
    );
});
