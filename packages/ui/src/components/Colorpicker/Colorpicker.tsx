import {
    ColorPicker as MuiColorPicker,
    ColorPickerProps as MuiColorPickerProps,
} from "mui-color";

export type ColorPickerProps = MuiColorPickerProps;

export const ColorPicker = (props: ColorPickerProps) => {
    return <MuiColorPicker {...props} />;
};
