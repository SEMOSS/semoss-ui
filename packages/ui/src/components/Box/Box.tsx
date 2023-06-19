import { ReactNode } from "react";
import MuiBox from "@mui/material/Box";
import { SxProps } from "@mui/system";
import { BoxProps as MuiBoxProps } from "@mui/material";

export interface BoxProps extends MuiBoxProps {
    /** children to be rendered */
    children?: ReactNode;

    /** custom style object */
    sx?: SxProps;
}
export const Box = (props: BoxProps) => {
    const { children, sx } = props;
    return (
        <MuiBox sx={sx} {...props}>
            {children}
        </MuiBox>
    );
};
