import React from 'react';
import { Paper as MuiPaper, SxProps } from '@mui/material';

export interface PaperProps {
    /**
     * The content of the component.
     */
    children?: React.ReactNode;

    /**
     * Shadow depth, corresponds to `dp` in the spec.
     * It accepts values between 0 and 24 inclusive.
     * @default 1
     */
    elevation?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
    /**
     * If `true`, rounded corners are disabled.
     * @default false
     */
    square?: boolean;
    /**
     * The system prop that allows defining system overrides as well as additional CSS styles.
     */
    sx?: SxProps;
    /**
     * The variant to use.
     * @default 'elevation'
     */
    variant?: 'elevation' | 'outlined';
}

export const Paper = (props: PaperProps) => {
    return <MuiPaper {...props}>{props.children}</MuiPaper>;
};
