import { Env, InsightProvider } from "@semoss/sdk";
import { BlocksRenderer, BlocksRendererProps } from "./components";
import { Card, Stack } from "@semoss/ui";
// import { getEngineImage } from "./utility";
import { Typography } from "@mui/material";
import { SerializedState } from "./store";

interface RendererProps extends BlocksRendererProps {
    /**
     * Determines What Endpoint you are hitting
     */
    MODULE: string;

    /**
     * app id
     */
    appId?: string;

    /**
     * Predeifned state to render
     */
    state?: SerializedState;

    /**
     * Is this a preview
     */
    preview?: boolean;
}

export const Renderer = (props: RendererProps) => {
    const { appId, state, preview, MODULE } = props;

    Env.update({
        MODULE: MODULE || "",

        ACCESS_KEY: process.env.ACCESS_KEY || "",

        SECRET_KEY: process.env.SECRET_KEY || "",

        APP: process.env.APP || "",
    });

    return (
        <InsightProvider>
            <BlocksRenderer appId={appId} preview={preview} state={state} />
        </InsightProvider>
    );
};
