import { Divider as MuiDivider, SxProps } from "@mui/material";

export interface DividerProps {
    /**
     * Absolutely position the element.
     * @default false
     */
    absolute?: boolean;

    /**
     * The content of the component.
     */
    children?: React.ReactNode;

    /**
     * If `true`, a vertical divider will have the correct height when used in flex container.
     * (By default, a vertical divider will have a calculated height of `0px` if it is the child of a flex container.)
     * @default false
     */
    flexItem?: boolean;

    /**
     * If `true`, the divider will have a lighter color.
     * @default false
     */
    light?: boolean;

    /**
     * The component orientation.
     * @default 'horizontal'
     */
    orientation?: "horizontal" | "vertical";

    /**
     * The system prop that allows defining system overrides as well as additional CSS styles.
     */
    sx?: SxProps;

    /**
     * The text alignment.
     * @default 'center'
     */
    textAlign?: "center" | "right" | "left";
    /**
     * The variant to use.
     * @default 'fullWidth'
     */
    variant?: "fullWidth" | "inset" | "middle";
}

export const Divider = (props: DividerProps) => {
    const { sx } = props;
    return <MuiDivider sx={sx} {...props} />;
};
