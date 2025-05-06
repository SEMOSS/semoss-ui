import React from "react";
import {
    Drawer as MuiDrawer,
    SlideProps,
    ModalProps,
    PaperProps,
    SxProps,
} from "@mui/material";

interface DrawerProps {
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
     * Props applied to the [`ModalProps`](/material-ui/api/modal/) element.
     * @default {}
     */
    ModalProps?: Partial<ModalProps>;

    /**
     * The system prop that allows defining system overrides as well as additional CSS styles.
     */
    sx?: SxProps;
    /**
     * The variant to use.
     * @default 'temporary'
     */
    variant?: "permanent" | "persistent" | "temporary";
    /**
     * The duration for the transition, in milliseconds.
     * You may specify a single timeout for all transitions, or individually with an object.
     */
    transitionDuration?: number | { enter: number; exit: number };
}

export const Drawer = (props: DrawerProps) => {
    return <MuiDrawer {...props} />;
};
