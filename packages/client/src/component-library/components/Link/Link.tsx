import React from 'react';
import { Link as MuiLink, SxProps } from '@mui/material';

export interface LinkProps {
    /**
     * The content of the component.
     */
    children?: React.ReactNode;

    //** color of link */
    color?:
        | 'inherit'
        | 'action'
        | 'disabled'
        | 'secondary'
        | 'primary'
        | 'error'
        | 'info'
        | 'success'
        | 'warning';

    /**
     * Link
     */
    href: string;
    rel?: React.HTMLProps<HTMLAnchorElement>['rel'];
    target?: React.HTMLProps<HTMLAnchorElement>['target'];

    /**
     * Callback fired when the link is clicked.
     */
    onClick?: (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;

    /**
     * The system prop that allows defining system overrides as well as additional CSS styles.
     */
    sx?: SxProps;

    /**
     * Controls when the link should have an underline.
     * @default 'always'
     */
    underline?: 'none' | 'hover' | 'always';

    /**
     * Applies the theme typography styles.
     * @default 'inherit'
     */
    variant?:
        | 'h1'
        | 'h2'
        | 'h3'
        | 'h4'
        | 'h5'
        | 'h6'
        | 'inherit'
        | 'subtitle1'
        | 'subtitle2'
        | 'body1'
        | 'body2'
        | 'caption'
        | 'button'
        | 'overline';
}

export const Link = (props: LinkProps) => {
    const { sx, ...otherProps } = props;
    return <MuiLink sx={sx} {...otherProps} />;
};
