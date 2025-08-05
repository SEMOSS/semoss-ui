import { ReactNode, forwardRef } from "react";
import { Box as MuiBox, SxProps } from "@mui/material";

export interface BoxProps {
    /** children to be rendered */
    children?: ReactNode;

    //** onClick function */
    onClick?: () => void;

    flex?: number;

    /** custom style object */
    sx?: SxProps;
    title?: string;
}
export const Box = forwardRef<HTMLDivElement, BoxProps>((props, ref) => {
    const { children, sx } = props;
    return (
        <MuiBox ref={ref} sx={sx} {...props}>
            {children}
        </MuiBox>
    );
});
