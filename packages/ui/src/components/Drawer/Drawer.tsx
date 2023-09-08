import React from "react";
import {
    Drawer as MuiDrawer,
    SxProps,
    ModalProps,
    SlideProps,
    PaperProps,
    styled,
    Box,
    ClickAwayListener,
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
    setState for open
 */
    setOpen: (val: boolean) => void;
    /**
     * Props applied to the [`Paper`](/material-ui/api/paper/) element.
     * @default {}
     */
    PaperProps?: Partial<PaperProps>;
    /**
     * Props applied to the [`Slide`](/material-ui/api/slide/) element.
     */
    SlideProps?: Partial<SlideProps>;

    //** Props applied to the ['Modal'] */
    ModalProps?: ModalProps;

    /**
     * The system prop that allows defining system overrides as well as additional CSS styles.
     */
    sx?: SxProps;
    /**
     * The variant to use.
     * @default 'temporary'
     */
    variant?: "permanent" | "persistent" | "temporary";

    //** clickaway functionality */
    clickaway?: boolean;
}

export const Drawer = (props: DrawerProps) => {
    const { setOpen, clickaway, open, children, ...otherProps } = props;
    const handleClickaway = () => {
        setOpen(false);
    };
    return (
        <ClickAwayListener
            onClickAway={() => {
                if (!clickaway) {
                    return;
                }
                if (open) {
                    handleClickaway();
                }
            }}
        >
            <StyledDrawer
                {...otherProps}
                open={open}
                PaperProps={{
                    sx: {
                        width: "320px",
                        position: "absolute",
                    },
                }}
            >
                <Box>{children}</Box>
            </StyledDrawer>
        </ClickAwayListener>
    );
};
