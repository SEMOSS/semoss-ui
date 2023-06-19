import MuiTabs from "@mui/material/Tabs";
import { SxProps } from "@mui/system";
import { TabsProps as MuiTabsProps } from "@mui/material";

export interface TabsProps extends MuiTabsProps {
    // custom style object
    sx?: SxProps;
}

export const Tabs = (props: TabsProps) => {
    const { sx } = props;
    return <MuiTabs sx={sx} {...props} />;
};
