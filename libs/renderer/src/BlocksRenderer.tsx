import React, { useEffect, useState } from "react";
import {
    Stack,
    Typography,
    Button,
    styled,
    ToggleTabsGroup,
    TextField,
    InputAdornment,
    useNotification,
} from "@semoss/ui";

import { useSearchParams, useLocation } from "react-router-dom";
import { observer } from "mobx-react-lite";

import {
    MigrationManager,
    SerializedState,
    STATE_VERSION,
    StateStore,
} from "./store/state";
import { Blocks, Renderer } from "./components/blocks";
import { DefaultBlocks } from "./components/block-defaults";
import { DefaultCells } from "./components/cell-defaults";

import { Env, runPixel } from "@semoss/sdk";
import { InsightProvider, useInsight } from "@semoss/sdk-react";

const ACTIVE = "page-1";

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
    const { insightId, isAuthorized } = useInsight();

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [stateStore, setStateStore] = useState<StateStore | null>();
    const queryStringParams = new URLSearchParams(useLocation().search);

    useEffect(() => {
        const test = async () => {
            debugger;
            const { errors, pixelReturn } = await runPixel("MyEngines();");
        };

        if (isAuthorized) {
            test();
        }
    }, [isAuthorized]);

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

            const initializeState = async () => {
                // set the state
                let s: SerializedState;

                if (state) {
                    if (stateFilter) {
                        s = stateFilter;
                    } else {
                        s = state;
                    }
                }

                // run migration if not up to date
                if (s.version !== STATE_VERSION) {
                    const migration = new MigrationManager();
                    s = await migration.run(s);
                }

                // create a new state store
                const store = new StateStore({
                    mode: "interactive",
                    insightId: "new",
                    state: s,
                    cellRegistry: DefaultCells,
                    initialParams: {},
                });

                // set it
                setStateStore(store);
            };

            initializeState().finally(() => {
                // close the loading screen
                setIsLoading(false);
            });
        }
    }, [state, appId, isAuthorized]);

    if (!isAuthorized) {
        return <>SDK not LOGGED IN</>;
    }

    if (!stateStore || (isLoading && !preview)) {
        if (!preview) {
            return <Typography variant="h6">Show Loading...</Typography>;
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

export const Bricks = (props) => {
    const { state, MODULE } = props;

    Env.update({
        MODULE: MODULE || "",

        ACCESS_KEY: process.env.ACCESS_KEY || "",

        SECRET_KEY: process.env.SECRET_KEY || "",

        APP: process.env.APP || "",
    });

    console.log("SUCCESSFULLY PASSED MODULE", MODULE);

    return (
        <InsightProvider>
            <Stack sx={{ border: "solid red" }}>
                <Typography variant="h6">PEEKABOO</Typography>
                <BlocksRenderer state={state} />
            </Stack>
        </InsightProvider>
    );
};
