import { CSSProperties, useMemo } from "react";
import { observer } from "mobx-react-lite";

import { Drawer, Stack, styled, Box } from "@semoss/ui";

import { useBlock, useBlocks } from "../../../hooks";
import { BlockDef, BlockComponent } from "../../../store";
import { Slot } from "../../blocks";

export interface SidebarBlockDef extends BlockDef<"sidebar"> {
    widget: "sidebar";
    data: {
        style: CSSProperties;
        anchor: "left" | "top";
        sidebarWidth: number;
        sidebarHeight: number | string;
        designMode: boolean;
        open: string | boolean | number; // Changed to string to store query
    };
    slots: {
        content: true;
    };
}

const SideBarWrapper = styled(Box)<{ $visible: boolean }>(({ $visible }) => ({
    visibility: $visible ? "visible" : "hidden",
}));

export const SidebarBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, slots } = useBlock<SidebarBlockDef>(id);
    const { state } = useBlocks();
    const isStatic = state.mode === "static";

    const open = useMemo(() => {
        let o = false;
        // Interpret Python
        if (
            data.open === true ||
            data.open === "true" ||
            data.open === 1 ||
            data.open === "1"
        ) {
            o = true;
        }

        return o;
    }, [data.open]);

    // Helper to determine if modal should be shown
    const shouldShowSidebar = isStatic
        ? data.designMode // In static mode, show when design mode is on
        : Boolean(open); // In interactive mode, show when query returns true

    // In static mode with design mode on, show as modal but without portal
    if (!shouldShowSidebar && !isStatic) {
        return <></>;
    }

    return (
        <SideBarWrapper {...attrs} $visible={shouldShowSidebar}>
            <Drawer
                variant="persistent"
                anchor={data.anchor}
                open={shouldShowSidebar}
                PaperProps={{
                    sx: {
                        position: "absolute",
                        height: data.sidebarHeight ?? "100%",
                        width: data.sidebarWidth,
                        zIndex: !isStatic ? 40 : 19,
                        ...data.style,
                    },
                }}
            >
                <Stack>
                    <Slot slot={slots.content} />
                </Stack>
            </Drawer>
        </SideBarWrapper>
    );
});
