import { CSSProperties, useEffect } from "react";
import { observer } from "mobx-react-lite";

import { useBlock, useBlocks } from "../../../hooks";
import { BlockDef, BlockComponent } from "../../../store";
import { Slot } from "../../../components/blocks";
import { Typography } from "@mui/material";

export interface PageBlockDef extends BlockDef<"page"> {
    widget: "page";
    data: {
        style: CSSProperties;
        loading: boolean | string;
    };
    slots: {
        content: true;
    };
    listeners: {
        onPageLoad: true;
    };
}

export const PageBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, slots, listeners } = useBlock<PageBlockDef>(id);
    // debugger;

    // when the page is mounted, trigger the onPageLoad event
    useEffect(() => {
        if (listeners.onPageLoad) {
            listeners.onPageLoad();
        }
    }, []);

    const isLoading =
        typeof data.loading === "string"
            ? data.loading.toLowerCase() === "true"
            : data.loading;

    return (
        <div
            id={id}
            style={{
                // position Set to relative so we can have a modal to attach to page block
                position: "relative",
                width: "100%",
                height: "100%",
                background: "#FFFFFF",
                overflow: "scroll",
                ...data.style,
            }}
            {...attrs}
            data-page
        >
            {/* TODO: Make Loading Screen relative to the Page */}
            {/* <LoadingScreen>
                {isLoading ? <LoadingScreen.Trigger /> : null}
                <Slot slot={slots.content}></Slot>
            </LoadingScreen> */}
            <Typography variant={"h6"}>
                HELL YEAH ITS RENDERING THE PAGE BLOCK AND TRYING TO EXECUTE
                SHEET ON LOAD OF PAGE.
            </Typography>
            <Typography variant={"body1"}>
                1. FIX THE API RUNNER - Look at cell.state and possibly run our
                react sdk and useInsight hook, we might have to move the console
                and runPixelAsync into the sdk as well. and how we call api,
                MOVE THE SDK into the package.json of this lib and run pixel
                that way. You can just go off the npm package version for now,
                and then move sdk to lib after
            </Typography>
            <Typography variant={"body1"}>
                1a. sdk and sdk-react move into a single lib - X
            </Typography>
            <Typography variant={"body1"}>
                1b. sdk move pixelAsync and pixelResult
            </Typography>
            <Typography variant={"body1"}>
                2. Bring the rest of the block-defaults back
            </Typography>
        </div>
    );
});
