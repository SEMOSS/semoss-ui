import {
	CardHeader as MuiCardHeader,
	type SxProps,
	type TypographyProps,
} from "@mui/material";

export interface CardHeaderProps {
	/**
	 * The action to display in the card header.
	 */
	action?: React.ReactNode;

	/**
	 * The Avatar element to display.
	 */
	avatar?: React.ReactNode;

	/**
	 * The content of the component.
	 */
	subheader?: React.ReactNode;

	/**
      * 
    /** custom style object */
	sx?: SxProps;

	/**
	 * The content of the component.
	 */
	title?: React.ReactNode;

	/**
	 * These props will be forwarded to the title
	 * (as long as disableTypography is not `true`).
	 */
	titleTypographyProps?: TypographyProps;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
	sx,
	titleTypographyProps,
	...otherProps
}) => {
	return (
		<MuiCardHeader
			sx={sx}
			subheaderTypographyProps={{ variant: "caption" }}
			titleTypographyProps={{ variant: "body1", ...titleTypographyProps }}
			{...otherProps}
		/>
	);
};
