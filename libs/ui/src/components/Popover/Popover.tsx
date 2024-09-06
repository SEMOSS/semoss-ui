import { Popover as MuiPopover, SxProps, ModalProps } from "@mui/material";

interface PopoverVirtualElement {
    getBoundingClientRect: () => DOMRect;
    nodeType: Node["ELEMENT_NODE"];
}

export interface PopoverOrigin {
    vertical: "top" | "center" | "bottom" | number;
    horizontal: "left" | "center" | "right" | number;
}

export interface PopoverPosition {
    top: number;
    left: number;
}

export interface PopoverProps {
    /**
     * An HTML element, [PopoverVirtualElement](/material-ui/react-popover/#virtual-element),
     * or a function that returns either.
     * It's used to set the position of the popover.
     */
    anchorEl?:
        | null
        | Element
        | (() => Element)
        | PopoverVirtualElement
        | (() => PopoverVirtualElement);

    /**
     * This is the point on the anchor where the popover's
     * `anchorEl` will attach to. This is not used when the
     * anchorReference is 'anchorPosition'.
     *
     * Options:
     * vertical: [top, center, bottom];
     * horizontal: [left, center, right].
     * @default {
     *   vertical: 'top',
     *   horizontal: 'left',
     * }
     */
    anchorOrigin?: PopoverOrigin;

    /**
     * This is the position that may be used to set the position of the popover.
     * The coordinates are relative to the application's client area.
     */
    anchorPosition?: PopoverPosition;

    /**
     * The content of the component.
     */
    children?: React.ReactNode;

    /**
     * An HTML element, component instance, or function that returns either.
     * The `container` will passed to the Modal component.
     *
     * By default, it uses the body of the anchorEl's top-level document object,
     * so it's simply `document.body` most of the time.
     */
    container?: ModalProps["container"];

    /**
     * The elevation of the popover.
     * @default 8
     */
    elevation?: number;

    /** element id */
    id: string | undefined;

    /**
     * Specifies how close to the edge of the window the popover can appear.
     * @default 16
     */
    marginThreshold?: number;

    //** function to be fired on close */
    onClose?: ModalProps["onClose"];

    /**
     * If `true`, the component is shown.
     */
    open: boolean;

    /**
     * The system prop that allows defining system overrides as well as additional CSS styles.
     */
    sx?: SxProps;
}

export const Popover = (props: PopoverProps) => {
    const { sx } = props;
    return <MuiPopover sx={sx} {...props} />;
};
