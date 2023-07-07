import React from "react";
import { Tab, TabProps } from "../Tabs/index";
import { SxProps } from "@mui/system";

export const Toggle = (props: TabProps) => {
    const { sx } = props;
    return <Tab sx={sx} {...props} />;
};
