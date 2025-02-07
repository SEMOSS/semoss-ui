import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Button, Grid, Menu, Modal, Select, useNotification } from '@semoss/ui';

import { runPixel } from '@/api';
import {
    Block,
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
import {
    Routes,
    Route,
    useSearchParams,
    useLocation,
    useNavigate,
} from 'react-router-dom';
import {
    SwapAppDependencyModal,
    SwapAppDependencyInterface,
} from '../blocks/SwapAppDependencyModal';

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
    const naviagte = useNavigate();
    const notification = useNotification();
    const [searchParams, setSearchParams] = useSearchParams();

    // TODO: Consolidate useStates if neccessary
    const [allPages, setAllPages] = useState<Block[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const queryStringParams = new URLSearchParams(useLocation().search);

    const [stateStore, setStateStore] = useState<StateStore | null>();

    const [blocksInsightId, setBlocksInsightId] = useState('');
    const [checkDependencyModal, setCheckDependencyModal] = useState(false);
    const [preSwapState, setPreSwapState] = useState<SerializedState | null>();
    const [dependenciesToSwap, setDependenciesToSwap] = useState<
        SwapAppDependencyInterface | {}
    >({});

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
            pixel = `GetAppBlocksJson ( project=["${appId}"]); ValidateProjectDependencies(project=["${appId}"]);`;
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

                setBlocksInsightId(insightId);

                let s: SerializedState;

                if (appId && !stateFilter) {
                    s = pixelReturn[0].output;

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

                    checkAppDependencies(s, pixelReturn[1].output);

                    return;
                } else if (state || stateFilter) {
                    if (stateFilter) {
                        s = stateFilter;
                    } else {
                        s = state;
                    }

                    if (!s) {
                        return;
                    }

                    initializeState(s);

                    if (stateFilter) {
                        notification.add({
                            color: 'warning',
                            message:
                                'Please be mindful this may not represent the current state of the app, due to the filters present in the URL',
                        });
                    }
                } else {
                    return;
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

    useEffect(() => {
        const firstPage = allPages[0];
        if (firstPage) {
            naviagte(`${firstPage.data.route}`);
        }
    }, [allPages.length]);

    /**
     * 1. Run Migration on state
     * 2. Initialize state
     */
    const initializeState = async (
        s: SerializedState,
        swaps: Record<string, string> | {} = {},
    ) => {
        if (!s) {
            return;
        }

        // run migration if not up to date
        if (s.version !== STATE_VERSION) {
            const migration = new MigrationManager();
            s = await migration.run(s);
        }

        // create a new state store
        const store = new StateStore({
            mode: 'interactive',
            insightId: blocksInsightId,
            state: s,
            cellRegistry: DefaultCells,
            initialParams: swaps,
        });

        setStateStore(store);

        const allBlocks = Object.values(store.blocks);
        setAllPages(allBlocks.filter((b) => b.widget == 'page'));
    };

    /**
     *
     * @param s
     * @param dependencyValidations
     * Look through dependencyValidationObj
     * if any are false show modal
     * else initialize state
     */
    const checkAppDependencies = async (
        s: SerializedState,
        dependencyValidations,
    ) => {
        const dependencies = dependencyValidations['vars'];

        if (!dependencies) {
            notification.add({
                message: 'checkAppdeps err',
                color: 'error',
            });
        }

        let openModal = false;

        const engineObject: SwapAppDependencyInterface = {
            vector: {
                needsReplace: false,
                variablesToReplace: [],
                options: [],
            },
            model: {
                needsReplace: false,
                variablesToReplace: [],
                options: [],
            },
            database: {
                needsReplace: false,
                variablesToReplace: [],
                options: [],
            },
            storage: {
                needsReplace: false,
                variablesToReplace: [],
                options: [],
            },
            function: {
                needsReplace: false,
                variablesToReplace: [],
                options: [],
            },
        };

        const stateVariables = s['variables'];

        // Iterate through dependencies
        Object.entries(dependencies).forEach((keyValue) => {
            const key = keyValue[0];
            const value = keyValue[1];

            if (!value) {
                openModal = true;

                // we need to get replacements for this engine type
                engineObject[stateVariables[key].type]['needsReplace'] = true;

                // Add the variableKey to replace
                engineObject[stateVariables[key].type][
                    'variablesToReplace'
                ].push(key);
            }
        });

        let enginesPixel = '';
        let myEnginesPixelOrder = [];

        // Iterate through engineObject if any key/engineTypes needs replace call the MyEnginesReactor
        Object.entries(engineObject).forEach(async (keyValue) => {
            const key = keyValue[0];
            const value = keyValue[1];

            if (value.needsReplace) {
                enginesPixel += `MyEngines(engineTypes=[${key.toUpperCase()}], limit=[-1]) ;`;
                myEnginesPixelOrder.push(key);
            }
        });

        if (!openModal) {
            initializeState(s);
        } else {
            const enginesResp = await runPixel(enginesPixel);

            myEnginesPixelOrder.forEach((type, i) => {
                const resp = enginesResp.pixelReturn[i];
                const output = resp.output as string;

                // Error handle
                if (resp.operationType.indexOf('ERROR') > -1) {
                    notification.add({
                        color: 'error',
                        message: output,
                    });

                    return;
                } else {
                    engineObject[type].options = output;
                }
            });

            setPreSwapState(s);
            setDependenciesToSwap(engineObject);
            setCheckDependencyModal(openModal);
        }
    };

    const getPage = (pageId: string) => {
        return (
            <Blocks state={stateStore} registry={DefaultBlocks}>
                <Renderer id={pageId} />
            </Blocks>
        );
    };

    const viewApp = () => {
        if (preview) {
            return (
                <Blocks state={stateStore} registry={DefaultBlocks}>
                    <Renderer id={ACTIVE} />
                </Blocks>
            );
        } else if (allPages.length) {
            return (
                <Routes>
                    {allPages.map((page) => (
                        <Route
                            path={page.data.route as string}
                            element={getPage(page.id)}
                            key={page.id}
                        />
                    ))}
                </Routes>
            );
        } else {
            return <></>;
        }
    };

    return (
        <>
            <SwapAppDependencyModal
                open={checkDependencyModal}
                dependenciesToSwap={dependenciesToSwap}
                onClose={(swaps) => {
                    setCheckDependencyModal(false);
                    initializeState(preSwapState, swaps);
                }}
            />

            {/* Handles Logic for when state store is not initialized */}
            {!checkDependencyModal &&
            (!stateStore || (isLoading && !preview)) ? (
                !preview ? (
                    <LoadingScreen.Trigger />
                ) : (
                    <Typography variant="h6">Fetching Preview...</Typography>
                )
            ) : (
                viewApp()
            )}
        </>
    );
});
