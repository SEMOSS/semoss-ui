import { LinearProgress as MuiLinearProgress, SxProps } from '@mui/material';

export interface LinearProgressProps {
    /**
     * The color of the component.
     * It supports both default and custom theme colors, which can be added as shown in the
     * [palette customization guide](https://mui.com/material-ui/customization/palette/#adding-new-colors).
     * @default 'primary'
     */
    color?:
        | 'primary'
        | 'secondary'
        | 'error'
        | 'info'
        | 'success'
        | 'warning'
        | 'inherit';

    /**
     * The system prop that allows defining system overrides as well as additional CSS styles.
     */
    sx?: SxProps;

    /**
     * The value of the progress indicator for the determinate and buffer variants.
     * Value between 0 and 100.
     */
    value?: number;

    /**
     * The value for the buffer variant.
     * Value between 0 and 100.
     */
    valueBuffer?: number;

    /**
     * The variant to use.
     * Use indeterminate or query when there is no progress value.
     * @default 'indeterminate'
     */
    variant?: 'determinate' | 'indeterminate' | 'buffer' | 'query';
}

export const LinearProgress = (props: LinearProgressProps) => {
    const { sx } = props;
    return <MuiLinearProgress sx={sx} {...props} />;
};
