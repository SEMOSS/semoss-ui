import { ReactNode } from "react";
import MuiContainer from "@mui/material/Container";
import { SxProps } from "@mui/system";
import { ContainerProps } from "@mui/material";

export interface _ContainerProps extends ContainerProps {
    /** children to be rendered */
    children?: ReactNode;

    /** custom style object */
    sx?: SxProps;
}
export const Container = (props: _ContainerProps) => {
    const { children, sx } = props;
    return (
        <MuiContainer sx={sx} {...props}>
            {children}
        </MuiContainer>
    );
};
