import { ReactNode } from "react";
import MuiCard from "@mui/material/Card";
import { SxProps } from "@mui/system";

export interface CardProps {
    /** children to be rendered */
    children: ReactNode;

    /** custom style object */
    sx?: SxProps;
}

export const Card = (props: CardProps) => {
    const { children, sx } = props;
    return (
        <MuiCard sx={sx} {...props}>
            {children}
        </MuiCard>
    );
};
