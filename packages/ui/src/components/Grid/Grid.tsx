import { ReactNode } from "react";
import MuiGrid from "@mui/material/Grid";
import { SxProps } from "@mui/system";
import { GridProps as MuiGridProps } from "@mui/material";

export interface GridProps extends MuiGridProps {
    /** children to be rendered */
    children?: ReactNode;

    /** custom style object */
    sx?: SxProps;
}

export const Grid = (props: GridProps) => {
    const { children, sx } = props;
    return (
        <MuiGrid sx={sx} {...props}>
            {children}
        </MuiGrid>
    );
};
