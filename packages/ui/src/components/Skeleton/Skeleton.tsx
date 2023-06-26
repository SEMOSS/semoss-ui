import { ReactNode } from "react";
import MuiSkeleton from "@mui/material/Skeleton";
import { SxProps } from "@mui/system";
import { SkeletonProps as MuiSkeletonProps } from "@mui/material";

export interface SkeletonProps extends MuiSkeletonProps {
    /** custom style object */
    width: number;
    height: number;
    sx?: SxProps;
    animation?: "pulse" | "wave" | false;
    variant?: "circular" | "rectangular" | "rounded" | "text";
}

export const Skeleton = (props: SkeletonProps) => {
    const { sx } = props;
    return <MuiSkeleton sx={sx} {...props} />;
};
