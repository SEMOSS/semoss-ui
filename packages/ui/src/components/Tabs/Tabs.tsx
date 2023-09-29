import {
    Tabs as MuiTabs,
    TabsProps as MuiTabsProps,
    SxProps,
} from "@mui/material";

export interface TabsProps extends MuiTabsProps {
    /** custom style object */
    sx?: SxProps;
}

export const Tabs = (props: TabsProps) => {
    const { sx } = props;
    return <MuiTabs sx={sx} {...props} />;
};
