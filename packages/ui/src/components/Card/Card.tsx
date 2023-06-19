import { ReactNode } from "react";
import MuiCard from "@mui/material/Card";
import { SxProps } from "@mui/system";
import { CardProps as MuiCardProps } from "@mui/material";

export interface CardProps extends MuiCardProps {
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
