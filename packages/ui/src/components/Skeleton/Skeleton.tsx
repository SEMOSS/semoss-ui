import { ReactNode } from "react";
import MuiSkeleton from "@mui/material/Skeleton";
import { SxProps } from "@mui/system";

export interface SkeletonProps {
    /**
     * Width of the skeleton.
     * Useful when the skeleton is inside an inline element with no width of its own.
     */
    width: number;
    /**
     * Height of the skeleton.
     * Useful when you don't want to adapt the skeleton to a text element but for instance a card.
     */
    height: number;
    sx?: SxProps;
    /**
     * The animation.
     * If `false` the animation effect is disabled.
     * @default 'pulse'
     */
    animation?: "pulse" | "wave" | false;
    /**
     * The type of content that will be rendered.
     * @default 'text'
     */
    variant?: "circular" | "rectangular" | "rounded" | "text";
}

export const Skeleton = (props: SkeletonProps) => {
    const { sx } = props;
    return <MuiSkeleton sx={sx} {...props} />;
};
