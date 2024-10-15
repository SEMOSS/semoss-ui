import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { styled, useNotification } from '@semoss/ui';

import { runPixel } from '@/api';
import {
    SerializedState,
    StateStore,
    MigrationManager,
    STATE_VERSION,
} from '@/stores';
import { DefaultCells } from '@/components/cell-defaults';
import { DefaultBlocks } from '@/components/block-defaults';
import { Blocks, Renderer } from '@/components/blocks';
import { LoadingScreen } from '@/components/ui';
import { Typography } from '@semoss/ui';
import { useSearchParams, useLocation } from 'react-router-dom';

const ACTIVE = 'page-1';

// Adding a styled container to set the scope for the root css
const StyledContainer = styled('div')(() => ({
    height: '100%',
    width: '100%',
}));

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
    const [searchParams, setSearchParams] = useSearchParams();

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [stateStore, setStateStore] = useState<StateStore | null>();
    const queryStringParams = new URLSearchParams(useLocation().search);

    useEffect(() => {
        // start the loading
        setIsLoading(true);

        let stateFilter;

        searchParams.forEach((value, key) => {
            if (key === 'state') {
                stateFilter = JSON.parse(value);
            }
        });

        // initialize a new insight
        let pixel = '';
        if (appId && !stateFilter) {
            pixel = `GetAppBlocksJson ( project=["${appId}"]);`;
        } else if (state || stateFilter) {
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
                if (appId && !stateFilter) {
                    s = pixelReturn[0].output;
                } else if (state || stateFilter) {
                    if (stateFilter) {
                        s = stateFilter;
                    } else {
                        s = state;
                    }
                } else {
                    return;
                }

                // ignore if there is state
                if (!s) {
                    return;
                }

                // run migration if not up to date
                if (s.version !== STATE_VERSION) {
                    const migration = new MigrationManager();
                    s = await migration.run(s);
                }

                // Replace variable values with query params
                const params = {};
                queryStringParams.forEach((value, key) => {
                    params[key] = value;
                });

                // create a new state store
                const store = new StateStore({
                    mode: 'interactive',
                    insightId: insightId,
                    state: s,
                    cellRegistry: DefaultCells,
                    initialParams: params,
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

                if (stateFilter) {
                    notification.add({
                        color: 'warning',
                        message:
                            'Please be mindful this may not represent the current state of the app, due to the filters present in the URL',
                    });
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
            <StyledContainer className="dnd-pg">
                <Renderer id={ACTIVE} />
            </StyledContainer>
        </Blocks>
    );
});
