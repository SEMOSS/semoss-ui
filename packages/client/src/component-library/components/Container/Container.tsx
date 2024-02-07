import { ReactNode } from 'react';
import { Container as MuiContainer, SxProps, Breakpoint } from '@mui/material';

export interface ContainerProps {
    //** children to be rendered */
    children?: ReactNode;

    /**
     * If `true`, the left and right padding is removed.
     * @default false
     */
    disableGutters?: boolean;

    /**
     * Set the max-width to match the min-width of the current breakpoint.
     * This is useful if you'd prefer to design for a fixed set of sizes
     * instead of trying to accommodate a fully fluid viewport.
     * It's fluid by default.
     * @default false
     */
    fixed?: boolean;

    /**
     * Determine the max-width of the container.
     * The container width grows with the size of the screen.
     * Set to `false` to disable `maxWidth`.
     * @default 'lg'
     */
    maxWidth?: Breakpoint | false;

    /**
     * The system prop that allows defining system overrides as well as additional CSS styles.
     */
    sx?: SxProps;
}
export const Container = (props: ContainerProps) => {
    const { children, sx } = props;
    return (
        <MuiContainer sx={sx} {...props}>
            {children}
        </MuiContainer>
    );
};
