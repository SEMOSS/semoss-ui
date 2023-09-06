import React from "react";
import {
    Drawer as MuiDrawer,
    ClickAwayListener,
    SxProps,
    ModalProps,
    SlideProps,
    PaperProps,
    styled,
    Box,
} from "@mui/material";

const StyledDrawer = styled(MuiDrawer)({
    maxWidth: "320px",
});

export interface DrawerProps {
    /**
     * Side from which the drawer will appear.
     * @default 'left'
     */
    anchor?: "left" | "top" | "right" | "bottom";
    /**
     * The content of the component.
     */
    children?: React.ReactNode;
    /**
     * The elevation of the drawer.
     * @default 16
     */
    elevation?: number;
    /**
     * Callback fired when the component requests to be closed.
     *
     * @param {object} event The event source of the callback.
     */
    onClose?: ModalProps["onClose"];
    /**
     * If `true`, the component is shown.
     * @default false
     */
    open?: boolean;
    /**
     * Props applied to the [`Paper`](/material-ui/api/paper/) element.
     * @default {}
     */
    PaperProps?: Partial<PaperProps>;
    /**
     * Props applied to the [`Slide`](/material-ui/api/slide/) element.
     */
    SlideProps?: Partial<SlideProps>;
    /**
     * The system prop that allows defining system overrides as well as additional CSS styles.
     */
    sx?: SxProps;
    /**
     * The variant to use.
     * @default 'temporary'
     */
    variant?: "permanent" | "persistent" | "temporary";
}

export const Drawer = (props: DrawerProps) => {
    return (
        <ClickAwayListener
            onClickAway={(e) => {
                if (props.open) {
                    props.onClose(e, "backdropClick");
                }
                // setOpen(!open)
            }}
        >
            <StyledDrawer
                {...props}
                PaperProps={{
                    sx: {
                        width: "320px",
                    },
                }}
            >
                <Box>{props.children}</Box>
            </StyledDrawer>
        </ClickAwayListener>
    );
};
