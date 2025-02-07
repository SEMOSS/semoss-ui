import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useNotification } from '@semoss/ui';

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
import { Typography, Modal, styled, Box, Select, Button } from '@semoss/ui';
import {
    Routes,
    Route,
    useSearchParams,
    useLocation,
    useNavigate,
} from 'react-router-dom';

const ACTIVE = 'page-1';

interface BlocksRendererProps {
    /** App to render */
    appId?: string;

    /** State to render */
    state?: SerializedState;

    /** Do we want to see load screen. Ex: preview on tooltip */
    preview?: boolean;
}

const FlexBox = styled(Box)(() => ({
    display: 'flex',
    marginBottom: '20px',
}));

/**
 * Render a block app
 */
export const BlocksRenderer = observer((props: BlocksRendererProps) => {
    const { appId, state, preview } = props;
    const naviagte = useNavigate();
    const notification = useNotification();
    const [searchParams, setSearchParams] = useSearchParams();

    const [allPages, setAllPages] = useState<Block[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [stateStore, setStateStore] = useState<StateStore | null>();
    const queryStringParams = new URLSearchParams(useLocation().search);
    const [falseVarModal, setFalseVarModal] = useState<boolean>(false);
    const [falseVars, setFalseVars] = useState({});
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
            pixel = `GetAppBlocksJson ( project=["${appId}"]);ValidateProjectDependencies(project=["${appId}"])`;
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
                const falseVars = {};

                // get variables that are fasle;
                if (Object.keys(pixelReturn[1].output?.vars).length) {
                    for (const prop in pixelReturn[1].output?.vars) {
                        if (!pixelReturn[1].output.vars[prop]) {
                            // create var on false var object
                            // display is what we show to the user
                            // newValue will be the value associated with display database id that will become the new value in the store
                            falseVars[prop] = {
                                newValue: '',
                                displayValue: '',
                                options: [],
                            };
                        }
                    }
                }

                // if there are false variables get engines they can swap with

                if (Object.keys(falseVars).length) {
                    Object.keys(falseVars).forEach((falseVar, falseVarIdx) => {
                        if (falseVar in pixelReturn[0].output.variables) {
                            // if its false get engines
                            runPixel<[any]>(
                                `MyEngines ( engineTypes = [ "${pixelReturn[0].output.variables[
                                    falseVar
                                ].type.toUpperCase()}"]) ;`,
                                'new',
                            ).then(
                                async ({ pixelReturn, errors, insightId }) => {
                                    if (errors.length) {
                                        throw new Error(errors.join(''));
                                    }
                                    const { output } = pixelReturn[0];
                                    output.forEach((datum) => {
                                        const { database_name, database_id } =
                                            datum;

                                        // create option list for modal

                                        falseVars[falseVar].options.push({
                                            display: database_name,
                                            value: database_id,
                                        });
                                    });
                                    if (
                                        falseVarIdx ===
                                        Object.keys(falseVars).length - 1
                                    ) {
                                        // set the modal to true if its the end of array
                                        setFalseVars(falseVars);
                                        setFalseVarModal(true);
                                    }
                                },
                            );
                        } else {
                            if (
                                falseVarIdx ===
                                Object.keys(falseVars).length - 1
                            ) {
                                // set the modal true if its the end of the array
                                setFalseVars(falseVars);
                                setFalseVarModal(true);
                            }
                        }
                    });
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

                debugger;
                // create a new state store
                const store = new StateStore({
                    mode: 'interactive',
                    insightId: insightId,
                    state: s,
                    cellRegistry: DefaultCells,
                    initialParams: params,
                });

                console.log(store);

                // set it
                setStateStore(store);

                const allBlocks = Object.values(store.blocks);
                setAllPages(allBlocks.filter((b) => b.widget == 'page'));

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

    useEffect(() => {
        const firstPage = allPages[0];
        if (firstPage) {
            naviagte(`${firstPage.data.route}`);
        }
    }, [allPages.length]);

    if (!stateStore || (isLoading && !preview)) {
        if (!preview) {
            return <LoadingScreen.Trigger />;
        } else {
            return <Typography variant="h6">Fetching Preview...</Typography>;
        }
    }

    const getPage = (pageId: string) => {
        return (
            <div>
                <Modal
                    open={falseVarModal}
                    fullWidth
                    onClose={() => setFalseVarModal(false)}
                >
                    <Modal.Actions sx={{ width: '100%' }}>
                        {Object.keys(falseVars).map((key, keyIdx) => {
                            return (
                                <Select
                                    key={keyIdx}
                                    sx={{ width: '100%' }}
                                    onChange={(val) => {
                                        setFalseVars((prevState) => {
                                            const prevFalseValues = {
                                                ...prevState,
                                            };

                                            // set the new value to be the database id of the value selected
                                            prevFalseValues[key].newValue =
                                                prevFalseValues[
                                                    key
                                                ].options.filter(
                                                    (opt) =>
                                                        opt.display ===
                                                        val.target.value,
                                                )[0].value;
                                            prevFalseValues[key].displayValue =
                                                prevFalseValues[
                                                    key
                                                ].options.filter(
                                                    (opt) =>
                                                        opt.display ===
                                                        val.target.value,
                                                )[0].display;

                                            // return updated falsevar object
                                            return prevFalseValues;
                                        });
                                    }}
                                    value={falseVars[key].displayValue}
                                    label={`${key}`}
                                >
                                    {falseVars[key].options.map(
                                        (opt, optIdx) => {
                                            console.log(opt);
                                            return (
                                                <Select.Item
                                                    key={optIdx}
                                                    value={opt.display}
                                                >
                                                    {opt.display}
                                                </Select.Item>
                                            );
                                        },
                                    )}
                                </Select>
                            );
                        })}

                        <Button
                            onClick={() => {
                                setFalseVars((prevState) => {
                                    const prevFalseValues = { ...prevState };
                                    for (const prop in prevFalseValues) {
                                        prevFalseValues[prop].newValue = '';
                                    }
                                    return prevFalseValues;
                                });
                                setFalseVarModal(false);
                            }}
                            variant="outlined"
                            color="error"
                        >
                            Cancel
                        </Button>
                        <Button
                            disabled={Object.keys(falseVars).some(
                                (falseVar) => !falseVars[falseVar].newValue,
                            )}
                            onClick={() => {
                                setStateStore((prevState: any) => {
                                    // update the state store to have the new values
                                    for (const prop in falseVars) {
                                        if (prop in prevState.variables) {
                                            prevState.variables[prop].value =
                                                falseVars[prop].newValue;
                                        }
                                    }

                                    return prevState;
                                });
                            }}
                        >
                            Submit
                        </Button>
                    </Modal.Actions>
                </Modal>
                <Blocks state={stateStore} registry={DefaultBlocks}>
                    <Renderer id={pageId} />
                </Blocks>
            </div>
        );
    };

    preview ? (
        <Blocks state={stateStore} registry={DefaultBlocks}>
            <Renderer id={ACTIVE} />
        </Blocks>
    ) : allPages.length ? (
        <Routes>
            {allPages.map((page) => (
                <Route
                    path={page.data.route as string}
                    element={getPage(page.id)}
                    key={page.id}
                />
            ))}
        </Routes>
    ) : (
        <></>
    );
});
