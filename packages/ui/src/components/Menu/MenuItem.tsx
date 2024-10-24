import { MenuItem as MuiMenuItem, SxProps } from "@mui/material";

export interface MenuItemProps {
    /**
     * If `true`, the list item is focused during the first mount.
     * Focus will also be triggered if the value changes from false to true.
     * @default false
     */
    autoFocus?: boolean;

    /**
     * content to render
     */
    children: React.ReactNode;

    /**
     * If `true`, compact vertical padding designed for keyboard and mouse input is used.
     * The prop defaults to the value inherited from the parent Menu component.
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
     * If `true`, a 1px light border is added to the bottom of the menu item.
     * @default false
     */
    divider?: boolean;

    /**
     on click function to fired
    */
    onClick?: (event: React.MouseEvent) => void;

    /**
     * If `true`, the component is selected.
     * @default false
     */
    selected?: boolean;

    /** value of item */
    value: any;

    /**
     * The system prop that allows defining system overrides as well as additional CSS styles.
     */
    sx?: SxProps;

    title?: string;
}

export const MenuItem = (props: MenuItemProps) => {
    const { sx } = props;
    return <MuiMenuItem sx={sx} {...props} />;
};
