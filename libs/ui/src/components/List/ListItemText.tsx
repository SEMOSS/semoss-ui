import { ListItemText as MuiListItemText } from "@mui/material";

export interface ListItemTextProps {
	/**
	 * The main content element.
	 */
	primary?: React.ReactNode;

	/**
	 * The secondary content element.
	 */
	secondary?: React.ReactNode;
}
export const ListItemText: React.FC<ListItemTextProps> = (props) => {
	return <MuiListItemText {...props} />;
};
