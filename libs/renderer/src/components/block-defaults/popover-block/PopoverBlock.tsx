import { CSSProperties, useEffect, useState, useMemo } from "react";
import { observer } from "mobx-react-lite";

// TODO: Pull from component library
import { Popover, Box, Stack, styled, Typography } from "@mui/material";

import { Slot } from "../../blocks";
import { useBlock, useBlocks } from "../../../hooks";
import { BlockDef, BlockComponent } from "../../../store";

export interface PopoverBlockDef extends BlockDef<"popover"> {
    widget: "popover";
    data: {
        style: CSSProperties;
        designMode: boolean;
        open: string | boolean | number;
        targetId?: string;
        openTrigger: "click" | "hover";
    };
    slots: {
        header: true;
        content: true;
    };
}

// A wrapper similar to ModalWrapper for design mode
const PopoverWrapper = styled(Box)<{ $visible: boolean }>(({ $visible }) => ({
    visibility: $visible ? "visible" : "hidden",
    minHeight: $visible ? "auto" : "1px",
}));

const PopoverOverlay = styled(Box)(({ theme }) => ({
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 1,
    pointerEvents: "none",
}));

const PopoverContainer = styled(Box)(({ theme }) => ({
    position: "relative",
    zIndex: 2,
    width: "fit-content",
    margin: "32px auto",
    "& .delete-duplicate-mask": {
        zIndex: 3,
    },
}));

const StyledPopoverContainer = styled(Box)(({ theme }) => ({
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[24],
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(2),
    maxHeight: "90vh",
    overflow: "auto",
    outline: "none",
}));

const StyledDropZone = styled(Box, {
    shouldForwardProp: (prop) => prop !== "isStatic",
})<{ isStatic: boolean }>(({ theme, isStatic }) => ({
    borderRadius: theme.shape.borderRadius,
    minHeight: 100,
    position: "relative",
    "&:empty::after": {
        content: isStatic ? '"Drop components here"' : '""',
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        color: theme.palette.text.disabled,
        pointerEvents: "none",
    },
}));

// A component for rendering the popover's inner content, including header and content slots
const PopoverContent: React.FC<{
    data: PopoverBlockDef["data"];
    slots: Record<string, any>;
    onClose?: () => void;
    isStatic: boolean;
}> = observer(({ data, slots, onClose, isStatic }) => {
    return (
        <StyledPopoverContainer
            sx={{
                ...data.style,
                overflow: "auto",
            }}
        >
            <StyledDropZone isStatic={isStatic}>
                <Slot slot={slots.content} />
            </StyledDropZone>
        </StyledPopoverContainer>
    );
});

export const PopoverBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, slots, setData, listeners } =
        useBlock<PopoverBlockDef>(id);
    const { state } = useBlocks();
    const isStatic = state.mode === "static";
    const targetId = data.targetId || "";

    // Compute the "open" state based on multiple truthy representations
    const open = useMemo(() => {
        let o = false;
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

    // When closing in interactive mode, update state via setData
    const handleClose = () => {
        if (!isStatic) {
            setData("open", "false");

            listeners.onClose();
        }
    };

    // Determine the anchor element based on a targetId if provided
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    useEffect(() => {
        if (targetId) {
            const element = document.querySelector(
                `[data-block="${targetId}"]`,
            ) as HTMLElement | null;

            setAnchorEl(element);
        } else {
            setAnchorEl(null);
        }
    }, [targetId]);

    useEffect(() => {
        if (!anchorEl) return;

        const handleOpen = () => {
            setData("open", "true");

            listeners.onOpen();
        };

        const handleClose = () => {
            setData("open", "false");

            listeners.onClose();
        };

        if (data.openTrigger === "click") {
            anchorEl.addEventListener("click", handleOpen);

            return () => {
                anchorEl.removeEventListener("click", handleOpen);
            };
        }

        if (data.openTrigger === "hover") {
            anchorEl.addEventListener("mouseenter", handleOpen);
            anchorEl.addEventListener("mouseleave", handleClose);

            return () => {
                anchorEl.removeEventListener("mouseenter", handleOpen);
                anchorEl.removeEventListener("mouseleave", handleClose);
            };
        }
    }, [anchorEl, setData, data.open]);

    const handleClosePopover = () => {
        if (!isStatic) setData("open", "false");
    };

    // Decide whether the popover should be shown:
    // - In static mode, show it if designMode is on
    // - In interactive mode, show it if "open" is truthy
    const shouldShowPopover = isStatic ? data.designMode : Boolean(open);

    if (!shouldShowPopover && !isStatic) {
        return <></>;
    }

    // === DESIGN MODE (Static) RENDERING ===
    if (isStatic) {
        return (
            <PopoverWrapper
                {...attrs}
                $visible={shouldShowPopover}
                sx={data.style}
            >
                {shouldShowPopover && (
                    <>
                        <PopoverOverlay />
                        <PopoverContainer>
                            <PopoverContent
                                data={data}
                                slots={slots}
                                isStatic={isStatic}
                            />
                        </PopoverContainer>
                    </>
                )}
            </PopoverWrapper>
        );
    }

    // === INTERACTIVE MODE RENDERING ===
    return (
        <Box {...attrs} sx={data.style}>
            <Popover
                open={shouldShowPopover}
                anchorEl={anchorEl}
                onClose={handleClose}
                // Render the popover within the specified container instead of the document body

                container={() => document.getElementById("page-1")}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "left",
                }}
            >
                <PopoverContent
                    data={data}
                    slots={slots}
                    onClose={handleClose}
                    isStatic={isStatic}
                />
            </Popover>
        </Box>
    );
});
