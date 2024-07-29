import { ListItemAvatar as MuiListItemAvatar, SxProps } from "@mui/material";

export interface ListItemAvatarProps {
    children?: React.ReactNode;

    /**
     * The system prop that allows defining system overrides as well as additional CSS styles.
     */
    sx?: SxProps;
}

export const ListItemAvatar = (props: ListItemAvatarProps) => {
    return <MuiListItemAvatar {...props} />;
};
