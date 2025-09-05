import { DialogContent as MuiModalContent, type SxProps } from "@mui/material";

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
	const { children, sx, ...otherProps } = props;
	return (
		<MuiModalContent sx={{ px: 2, py: 1, ...(sx || {})}} {...otherProps}>
			{children}
		</MuiModalContent>
	);
};
