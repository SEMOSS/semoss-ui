import { ReactNode } from 'react';
import { Backdrop as MuiBackdrop, SxProps } from '@mui/material';

export interface BackdropProps {
    /** children to be rendered */
    children?: ReactNode;

    /** custom style object */
    sx?: SxProps;

    /**
     * If `true`, the component is shown.
     */
    open: boolean;
}

export const Backdrop = (props: BackdropProps) => {
    const { children, sx } = props;
    return (
        <MuiBackdrop sx={sx} {...props}>
            {children}
        </MuiBackdrop>
    );
};
