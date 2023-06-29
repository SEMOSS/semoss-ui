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
     * The position of the icon relative to the label.
     * @default 'top'
     */
    iconPosition?: "top" | "bottom" | "start" | "end";
    /**
     * The label element.
     */
    label?: ReactNode;

    /** style object */
    sx?: SxProps;

    /**
     * You can provide your own value. Otherwise, we fallback to the child position index.
     */
    value?: string | number;
}

export const Tab = (props: TabProps) => {
    const { sx } = props;
    return <MuiTab sx={sx} {...props} />;
};
