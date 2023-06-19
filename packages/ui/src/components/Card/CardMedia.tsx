import { ReactNode } from "react";
import CardMedia from "@mui/material/CardMedia";
import { SxProps } from "@mui/system";
import { CardMediaProps } from "@mui/material";

export interface _CardMediaProps extends CardMediaProps {
    /** custom style object */
    sx?: SxProps;

    /** children to be rendered */
    children?: ReactNode;
}

export const _CardMedia = (props: _CardMediaProps) => {
    const { sx, children } = props;
    return (
        <CardMedia sx={sx} {...props}>
            {children}
        </CardMedia>
    );
};
