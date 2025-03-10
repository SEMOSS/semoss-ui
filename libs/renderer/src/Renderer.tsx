import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useSearchParams, useLocation } from "react-router-dom";

import { runPixel, useInsight } from "@semoss/sdk";
import {
    Button,
    LoadingScreen,
    Notification,
    Typography,
    useNotification,
} from "@semoss/ui";

import { Blocks, RendererEngine } from "./components/blocks";
import { DefaultBlocks } from "./components/block-defaults";
import { DefaultCells } from "./components/cell-defaults";
import { getHomePage } from "./utility";
import {
    MigrationManager,
    SerializedState,
    STATE_VERSION,
    StateStore,
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
    const { appId, state, preview } = props;
    // const notification = useNotification();
    const [searchParams, setSearchParams] = useSearchParams();
    const { insightId, isAuthorized } = useInsight();

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [stateStore, setStateStore] = useState<StateStore | null>();
    const queryStringParams = new URLSearchParams(useLocation().search);

    const [homePage, setHomePage] = useState("");

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
                pixel = `GetAppBlocksJson ( project=["${appId}"]);`;
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

                    const active = await getHomePage(s);
                    setHomePage(active);

                    // Replace variable values with query params
                    const params = {};
                    queryStringParams.forEach((value, key) => {
                        params[key] = value;
                    });

                    // create a new state store
                    const store = new StateStore({
                        mode: "interactive",
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
                            // notification.add({
                            //     color: "error",
                            //     message: errs.join(""),
                            // });
                        }
                    }

                    if (stateFilter) {
                        // notification.add({
                        //     color: "warning",
                        //     message:
                        //         "Please be mindful this may not represent the current state of the app, due to the filters present in the URL",
                        // });
                    }
                })
                .catch((e) => {
                    // notification.add({
                    //     color: "error",
                    //     message: e.message,
                    // });

                    console.log(e);
                })
                .finally(() => {
                    // close the loading screen
                    setIsLoading(false);
                });
        }
    }, [state, appId, isAuthorized]);

    if (!isAuthorized) {
        return (
            <Typography variant="h6">Authorizing Renderer SDK...</Typography>
        );
        // return <LoadingScreen.Trigger message="Authorizing Renderer SDK"/>;
    }

    if (!stateStore || (isLoading && !preview)) {
        if (!preview) {
            return <Typography variant="h6">Initializing Blocks...</Typography>;
            // return <LoadingScreen.Trigger message="Initializing Blocks"/>;
        } else {
            return <Typography variant="h6">Fetching Preview...</Typography>;
        }
    }

    return (
        <Notification>
            <Blocks state={stateStore} registry={DefaultBlocks}>
                <RendererEngine id={homePage} />
            </Blocks>
        </Notification>
    );
});
