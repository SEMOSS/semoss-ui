import {
	ListItemText as MuiListItemText,
	type ListItemTextProps as MuiListItemTextProps,
} from "@mui/material";

export interface ListItemTextProps extends MuiListItemTextProps {
	/**
	 * The main content element.
	 */
	primary?: React.ReactNode;

	/**
	 * The secondary content element.
	 */
	secondary?: React.ReactNode;
}
export const ListItemText = (props: ListItemTextProps) => {
	return <MuiListItemText {...props} />;
};
