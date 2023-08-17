import React from "react";
import { List as MuiChecklist, SxProps } from "@mui/material";

export interface ChecklistProps {
    /**
     * The content of the component.
     */
    children?: React.ReactNode;

    /**
     * If `true`, compact vertical padding designed for keyboard and mouse input is used for
     * the list and list items.
     * The prop is available to descendant components as the `dense` context.
     * @default false
     */
    dense?: boolean;

    /**
     * If `true`, vertical padding is removed from the list.
     * @default false
     */
    disablePadding?: boolean;

    /**
     * The content of the subheader, normally `ListSubheader`.
     */
    subheader?: React.ReactNode;

    /**
     * The system prop that allows defining system overrides as well as additional CSS styles.
     */
    sx?: SxProps;
}

export const Checklist = (props: ChecklistProps) => {
    const { sx } = props;
    return <MuiChecklist sx={sx} {...props} />;
};
