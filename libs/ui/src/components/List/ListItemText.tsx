import { ListItemText as MuiListItemText, SxProps } from "@mui/material";

export interface ListItemTextProps {
    /**
     * Alias for the `primary` prop.
     */
    children?: React.ReactNode;

    /**
     * If `true`, the children won't be wrapped by a Typography component.
     * This can be useful to render an alternative Typography variant by wrapping
     * the `children` (or `primary`) text, and optional `secondary` text
     * with the Typography component.
     * @default false
     */
    disableTypography?: boolean;

    /**
     * If `true`, the children are indented.
     * This should be used if there is no left avatar or left icon.
     * @default false
     */
    inset?: boolean;

    /**
     * The main content element.
     */
    primary?: React.ReactNode;

    /**
     * The secondary content element.
     */
    secondary?: React.ReactNode;

    /**
     * Props to be applied to primary content
     */
    primaryTypographyProps?: object;

    /**
     * Props to be applied to secondary content
     */
    secondaryTypographyProps?: object;

    /**
     * The system prop that allows defining system overrides as well as additional CSS styles.
     */
    sx?: SxProps;
}
export const ListItemText = (props: ListItemTextProps) => {
    const { sx } = props;
    return <MuiListItemText sx={sx} {...props} />;
};
