import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import {
    useSearchParams,
    useLocation,
    Routes,
    Route,
    useNavigate,
} from "react-router-dom";
import {
    SwapAppDependencyInterface,
    SwapAppDependencyModal,
} from "./components/blocks/SwappAppDependencyModal";

import { runPixel, useInsight } from "@semoss/sdk";

import { LoadingScreen, Typography, useNotification } from "@semoss/ui";

import { Blocks } from "./components/blocks";
import { DefaultBlocks } from "./components/block-defaults";
import { DefaultCells } from "./components/cell-defaults";
import {
    Block,
    SerializedState,
    StateStore,
    MigrationManager,
    STATE_VERSION,
} from "./store/state";

// TODO: Add component library notification component

export interface RendererProps {
    /** App to render */
    appId?: string;

    /** State to render */
    state?: SerializedState;

    /**
     * TODO: REMOVE
     * Do we want to see load screen. Ex: preview on tooltip
     * */
    preview?: boolean;
}

/**
 * Render a block app
 */
export const Renderer = observer((props: RendererProps) => {
    const ACTIVE = "page-1";
    const { appId, state, preview } = props;
    const notification = useNotification();
    const [searchParams, setSearchParams] = useSearchParams();
    const { insightId, isAuthorized } = useInsight();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [stateStore, setStateStore] = useState<StateStore | null>();
    const queryStringParams = new URLSearchParams(useLocation().search);

    const [allPages, setAllPages] = useState<Block[]>([]);

    const [blocksInsightId, setBlocksInsightId] = useState("");
    const [checkDependencyModal, setCheckDependencyModal] = useState(false);
    const [preSwapState, setPreSwapState] = useState<SerializedState | null>();
    const [dependenciesToSwap, setDependenciesToSwap] = useState<
        SwapAppDependencyInterface | {}
    >({});

    useEffect(() => {
        if (isAuthorized) {
            // start the loading
            setIsLoading(true);

            let stateFilter;

            searchParams.forEach((value, key) => {
                if (key === "state") {
                    stateFilter = JSON.parse(value);
                }
            });

            // initialize a new insight
            let pixel = "";
            if (appId && !stateFilter) {
                pixel = `GetAppBlocksJson ( project=["${appId}"]); ValidateProjectDependencies(project=["${appId}"]);`;
            } else if (state || stateFilter) {
                pixel = `true`;
            } else {
                console.error("Missing appId or state");
            }

            // ignore if there is not pixel
            if (!pixel) {
                return;
            }

            // load the app
            runPixel<[SerializedState]>(pixel, "new")
                .then(async ({ pixelReturn, errors, insightId }) => {
                    if (errors.length) {
                        throw new Error(errors.join(""));
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
                                    color: "error",
                                    message: errs.join(""),
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
                    }
                    // ignore if there is state
                    if (!s) {
                        return;
                    }

                    initializeState(s);

                    if (stateFilter) {
                        notification.add({
                            color: "warning",
                            message:
                                "Please be mindful this may not represent the current state of the app, due to the filters present in the URL",
                        });
                    } else {
                        return;
                    }
                })
                .catch((e) => {
                    notification.add({
                        color: "error",
                        message: e.message,
                    });

                    console.log(e);
                })
                .finally(() => {
                    // close the loading screen
                    setIsLoading(false);
                });
        }
    }, [state, appId]);

    useEffect(() => {
        const firstPage = allPages[0];
        if (firstPage) {
            navigate(`${firstPage.data.route}`);
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
            mode: "interactive",
            insightId: blocksInsightId,
            state: s,
            cellRegistry: DefaultCells,
            initialParams: swaps,
        });

        setStateStore(store);

        const allBlocks = Object.values(store.blocks);

        setAllPages(allBlocks.filter((b) => b.widget == "page"));
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
        const dependencies = dependencyValidations["vars"];

        if (!dependencies) {
            notification.add({
                message: "checkAppdeps err",
                color: "error",
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

        const stateVariables = s["variables"];

        // Iterate through dependencies
        Object.entries(dependencies).forEach((keyValue) => {
            const key = keyValue[0];
            const value = keyValue[1];

            if (!value) {
                openModal = true;

                // we need to get replacements for this engine type
                engineObject[stateVariables[key].type]["needsReplace"] = true;

                // Add the variableKey to replace
                engineObject[stateVariables[key].type][
                    "variablesToReplace"
                ].push(key);
            }
        });

        let enginesPixel = "";
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
                if (resp.operationType.indexOf("ERROR") > -1) {
                    notification.add({
                        color: "error",
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
                <Renderer appId={pageId} />
            </Blocks>
        );
    };

    const viewApp = () => {
        if (preview) {
            return (
                <Blocks state={stateStore} registry={DefaultBlocks}>
                    <Renderer appId={ACTIVE} />
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
                    <LoadingScreen>
                        <LoadingScreen.Trigger />
                    </LoadingScreen>
                ) : (
                    <Typography variant="h6">Fetching Preview...</Typography>
                )
            ) : (
                viewApp()
            )}
        </>
    );
});
