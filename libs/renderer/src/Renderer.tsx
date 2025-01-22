import { Env, InsightProvider } from "@semoss/sdk";
import { BlocksRenderer, BlocksRendererProps } from "./components";
import { Card, Stack } from "@semoss/ui";
import { getEngineImage } from "./utility";
import { Typography } from "@mui/material";

interface RendererProps extends BlocksRendererProps {
    /**
     * Determines What Endpoint you are hitting
     */
    MODULE: string;
}

export const Renderer = (props: RendererProps) => {
    const { state, MODULE } = props;

    Env.update({
        MODULE: MODULE || "",

        ACCESS_KEY: process.env.ACCESS_KEY || "",

        SECRET_KEY: process.env.SECRET_KEY || "",

        APP: process.env.APP || "",
    });

    return (
        <InsightProvider>
            <Stack>
                <img
                    style={{ width: "50px", height: "50px" }}
                    src={getEngineImage("MODEL", "OPEN_AI")}
                />
                <Typography>Testing Images Above ^ Disregard</Typography>

                <BlocksRenderer state={state} />
            </Stack>
        </InsightProvider>
    );
};
