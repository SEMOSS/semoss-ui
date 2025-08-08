import {
	DialogContentText as MuiModalContentText,
	type SxProps,
} from "@mui/material";

export interface ModalContentTextProps {
	/** children to be rendered */
	children: React.ReactNode;

	/** custom style object */
	sx?: SxProps;
}

export const ModalContentText = (props: ModalContentTextProps) => {
	const { children, sx } = props;
	return (
		<MuiModalContentText sx={sx} {...props}>
			{children}
		</MuiModalContentText>
	);
};
