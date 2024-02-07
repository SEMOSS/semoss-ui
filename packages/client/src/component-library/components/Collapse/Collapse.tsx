import React from 'react';
import { Collapse as MuiCollapse, SxProps } from '@mui/material';

export interface CollapseProps {
    /**
     * The content node to be collapsed.
     */
    children?: React.ReactNode;

    /**
     * The width (horizontal) or height (vertical) of the container when collapsed.
     * @default '0px'
     */
    collapsedSize?: string | number;

    /**
     * The transition orientation.
     * @default 'vertical'
     */
    orientation?: 'horizontal' | 'vertical';

    /**
     * The duration for the transition, in milliseconds.
     * You may specify a single timeout for all transitions, or individually with an object.
     *
     * Set to 'auto' to automatically calculate transition time based on height.
     * @default duration.standard
     */
    timeout?: 'auto';

    /**
     * If `true`, the component will transition in.
     */
    in?: boolean;

    /**
     * The system prop that allows defining system overrides as well as additional CSS styles.
     */
    sx?: SxProps;
}
export const Collapse = (props: CollapseProps) => {
    return <MuiCollapse {...props}>{props.children}</MuiCollapse>;
};
