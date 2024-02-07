import { ReactNode } from 'react';
import {
    Stack as MuiStack,
    StackProps as MuiStackProps,
    SxProps,
} from '@mui/material';

export interface StackProps extends MuiStackProps {
    /** custom style object */
    sx?: SxProps;

    //** children to be rendered */
    children: ReactNode;

    //** spacing between children components */
    spacing?: number;

    //** direction of stack children */
    direction?: 'column-reverse' | 'column' | 'row-reverse' | 'row';
}

export const Stack = (props: StackProps) => {
    const { sx, children, spacing = 1, direction = 'column' } = props;
    return (
        <MuiStack sx={sx} spacing={spacing} direction={direction} {...props}>
            {children}
        </MuiStack>
    );
};
