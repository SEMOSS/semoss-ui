import { DialogContent as MuiModalContent, SxProps } from '@mui/material';

export interface ModalContentProps {
    /**
     * The content of the component.
     */
    children?: React.ReactNode;

    /**
     * Display the top and bottom dividers.
     * @default false
     */
    dividers?: boolean;

    /**
     * The system prop that allows defining system overrides as well as additional CSS styles.
     */
    sx?: SxProps;
}

export const ModalContent = (props: ModalContentProps) => {
    const { children, sx } = props;
    return (
        <MuiModalContent sx={sx} {...props}>
            {children}
        </MuiModalContent>
    );
};
