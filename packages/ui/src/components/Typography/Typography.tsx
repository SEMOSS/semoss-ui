import { ReactNode } from "react";
import MuiTypography from "@mui/material/Typography";
import { SxProps } from "@mui/system";
export interface TypographyProps {
    // customizable types
    align?: "center" | "inherit" | "justify" | "left" | "right";
    gutterBottom?: boolean;
    noWrap?: boolean;
    paragraph?: boolean;
    variant?:
        | "body1"
        | "body2"
        | "button"
        | "caption"
        | "h1"
        | "h2"
        | "h3"
        | "h4"
        | "h5"
        | "h6"
        | "inherit"
        | "overline"
        | "subtitle1"
        | "subtitle2";
    /** custom style object */
    sx?: SxProps;
    children?: ReactNode;
}

export const Typography = (props: TypographyProps) => {
    const { sx } = props;
    return <MuiTypography sx={sx} {...props} />;
};
