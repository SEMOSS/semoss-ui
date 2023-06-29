import { Menu as MuiMenu, SxProps, PopoverProps } from "@mui/material";

export interface MenuProps {
    /**
     * An HTML element, or a function that returns one.
     * It's used to set the position of the menu.
     */
    anchorEl?: PopoverProps["anchorEl"];

    /**
     * If `true` (Default) will focus the `[role="menu"]` if no focusable child is found. Disabled
     * children are not focusable. If you set this prop to `false` focus will be placed
     * on the parent modal container. This has severe accessibility implications
     * and should only be considered if you manage focus otherwise.
     * @default true
     */
    autoFocus?: boolean;

    /**
     * Menu contents, normally `MenuItem`s.
     */
    children?: React.ReactNode;

    /**
     * When opening the menu will not focus the active item but the `[role="menu"]`
     * unless `autoFocus` is also set to `false`. Not using the default means not
     * following WAI-ARIA authoring practices. Please be considerate about possible
     * accessibility implications.
     * @default false
     */
    disableAutoFocusItem?: boolean;

    /**
     * Callback fired when the component requests to be closed.
     *
     * @param {object} event The event source of the callback.
     * @param {string} reason Can be: `"escapeKeyDown"`, `"backdropClick"`, `"tabKeyDown"`.
     */
    onClose?: PopoverProps["onClose"];

    /**
     * If `true`, the component is shown.
     */
    open: boolean;

    /**
     * The system prop that allows defining system overrides as well as additional CSS styles.
     */
    sx?: SxProps;

    /**
     * The variant to use. Use `menu` to prevent selected items from impacting the initial focus.
     * @default 'selectedMenu'
     */
    variant?: "menu" | "selectedMenu";
}

export const Menu = (props: MenuProps) => {
    const { sx } = props;
    return <MuiMenu sx={sx} {...props} />;
};
