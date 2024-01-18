import { ListItem as MuiListItem, SxProps } from "@mui/material";

export interface ListItemProps {
    /**
     * Defines the `align-items` style property.
     * @default 'center'
     */
    alignItems?: "flex-start" | "center";

    /**
     * If `true`, the list item is focused during the first mount.
     * Focus will also be triggered if the value changes from false to true.
     * @default false
     * @deprecated checkout [ListItemButton](/material-ui/api/list-item-button/) instead
     */
    autoFocus?: boolean;

    /**
     * The content of the component if a `ListItemSecondaryAction` is used it must
     * be the last child.
     */
    children?: React.ReactNode;

    /**
     * If `true`, compact vertical padding designed for keyboard and mouse input is used.
     * The prop defaults to the value inherited from the parent List component.
     * @default false
     */
    dense?: boolean;

    /**
     * If `true`, the component is disabled.
     * @default false
     * @deprecated checkout [ListItemButton](/material-ui/api/list-item-button/) instead
     */
    disabled?: boolean;

    /**
     * If `true`, the left and right padding is removed.
     * @default false
     */
    disableGutters?: boolean;

    /**
     * If `true`, all padding is removed.
     * @default false
     */
    disablePadding?: boolean;

    /**
     * If `true`, a 1px light border is added to the bottom of the list item.
     * @default false
     */
    divider?: boolean;

    /**
     * The element to display at the end of ListItem.
     */
    secondaryAction?: React.ReactNode;

    /**
     * Use to apply selected styling.
     * @default false
     * @deprecated checkout [ListItemButton](/material-ui/api/list-item-button/) instead
     */
    selected?: boolean;

    /**
     * The system prop that allows defining system overrides as well as additional CSS styles.
     */
    sx?: SxProps;

    /**
     * Events we need access to for list items
     */
    onClick?: React.MouseEventHandler<HTMLLIElement>;
    onMouseDown?: React.MouseEventHandler<HTMLLIElement>;
    onFocus?: React.FocusEventHandler<HTMLLIElement>;
    onBlur?: React.FocusEventHandler<HTMLLIElement>;
}

export const ListItem = (props: ListItemProps) => {
    const { sx } = props;
    return <MuiListItem sx={sx} {...props} />;
};
