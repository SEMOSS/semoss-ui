import { ReactNode } from "react";
import CardActions from "@mui/material/CardActions";
import { SxProps } from "@mui/system";
import { CardActionsProps } from "@mui/material";

export interface _CardActionsProps {
    /** custom style object */
    sx?: SxProps;

    /** children to be rendered */
    children: ReactNode;

    /**
     * If `true`, the actions do not have additional margin.
     * @default false
     */
    disableSpacing?: boolean;
}

export const _CardActions = (props: _CardActionsProps) => {
    const { sx, children } = props;
    return (
        <CardActions sx={sx} {...props}>
            {children}
        </CardActions>
    );
};
