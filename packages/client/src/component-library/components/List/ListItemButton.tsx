import {
    ListItemButton as MuiListItemButton,
    ListItemButtonProps as MuiListItemButtonProps,
    SxProps,
} from '@mui/material';

export interface ListItemButtonProps {
    /**
     * Defines the `align-items` style property.
     * @default 'center'
     */
    alignItems?: 'flex-start' | 'center';

    /**
     * If `true`, the list item is focused during the first mount.
     * Focus will also be triggered if the value changes from false to true.
     * @default false
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
     */
    disabled?: boolean;

    /**
     * If `true`, the left and right padding is removed.
     * @default false
     */
    disableGutters?: boolean;

    /**
     * If `true`, a 1px light border is added to the bottom of the list item.
     * @default false
     */
    divider?: boolean;

    /**
     * Use to apply selected styling.
     * @default false
     */
    selected?: boolean;

    /**
     * The system prop that allows defining system overrides as well as additional CSS styles.
     */
    sx?: SxProps;

    onClick?: MuiListItemButtonProps['onClick'];
    onMouseOver?: MuiListItemButtonProps['onMouseOver'];
    onMouseLeave?: MuiListItemButtonProps['onMouseLeave'];
}

export const ListItemButton = (props: ListItemButtonProps) => {
    return <MuiListItemButton {...props} />;
};
