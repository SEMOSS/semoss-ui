import { ReactNode } from "react";
import CardActions from "@mui/material/CardActions";
import { SxProps } from "@mui/system";
import { CardActionsProps } from "@mui/material";

export interface _CardActionsProps extends CardActionsProps {
    /** custom style object */
    sx?: SxProps;

    /** children to be rendered */
    children: ReactNode;
}

export const _CardActions = (props: _CardActionsProps) => {
    const { sx, children } = props;
    return (
        <CardActions sx={sx} {...props}>
            {children}
        </CardActions>
    );
};
