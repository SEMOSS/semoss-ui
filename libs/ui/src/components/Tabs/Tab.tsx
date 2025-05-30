import { ReactNode } from "react";
import { Tab as MuiTab, SxProps } from "@mui/material";

export interface TabProps<V = string | number> {
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

    /**
     * The label element.
     */
    icon?: string | React.ReactElement;

    /** style object */
    title?: string;

    /** style object */
    sx?: SxProps;

    /**
     * You can provide your own value. Otherwise, we fallback to the child position index.
     */
    value?: V;
}

export const Tab = <V,>(props: TabProps<V>) => {
    return <MuiTab {...props} />;
};
