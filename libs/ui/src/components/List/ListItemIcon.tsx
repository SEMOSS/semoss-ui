import { ListItemIcon as MuiListItemIcon, type SxProps } from "@mui/material";

export interface ListItemIconProps
	extends React.HTMLAttributes<HTMLDivElement> {
	/**
	 * The content of the component, normally `Icon`, `SvgIcon`,
	 * or a `@mui/icons-material` SVG icon element.
	 */
	children?: React.ReactNode;

	/**
	 * The system prop that allows defining system overrides as well as additional CSS styles.
	 */
	sx?: SxProps;
}
export const ListItemIcon: React.FC<ListItemIconProps> = ({
	sx,
	...otherProps
}) => {
	return <MuiListItemIcon sx={sx} {...otherProps} />;
};
