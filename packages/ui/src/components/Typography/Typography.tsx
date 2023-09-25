import { Typography as MuiTypography, SxProps } from "@mui/material";

export interface TypographyProps {
    /** custom style object */

    /**
     * Set the text-align on the component.
     * @default 'inherit'
     */
    align?: "inherit" | "left" | "center" | "right" | "justify";
    /**
     * The content of the component.
     */
    children?: React.ReactNode;
    /**
     * If `true`, the element will be a paragraph element.
     * @default false
     */
    paragraph?: boolean;
    variant:
        | "h1"
        | "h2"
        | "h3"
        | "h4"
        | "h5"
        | "h6"
        | "subtitle1"
        | "subtitle2"
        | "body1"
        | "body2"
        | "caption"
        | "button"
        | "overline";
    sx?: SxProps;
    fontWeight?: "light" | "regular" | "medium" | "500" | "bold";
    color?:
        | "inherit"
        | "primary"
        | "secondary"
        | "success"
        | "error"
        | "info"
        | "warning";
    noWrap?: boolean;
}

export const Typography = (props: TypographyProps) => {
    const { sx, ...otherProps } = props;
    return <MuiTypography sx={sx} {...otherProps} />;
};
