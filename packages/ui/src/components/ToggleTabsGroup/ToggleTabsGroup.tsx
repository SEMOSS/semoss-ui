import React, { ReactNode } from "react";
import { styled, Theme, SxProps } from "@mui/material";
import { Tabs, TabsProps } from "../Tabs";
import { Box } from "../Box";

export interface ToggleTabsProps extends TabsProps<string | number> {
    // * Props applied to the tab indicator element.
    children?: ReactNode;

    // width?: "full" | "fit-content";
    TabIndicatorProps?: React.HTMLAttributes<HTMLDivElement>;

    boxSx?: SxProps;

    sx?: SxProps<Theme>;
}

const StyledBox = styled(Box)(({ theme }) => ({
    backgroundColor:
        theme.palette.mode === "dark" ? "#0000000A" : "rgba(0, 0, 0, 0.04)",
    border: theme.palette.mode === "dark" ? "1px" : 0,
    borderRadius: "12px",
    width: "fit-content",
    borderColor: "rgba(4, 113, 240, 0.5)",
}));

const StyledToggleGroup = styled(Tabs)(({ theme }) => ({
    "& .MuiTab-root": {
        margin: "8px 5px 8px 5px",
        borderRadius: "6px",
        lineHeight: 0,
        minHeight: "unset",
        padding: "16px",
        color:
            theme.palette.mode === "dark"
                ? "#8BCAFF"
                : theme.palette.text.disabled,
        fontWeight: 700,
    },
    "& .MuiTab-root.Mui-selected": {
        backgroundColor:
            theme.palette.mode === "dark"
                ? "rgba(4, 113, 240, 0.16)"
                : "#FFFFFF",
        fontWeight: 700,
        color: theme.palette.text.secondary,
    },
}));

export const ToggleTabsGroup = (props: ToggleTabsProps) => {
    const { sx, boxSx } = props;
    return (
        <StyledBox sx={boxSx}>
            <StyledToggleGroup
                TabIndicatorProps={{ style: { display: "none" } }}
                sx={sx}
                {...props}
            />
        </StyledBox>
    );
};
