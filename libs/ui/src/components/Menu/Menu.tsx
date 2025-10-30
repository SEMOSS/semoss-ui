import { Menu as MuiMenu, type SxProps } from "@mui/material";

export type MenuAnchorReference = "anchorEl" | "anchorPosition";

export interface MenuPosition {
	top: number;
	left: number;
}

export interface MenuProps {
	/**
	 * Id of the menu
	 */

	id?: string;

	/**
	 * An HTML element, or a function that returns one.
	 * It's used to set the position of the menu.
	 */
	anchorEl?: HTMLElement | null | (() => HTMLElement | null);

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
	/**
	 * This is the position that may be used to set the position of the popover.
	 * The coordinates are relative to the application's client area.
	 */
	anchorPosition?: MenuPosition;

	children?: React.ReactNode;
	/**
	 * Determines which anchor prop to use for positioning the popover.
	 */
	anchorReference?: MenuAnchorReference;
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
	 */
	onClose?: () => void;

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

	/**
	 *
	 */
	anchorOrigin?: {
		vertical: "top" | "center" | "bottom" | number;
		horizontal: "left" | "center" | "right" | number;
	};

	/**
	 *
	 */
	transformOrigin?: {
		vertical: "top" | "center" | "bottom" | number;
		horizontal: "left" | "center" | "right" | number;
	};
}

export const Menu: React.FC<MenuProps> = ({ children, ...otherProps }) => {
	return <MuiMenu {...otherProps}>{children}</MuiMenu>;
};
