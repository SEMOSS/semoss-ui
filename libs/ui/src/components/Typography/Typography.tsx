import { Typography as MuiTypography, type SxProps } from "@mui/material";

export interface TypographyProps {
	/**
	 * ID of the element
	 */
	id?: string;

	/**
	 * Title attribute
	 */
	title?: string;

	/**
	 * Set the text-align on the component.
	 * @default 'inherit'
	 */
	align?: "inherit" | "left" | "center" | "right" | "justify";

	/**
	 * The content of the component.
	 */
	children?: React.ReactNode;

	/**
	 * Variant to use. Indirectly controls the component
	 */
	variant:
		| "h1"
		| "h2"
		| "h3"
		| "h4"
		| "h5"
		| "h6"
		| "subtitle1"
		| "subtitle2"
		| "body1"
		| "body2"
		| "body3"
		| "body4"
		| "caption"
		| "button"
		| "overline";

	/**
	 * Font weight to use
	 * @default 'regular'
	 */
	fontWeight?: "regular" | "medium" | "bold";

	/**
	 * Set the color based on the theme palette.
	 */
	color?:
		| "inherit"
		| "primary"
		| "secondary"
		| "success"
		| "error"
		| "info"
		| "warning"
		| "disabled"
		| "textPrimary"
		| "textSecondary"
		| "textDisabled";

	/**
	 * Track if the typography element should be flex
	 */
	flex?: string;

	/**
	 * Track the width of the typography component
	 */
	width?: string | number;

	/**
	 * Track the minimum width of the typography component
	 */
	minWidth?: string | number;

	/**
	 * Track the maximum width of the typography component
	 */
	maxWidth?: string | number;

	/**
	 * Will the text be truncated with an ellipsis if it overflows the container?
	 * @default false
	 */
	noWrap?: boolean;

	/**
	 * Show a default margin below the element.
	 * @default false
	 */
	gutterBottom?: boolean;

	/**
	 * The component used for the root node. By default tied to the variant
	 */
	component?: React.ElementType;

	/** custom style object */
	sx?: SxProps;
}

export const Typography: React.FC<TypographyProps> = ({
	sx,
	...otherProps
}) => {
	return <MuiTypography sx={sx} {...otherProps} />;
};
