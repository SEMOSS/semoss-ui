import { Tooltip as MuiTooltip, SxProps } from '@mui/material';

export interface TooltipProps {
    /** custom style object */

    /**
     * If `true`, adds an arrow to the tooltip.
     * @default false
     */
    arrow?: boolean;
    /**
     * Tooltip reference element.
     */
    children: React.ReactElement;
    /**
     * If `true`, the component is shown.
     */
    open?: boolean;

    /**
     * Callback fired when the component requests to be closed.
     *
     * @param {React.SyntheticEvent} event The event source of the callback.
     */
    onClose?: (event: React.SyntheticEvent | Event) => void;
    /**
     * Callback fired when the component requests to be open.
     *
     * @param {React.SyntheticEvent} event The event source of the callback.
     */
    onOpen?: (event: React.SyntheticEvent) => void;
    /**
     * Tooltip placement.
     * @default 'bottom'
     */
    placement?:
        | 'bottom-end'
        | 'bottom-start'
        | 'bottom'
        | 'left-end'
        | 'left-start'
        | 'left'
        | 'right-end'
        | 'right-start'
        | 'right'
        | 'top-end'
        | 'top-start'
        | 'top';
    sx?: SxProps;
    /**
     * Tooltip title. Zero-length titles string, undefined, null and false are never displayed.
     */
    title: React.ReactNode;
}

export const Tooltip = (props: TooltipProps) => {
    const { sx } = props;
    return <MuiTooltip sx={sx} {...props} />;
};
