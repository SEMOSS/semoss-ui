import { CSSProperties, FC, useMemo, useEffect } from "react";
import { observer } from "mobx-react-lite";
import {
    Modal as MuiModal,
    Box,
    Typography,
    IconButton,
    styled,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import { useBlock, useBlocks } from "../../../hooks";
import { BlockDef, BlockComponent } from "../../../store";
import { Slot } from "../../blocks";

export interface ModalBlockDef extends BlockDef<"modal"> {
    widget: "modal";
    data: {
        style: CSSProperties;
        title: string;
        fullWidth: boolean;
        maxWidth: "xs" | "sm" | "md" | "lg" | "xl";
        minWidth: "xs" | "sm" | "md" | "lg" | "xl";
        designMode: boolean;
        open: string | boolean | number; // Changed to string to store query
    };
    slots: {
        content: true;
        footer: true;
    };
    listeners: {
        preProcess: true;
        onClose: true;
    };
}

const ModalWrapper = styled(Box)<{ $visible: boolean }>(({ $visible }) => ({
    visibility: $visible ? "visible" : "hidden",
    minHeight: $visible ? "auto" : "1px",
}));

const ModalOverlay = styled(Box)(({ theme }) => ({
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 1,
    pointerEvents: "none",
}));

const ModalContainer = styled(Box)(({ theme }) => ({
    position: "relative",
    zIndex: 2,
    width: "fit-content",
    margin: "32px auto",
    "& .delete-duplicate-mask": {
        zIndex: 3,
    },
}));

const StyledModalContainer = styled(Box)(({ theme }) => ({
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[24],
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(4),
    maxHeight: "90vh",
    overflow: "auto",
    outline: "none",
}));

const StyledModalHeader = styled(Box)(({ theme }) => ({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing(2),
    borderBottom: `1px solid ${theme.palette.divider}`,
    paddingBottom: theme.spacing(1),
}));

const StyledDropZone = styled(Box, {
    shouldForwardProp: (prop) => prop !== "isStatic",
})<{ isStatic: boolean }>(({ theme, isStatic }) => ({
    border: `1px dashed ${theme.palette.primary.main}`,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(2),
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

const StyledFooterArea = styled(Box)(({ theme }) => ({
    marginTop: theme.spacing(3),
    paddingTop: theme.spacing(2),
    borderTop: `1px solid ${theme.palette.divider}`,
}));

const ModalContent: FC<{
    data: ModalBlockDef["data"];
    slots: Record<string, any>;
    onClose?: () => void;
    isStatic: boolean;
}> = observer(({ data, slots, onClose, isStatic }) => {
    const getWidthValue = (size: "xs" | "sm" | "md" | "lg" | "xl"): string => {
        switch (size) {
            case "xs":
                return "444px";
            case "sm":
                return "600px";
            case "md":
                return "900px";
            case "lg":
                return "1200px";
            case "xl":
                return "1536px";
            default:
                return "444px";
        }
    };

    const minWidth = getWidthValue(data.minWidth);
    const maxWidth = data.fullWidth ? getWidthValue(data.maxWidth) : undefined;
    return (
        <StyledModalContainer style={{ minWidth, maxWidth }}>
            <StyledModalHeader>
                <Typography variant="h6" component="h2">
                    {data.title}
                </Typography>
                {onClose && (
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                )}
            </StyledModalHeader>

            <StyledDropZone isStatic={isStatic}>
                <Slot slot={slots.content} />
            </StyledDropZone>

            <StyledFooterArea>
                <Slot slot={slots.footer} />
            </StyledFooterArea>
        </StyledModalContainer>
    );
});

export const ModalBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, slots, setData, listeners } =
        useBlock<ModalBlockDef>(id);
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
        }
    }, [data.open]);

    const open = useMemo(() => {
        let o = false;
        // Interpret Python
        if (
            data.open === true ||
            data.open === "true" ||
            data.open === "True" ||
            data.open === 1 ||
            data.open === "1"
        ) {
            o = true;
        }

        return o;
    }, [data.open]);

    const handleClose = () => {
        if (!isStatic) {
            setData("open", "false");
        }
    };

    // Helper to determine if modal should be shown
    const shouldShowModal = isStatic
        ? data.designMode // In static mode, show when design mode is on
        : open; // In interactive mode, show when query returns true

    if (!shouldShowModal && !isStatic) {
        return <></>;
    }

    // In static mode with design mode on, show as modal but without portal
    if (isStatic) {
        return (
            <ModalWrapper {...attrs} $visible={shouldShowModal}>
                {shouldShowModal && (
                    <>
                        <ModalOverlay />
                        <ModalContainer>
                            <ModalContent
                                data={data}
                                slots={slots}
                                isStatic={isStatic}
                            />
                        </ModalContainer>
                    </>
                )}
            </ModalWrapper>
        );
    }

    // Non-Design Mode View - Simple view with preview button
    return (
        <>
            <Box {...attrs}>
                <MuiModal
                    open={shouldShowModal}
                    onClose={handleClose}
                    // TODO: Switch to parent page
                    container={() => document.getElementById("page-1")}
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1500,
                        "& .MuiBackdrop-root": {
                            backgroundColor: "rgba(0, 0, 0, 0.5)",
                        },
                    }}
                >
                    <ModalContent
                        data={data}
                        slots={slots}
                        onClose={handleClose}
                        isStatic={isStatic}
                    />
                </MuiModal>
            </Box>
        </>
    );
});
