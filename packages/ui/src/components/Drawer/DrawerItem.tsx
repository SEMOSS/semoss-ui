import { MenuItem as MuiMenuItem, SxProps, styled } from "@mui/material";
import { ListItemText, ListItemIcon } from "@mui/material";

const StyledMenuItem = styled(MuiMenuItem)({
    padding: "8px, 16px, 8px, 16px",
});

export interface DrawerItemProps {
    /**
     * If `true`, the list item is focused during the first mount.
     * Focus will also be triggered if the value changes from false to true.
     * @default false
     */
    autoFocus?: boolean;

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

    //** item to be displayed on line end */
    endcontent?: React.ReactNode;

    /**
     on click function to fired
    */
    onClick?: () => void;

    /**
     * If `true`, the component is selected.
     * @default false
     */
    selected?: boolean;

    //** item to be displayed at line start */
    startcontent?: React.ReactNode;

    //**text content */
    textcontent: React.ReactNode;

    /**
     * The system prop that allows defining system overrides as well as additional CSS styles.
     */
    sx?: SxProps;
}

export const DrawerItem = (props: DrawerItemProps) => {
    const { sx } = props;
    return (
        <StyledMenuItem sx={sx} {...props}>
            <ListItemIcon>{props.startcontent}</ListItemIcon>
            <ListItemText>{props.textcontent}</ListItemText>
            <ListItemIcon>{props.endcontent}</ListItemIcon>
        </StyledMenuItem>
    );
};
