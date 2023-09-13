import {
    ImageList as MuiImageList,
    ImageListProps as MuiImageListProps,
    SxProps,
} from "@mui/material";

export interface ImageListProps extends MuiImageListProps {
    /**
     * The content of the component.
     */
    children: React.ReactNode;

    /**
     * Override or extend the styles applied to the component.
     */
    classes?: object;

    /**
     * Number of columns.
     */
    cols?: number;

    /**
     * The component used for the root node. Either a string to use a HTML element or a component.
     */
    component?: React.ReactNode;

    /**
     * The gap between items in px. Default: 4
     */
    gap?: number;

    /**
     * The height of one row in px. 'auto' | number
     */
    rowHeight?: "auto" | number;

    /**
     * The variant to use.
     */
    variant?: "masonry" | "quilted" | "standard" | "woven";

    /**
     * The system prop that allows defining system overrides as well as additional CSS styles.
     */
    sx?: SxProps;
}

export const ImageList = (props: ImageListProps) => {
    const { sx } = props;
    return <MuiImageList sx={sx} {...props} />;
};
