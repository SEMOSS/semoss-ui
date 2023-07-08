import MuiTabs from "@mui/material/Tabs";
import { SxProps } from "@mui/system";

export interface TabsProps {
    /**
     * The label for the Tabs as a string.
     */
    "aria-label"?: string;
    // custom style object
    /**
     * Determines the color of the indicator.
     * @default 'primary'
     */
    indicatorColor?: "secondary" | "primary";

    sx?: SxProps;
    /**
     * Determines the color of the `Tab`.
     * @default 'primary'
     */
    textColor?: "secondary" | "primary" | "inherit";
    /**
     * Callback fired when the value changes.
     */
    onChange?: (event: React.SyntheticEvent, value: any) => void;
    /**
     * The value of the currently selected `Tab`.
     * If you don't want any selected `Tab`, you can set this prop to `false`.
     */
    value?: any;
}

export const Tabs = (props: TabsProps) => {
    const { sx } = props;
    return <MuiTabs sx={sx} {...props} />;
};
