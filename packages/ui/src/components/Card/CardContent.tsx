import { ReactNode } from "react";
import CardContent from "@mui/material/CardContent";
import { SxProps } from "@mui/system";

export interface _CardContentProps {
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
