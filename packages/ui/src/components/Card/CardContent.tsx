import { ReactNode } from "react";
import { CardContent as MuiCardContent, SxProps } from "@mui/material";

export interface CardContentProps {
    /** children to be rendered */
    children: ReactNode;

    /** custom style object */
    sx?: SxProps;
}

export const CardContent = (props: CardContentProps) => {
    const { children, sx } = props;
    return (
        <MuiCardContent sx={sx} {...props}>
            {children}
        </MuiCardContent>
    );
};
