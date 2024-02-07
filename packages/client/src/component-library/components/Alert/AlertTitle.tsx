import { ReactNode } from 'react';
import { AlertTitle as MuiAlertTitle, SxProps } from '@mui/material';

export interface AlertTitleProps {
    /** children to be rendered */
    children?: ReactNode;

    /** custom style object */
    sx?: SxProps;
}

export const AlertTitle = (props: AlertTitleProps) => {
    const { children, sx } = props;
    return (
        <MuiAlertTitle sx={sx} {...props}>
            {children}
        </MuiAlertTitle>
    );
};
