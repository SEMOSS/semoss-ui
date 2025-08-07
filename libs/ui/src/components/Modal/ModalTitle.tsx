import { DialogTitle as MuiModalTitle, type SxProps } from "@mui/material";

export interface ModalTitleProps {
	/**
	 * The content of the component.
	 */
	children?: React.ReactNode;

	/**
	 * The system prop that allows defining system overrides as well as additional CSS styles.
	 */
	sx?: SxProps;
}

export const ModalTitle: React.FC<ModalTitleProps> = ({
	sx,
	children,
	...otherProps
}) => {
	return (
		<MuiModalTitle sx={sx} {...otherProps}>
			{children}
		</MuiModalTitle>
	);
};
