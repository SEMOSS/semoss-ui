import { ReactNode } from "react";
import MuiSlider from "@mui/material/Slider";
import { SxProps } from "@mui/system";
import { SliderProps as MuiSliderProps } from "@mui/material";

export interface SliderProps extends MuiSliderProps {
    /** custom style object */
    sx?: SxProps;
    "aria-label"?: string;
    color?: "primary" | "secondary";
    disabled?: boolean;
    max?: number;
    min?: number;
    step?: number;
    defaultValue?: number;
    marks?: boolean;
    onChange?: () => void;
    size?: "medium" | "small";
}

export const Slider = (props: SliderProps) => {
    const { sx } = props;
    return <MuiSlider sx={sx} {...props} />;
};
