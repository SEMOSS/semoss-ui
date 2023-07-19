import React, { ReactNode } from "react";
import { Tabs, TabsProps } from "../Tabs";
import { Box } from "../Box";
import { styled } from "@mui/material";
import { Theme } from "@mui/material/styles";
import { SxProps } from "@mui/system";

export interface ToggleTabsProps extends TabsProps<any> {
    // * Props applied to the tab indicator element.
    children?: ReactNode;
    TabIndicatorProps?: React.HTMLAttributes<HTMLDivElement>;
    sx?: SxProps<Theme>;
}

const StyledBox = styled(Box)(({ theme }) => ({
    backgroundColor:
        theme.palette.mode === "dark" ? "#0000000A" : "rgba(4, 113, 240, 0.04)",
    border: theme.palette.mode === "dark" ? "1px" : 0,
    borderRadius: "6px",
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
                : theme.palette.primary.light,
        fontWeight: 700,
    },
    "& .MuiTab-root.Mui-selected": {
        backgroundColor:
            theme.palette.mode === "dark"
                ? "rgba(4, 113, 240, 0.16)"
                : "#FFFFFF",
        fontWeight: 700,
    },
}));

export const ToggleTabsGroup = (props: ToggleTabsProps) => {
    const { sx } = props;
    return (
        <StyledBox>
            <StyledToggleGroup
                TabIndicatorProps={{ style: { display: "none" } }}
                sx={sx}
                {...props}
            />
        </StyledBox>
    );
};
