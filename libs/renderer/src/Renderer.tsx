import { Env, InsightProvider } from "@semoss/sdk";
import { BlocksRenderer, BlocksRendererProps } from "./components";

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
            <BlocksRenderer state={state} />
        </InsightProvider>
    );
};
