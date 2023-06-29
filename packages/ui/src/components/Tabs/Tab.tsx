import { ReactNode } from "react";
import MuiTab from "@mui/material/Tab";
import { SxProps } from "@mui/system";

export interface TabProps {
    /**
     * If `true`, the component is disabled.
     * @default false
     */
    disabled?: boolean;
    /**
     * @default 'top'
    /**
     * The label element.
     */
    label?: ReactNode;
    sx?: SxProps;
    /**
     * You can provide your own value. Otherwise, we fallback to the child position index.
     */
    value?: any;
}

export const Tab = (props: TabProps) => {
    const { sx } = props;
    return <MuiTab sx={sx} {...props} />;
};
