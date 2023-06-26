import { ReactNode } from "react";
import MuiTab from "@mui/material/Tab";
import { SxProps } from "@mui/system";
import { TabProps as MuiTabProps } from "@mui/material";

export interface TabProps extends MuiTabProps {
    // custom style object
    sx?: SxProps;
}

export const Tab = (props: TabProps) => {
    const { sx } = props;
    return <MuiTab sx={sx} {...props} />;
};
