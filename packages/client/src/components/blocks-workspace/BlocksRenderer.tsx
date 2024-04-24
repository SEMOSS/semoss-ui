import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useNotification } from '@semoss/ui';

import { runPixel } from '@/api';
import { SerializedState, StateStore } from '@/stores';
import { DefaultCells } from '@/components/cell-defaults';
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

                const addedState = {
                    ...s,
                    parameters: {
                        uuid1: {
                            alias: 'database_id',
                            value: 'id-289892',
                            type: 'ENGINE_PARAMETER',
                        },
                        uuid2: {
                            alias: 'llm_dependency_param',
                            value: 'id-129019013',
                            type: 'ENGINE_PARAMETER',
                        },
                        uuid3: {
                            alias: 'ui-block-2',
                            value: '{{ui-block-2.value}}',
                            type: 'BLOCK_PARAMETER',
                        },
                        uuid4: {
                            alias: 'query-parameter',
                            value: '{{query-parameter.output}}',
                            type: 'QUERY_PARAMETER',
                        },

                        // {
                        //     state: {
                        //         queries: {},
                        //         blocks: {},
                        //         parameters: {
                        //             uuid1: {
                        //                 alias: 'text-block',
                        //                 type: 'BLOCK_PARAMETER',
                        //                 // --> Look through blocks and get block.value or how do we intend to handle that, more types? it wont always be .value
                        //             },
                        //             uuid2: {
                        //                 alias: 'llm-var',
                        //                 type: 'ENGINE_PARAMETER',
                        //                 // --> Should just point to an id, look at dependencies?  When you add an engine Parameter do i automatically add dependencies to app?
                        //             },
                        //             uuid3: {
                        //                 alias: 'query-cell',
                        //                 type: 'QUERY_PARAMETER',
                        //                 // --> Reference the output of a query/cell
                        //             },
                        //         }
                        //     }
                        // }
                    },
                };

                console.log('state: ', s);
                // create a new state store
                const store = new StateStore({
                    mode: 'interactive',
                    insightId: insightId,
                    state: addedState,
                    cellRegistry: DefaultCells,
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
