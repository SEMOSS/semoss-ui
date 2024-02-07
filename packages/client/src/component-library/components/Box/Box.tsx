import { ReactNode } from 'react';
import { Box as MuiBox, SxProps } from '@mui/material';

export interface BoxProps {
    /** children to be rendered */
    children?: ReactNode;

    //** onClick function */
    onClick?: () => void;

    /** custom style object */
    sx?: SxProps;
    title?: string;
}
export const Box = (props: BoxProps) => {
    const { children, sx } = props;
    return (
        <MuiBox sx={sx} {...props}>
            {children}
        </MuiBox>
    );
};
