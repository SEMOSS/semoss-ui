import { ComponentPropsWithoutRef, ReactNode } from "react";
import MuiChip from "@mui/material/Chip";
import { SxProps } from "@mui/system";
import { ChipProps as MuiChipProps } from "@mui/material";

export interface ChipProps extends MuiChipProps {
    /** custom style object */
    sx?: SxProps;
}

export const Chip = (props: ChipProps) => {
    const { sx } = props;
    return <MuiChip sx={sx} {...props} />;
};
