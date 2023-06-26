import { ColorPicker as MuiColorPicker } from "mui-color";

type Raw = string | number | object | string[] | number[];

interface ColorObject {
    css: React.CSSProperties;
    value: number;
    hex: string;
    raw: Raw;
    name: string;
    alpha: number;
    rgb: [number, number, number];
    hsv: [number, number, number];
    hsl: [number, number, number];
}

interface ColorError extends ColorObject {
    name: "none";
    error: "Wrong format" | "Not an hex value";
    value: 0;
    alpha: 1;
    format: "unknown";
    hex: "000000";
    rgb: [0, 0, 0];
    hsv: [0, 0, 0];
    hsl: [0, 0, 0];
}

interface ColorType extends ColorObject {
    format: ColorFormat;
}

type Color = ColorType | ColorError;

type ColorValue = Color | string | number | Array<string | number>;

enum ColorFormat {
    "plain",
    "hex",
    "hsl",
    "rgb",
    "hsv",
}

export type ColorPickerProps = {
    //** color value */
    value?: ColorValue;

    //**default color value */
    defaultValue?: ColorValue;

    //** disable user inputs on textfield */
    disableTextfield?: boolean;

    //** hide the textfield */
    hideTextfield?: boolean;

    //** format of color value */
    inputFormats?: ColorFormat[];

    //** onChange event */
    onChange: (color: ColorValue) => void;
};

export const ColorPicker = (props: ColorPickerProps) => {
    return <MuiColorPicker {...props} />;
};
