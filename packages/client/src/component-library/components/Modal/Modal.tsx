import {
    Dialog as MuiModal,
    DialogProps as MuiModalProps,
    SxProps,
} from '@mui/material';

export interface ModalProps {
    /**
     * The id(s) of the element(s) that describe the dialog.
     */
    'aria-describedby'?: string;

    /**
     * The id(s) of the element(s) that label the dialog.
     */
    'aria-labelledby'?: string;

    /**
     * Dialog children, usually the included sub-components.
     */
    children?: React.ReactNode;

    /**
     * If `true`, the dialog is full-screen.
     * @default false
     */
    fullScreen?: boolean;

    /**
     * If `true`, the dialog stretches to `maxWidth`.
     *
     * Notice that the dialog width grow is limited by the default margin.
     * @default false
     */
    fullWidth?: boolean;

    /**
     * Determine the max-width of the dialog.
     * The dialog width grows with the size of the screen.
     * Set to `false` to disable `maxWidth`.
     * @default 'sm'
     */
    maxWidth?: MuiModalProps['maxWidth'];

    /**
     * Callback fired when the component requests to be closed.
     *
     * @param {object} event The event source of the callback.
     * @param {string} reason Can be: `"escapeKeyDown"`, `"backdropClick"`.
     */
    onClose?: MuiModalProps['onClose'];

    /**
     * If `true`, the component is shown.
     */
    open: boolean;

    /**
     * Determine the container for scrolling the dialog.
     * @default 'paper'
     */
    scroll?: 'body' | 'paper';

    /**
     * The system prop that allows defining system overrides as well as additional CSS styles.
     */
    sx?: SxProps;
}

export const Modal = (props: ModalProps) => {
    const { sx } = props;
    return <MuiModal sx={sx} {...props} />;
};
