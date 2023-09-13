import {
    ImageListItemBar as MuiImageListItemBar,
    ImageListItemBarProps as MuiImageListItemBarProps,
    SxProps,
} from "@mui/material";

export interface ImageListItemBarProps extends MuiImageListItemBarProps {
    /**
     * An IconButton element to be used as secondary action target (primary action target is the item itself).
     */
    actionIcon?: React.ReactNode;

    /**
     * Position of secondary action IconButton. 'left' | 'right', Default: 'right'
     */
    actionPosition?: "left" | "right";

    /**
     * Override or extend the styles applied to the component.
     */
    classes?: object;

    /**
     * Position of the title bar. Type: 'below' | 'bottom' | 'top', Default: 'bottom'
     */
    position?: "below" | "top" | "bottom";

    /**
     * Title to be displayed.
     */
    title?: React.ReactNode;

    /**
     * String or element serving as subtitle (support text).
     */
    subtitle?: React.ReactNode;

    /**
     * The system prop that allows defining system overrides as well as additional CSS styles.
     */
    sx?: SxProps;
}

export const ImageListItemBar = (props: ImageListItemBarProps) => {
    const { sx } = props;
    return <MuiImageListItemBar sx={sx} {...props} />;
};
