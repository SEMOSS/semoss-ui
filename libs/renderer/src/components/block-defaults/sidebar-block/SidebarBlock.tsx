import { CSSProperties, useMemo, useEffect } from "react";
import { observer } from "mobx-react-lite";

import { Drawer, Stack } from "@semoss/ui";

import { useBlock, useBlocks } from "../../../hooks";
import { BlockDef, BlockComponent, ListenerActions } from "../../../store";
import { Slot } from "../../blocks";

export interface SidebarBlockDef extends BlockDef<"sidebar"> {
    widget: "sidebar";
    data: {
        style: CSSProperties;
        anchor: "left" | "top";
        designMode: boolean;
        open: string | boolean | number; // Changed to string to store query
    };
    slots: {
        content: true;
    };
    listeners: {
        preProcess: {
            type: "sync" | "async";
            order: ListenerActions[];
        };
        postProcess: {
            type: "sync" | "async";
            order: ListenerActions[];
        };
    };
}

export const SidebarBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, slots, listeners } = useBlock<SidebarBlockDef>(id);
    const { state } = useBlocks();
    const isStatic = state.mode === "static";

    useEffect(() => {
        if (
            data.open === true ||
            data.open === "true" ||
            data.open === "True" ||
            data.open === 1 ||
            data.open === "1"
        ) {
            if (listeners.preProcess) {
                listeners.preProcess();
            }
        } else {
            if (listeners.postProcess) {
                listeners.postProcess();
            }
        }
    }, [data.open]);
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

    return (
        <Drawer
            {...attrs}
            variant="persistent"
            anchor={data.anchor}
            open={shouldShowSidebar}
            PaperProps={{
                sx: {
                    position: "absolute",
                    height: data.style.height ?? "100%",
                    width: data.style.width,
                    zIndex: !isStatic ? 40 : 19,
                    ...data.style,
                },
            }}
            transitionDuration={250}
        >
            <Stack>
                <Slot slot={slots.content} />
            </Stack>
        </Drawer>
    );
});
