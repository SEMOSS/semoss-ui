import { Tabs as MuiTabs, SxProps } from "@mui/material";

export interface TabsProps<V> {
    /**
     * The label for the Tabs as a string.
     */
    "aria-label"?: string;

    /**
     * The content of the component.
     */
    children?: React.ReactNode;
    /**
     * Determines the color of the indicator.
     * @default 'primary'
     */
    indicatorColor?: "secondary" | "primary";

    /** custom style object */
    sx?: SxProps;

    /**
     * Determines the color of the `Tab`.
     * @default 'primary'
     */
    textColor?: "secondary" | "primary" | "inherit";
    /**
     * Callback fired when the value changes.
     */
    onChange?: (event: React.SyntheticEvent, value: V) => void;
    /**
     * The value of the currently selected `Tab`.
     * If you don't want any selected `Tab`, you can set this prop to `false`.
     */
    value?: V;
}

export const Tabs = (props: TabsProps<string | number>) => {
    const { sx } = props;
    return <MuiTabs sx={sx} {...props} />;
};
