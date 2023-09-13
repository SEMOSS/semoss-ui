import {
    ImageListItem as MuiImageListItem,
    ImageListItemProps as MuiImageListItemProps,
    SxProps,
} from "@mui/material";

export interface ImageListItemProps extends MuiImageListItemProps {
    /**
     * The content of the component  normally an <img>.
     */
    children?: React.ReactNode;

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
     * Height of the item in number of grid rows.
     */
    rows?: number;

    /**
     * The system prop that allows defining system overrides as well as additional CSS styles.
     */
    sx?: SxProps;
}

export const ImageListItem = (props: ImageListItemProps) => {
    const { sx } = props;
    return <MuiImageListItem sx={sx} {...props} />;
};
