import { ReactNode } from "react";
import CardContent from "@mui/material/CardContent";
import { SxProps } from "@mui/system";
import { CardContentProps } from "@mui/material";

export interface _CardContentProps extends CardContentProps {
    /** children to be rendered */
    children: ReactNode;

    /** custom style object */
    sx?: SxProps;
}

export const _CardContent = (props: _CardContentProps) => {
    const { children, sx } = props;
    return (
        <CardContent sx={sx} {...props}>
            {children}
        </CardContent>
    );
};
