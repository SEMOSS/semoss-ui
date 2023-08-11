import { Icon as MuiIcon, SxProps } from "@mui/material";

export interface IconProps {
    /**
     * The name of the icon font ligature.
     */
    children?: React.ReactNode;

    /**
     * The color of the component.
     * It supports both default and custom theme colors, which can be added as shown in the
     * [palette customization guide](https://mui.com/material-ui/customization/palette/#adding-new-colors).
     * @default 'inherit'
     */
    color?:
        | "inherit"
        | "action"
        | "disabled"
        | "primary"
        | "secondary"
        | "error"
        | "info"
        | "success"
        | "warning";

    /**
     * The fontSize applied to the icon. Defaults to 24px, but can be configure to inherit font size.
     * @default 'medium'
     */
    fontSize?: "inherit" | "large" | "medium" | "small";

    /**
     * The system prop that allows defining system overrides as well as additional CSS styles.
     */
    sx?: SxProps;
}

export const Icon = (props: IconProps) => {
    const { children, sx } = props;
    return (
        <MuiIcon sx={sx} {...props}>
            {children}
        </MuiIcon>
    );
};
