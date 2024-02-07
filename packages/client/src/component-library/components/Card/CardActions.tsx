import { ReactNode } from 'react';
import { CardActions as MuiCardActions, SxProps } from '@mui/material';

export interface CardActionsProps {
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

export const CardActions = (props: CardActionsProps) => {
    const { sx, children } = props;
    return (
        <MuiCardActions sx={sx} {...props}>
            {children}
        </MuiCardActions>
    );
};
