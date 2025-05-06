import { BlockDef } from "../../store";
import { ListenerSettings, QueryInputSettings } from "../block-settings";
import { FontSizeSettings } from "../block-settings/custom/FontSizeSettings";
import { SizeSettings } from "../block-settings/shared/SizeSettings";
import { ColorSettings } from "../block-settings/shared/ColorSettings";
import { BorderSettings } from "../block-settings/custom/BorderSettings";
import { ButtonGroupSettings } from "../block-settings/shared/ButtonGroupSettings";
import {
    AlignHorizontalCenter,
    AlignHorizontalLeft,
    AlignHorizontalRight,
    ArrowDownward,
    ArrowForward,
    FormatAlignCenter,
    FormatAlignJustify,
    FormatAlignLeft,
    FormatAlignRight,
    FormatBold,
    FormatItalic,
    RestartAlt,
    FormatUnderlined,
    VerticalAlignBottom,
    VerticalAlignCenter,
    VerticalAlignTop,
} from "@mui/icons-material";
import { DistinctPathButtonGroupSettings } from "../block-settings/shared/DistinctPathButtonGroupSettings";
import { SelectInputSettings } from "../block-settings/shared/SelectInputSettings";
import { useBlocks } from "../../hooks";
import {
    DEFAULT_TRUE_VARIABLE,
    DEFAULT_FALSE_VARIABLE,
} from "./block-defaults.constants";

const trueSegment = DEFAULT_TRUE_VARIABLE;
const falseSegment = DEFAULT_FALSE_VARIABLE;
/**
 * Build the Layout Section
 */
export const buildLayoutSection = () => ({
    name: "Layout",
    children: [
        ...buildShowField(),
        {
            description: "Vertical Align",
            render: ({ id }) => (
                <ButtonGroupSettings
                    id={id}
                    path="style.alignItems"
                    label="Vertical Align"
                    options={[
                        {
                            value: "start",
                            icon: VerticalAlignTop,
                            title: "Top",
                            isDefault: true,
                        },
                        {
                            value: "center",
                            icon: VerticalAlignCenter,
                            title: "Center",
                            isDefault: false,
                        },
                        {
                            value: "end",
                            icon: VerticalAlignBottom,
                            title: "Bottom",
                            isDefault: false,
                        },
                    ]}
                />
            ),
        },
        {
            description: "Horitzontal Align",
            render: ({ id }) => (
                <ButtonGroupSettings
                    id={id}
                    path="style.justifyContent"
                    label="Horizontal Align"
                    options={[
                        {
                            value: "left",
                            icon: AlignHorizontalLeft,
                            title: "Top",
                            isDefault: true,
                        },
                        {
                            value: "center",
                            icon: AlignHorizontalCenter,
                            title: "Center",
                            isDefault: false,
                        },
                        {
                            value: "right",
                            icon: AlignHorizontalRight,
                            title: "Right",
                            isDefault: false,
                        },
                    ]}
                />
            ),
        },
        {
            description: "Direction",
            render: ({ id }) => (
                <ButtonGroupSettings
                    id={id}
                    path="style.flexDirection"
                    label="Direction"
                    options={[
                        {
                            value: "column",
                            icon: ArrowDownward,
                            title: "Column",
                            isDefault: true,
                        },
                        {
                            value: "row",
                            icon: ArrowForward,
                            title: "Row",
                            isDefault: false,
                        },
                    ]}
                />
            ),
        },
        {
            description: "Gap",
            render: ({ id }) => (
                <SizeSettings id={id} label="Gap" path="style.gap" />
            ),
        },
    ],
});

export const buildTextAlignSection = () => ({
    name: "Layout",
    children: [
        {
            description: "Text Align",
            render: ({ id }) => (
                <ButtonGroupSettings
                    id={id}
                    path="style.textAlign"
                    label="Text Align"
                    options={[
                        {
                            value: "left",
                            icon: FormatAlignLeft,
                            title: "Left",
                            isDefault: true,
                        },
                        {
                            value: "right",
                            icon: FormatAlignRight,
                            title: "Right",
                            isDefault: false,
                        },
                        {
                            value: "center",
                            icon: FormatAlignCenter,
                            title: "Center",
                            isDefault: false,
                        },
                        {
                            value: "justify",
                            icon: FormatAlignJustify,
                            title: "Justify",
                            isDefault: false,
                        },
                    ]}
                />
            ),
        },
    ],
});

/**
 * Build the Spacing Section
 * @returns a spacing section
 */
export const buildSpacingSection = () => ({
    name: "Spacing",
    children: [
        {
            description: "Margin",
            render: ({ id }) => (
                <SizeSettings id={id} label="Margin" path="style.margin" />
            ),
        },
        {
            description: "Padding",
            render: ({ id }) => (
                <SizeSettings id={id} label="Padding" path="style.padding" />
            ),
        },
    ],
});

/**
 * Build the Dimensions Section
 * @returns a dimension section
 */
export const buildDimensionsSection = () => ({
    name: "Dimensions",
    children: [
        {
            description: "Width",
            render: ({ id }) => (
                <SizeSettings id={id} label="Width" path="style.width" />
            ),
        },
        {
            description: "Max Width",
            render: ({ id }) => (
                <SizeSettings id={id} label="Max Width" path="style.maxWidth" />
            ),
        },
        {
            description: "Height",
            render: ({ id }) => (
                <SizeSettings id={id} label="Height" path="style.height" />
            ),
        },
        {
            description: "Max Height",
            render: ({ id }) => (
                <SizeSettings
                    id={id}
                    label="Max Height"
                    path="style.maxHeight"
                />
            ),
        },
    ],
});

/**
 * Build the Color Section
 * @returns a color section
 */
export const buildColorSection = () => ({
    name: "Color",
    children: [
        {
            description: "Background Color",
            render: ({ id }) => (
                <ColorSettings
                    id={id}
                    label="Background Color"
                    path="style.backgroundColor"
                />
            ),
        },
        {
            description: "Reset Background Color",
            render: ({ id }) => (
                <ButtonGroupSettings
                    id={id}
                    path="style.backgroundColor"
                    label="Reset Color"
                    options={[
                        {
                            value: "#FFFFFF00",
                            icon: RestartAlt,
                            title: "Reset",
                            isDefault: true,
                        },
                    ]}
                />
            ),
        },
    ],
});

/**
 * Build the Border Section
 * @returns a border section
 */
export const buildBorderSection = () => ({
    name: "Border",
    children: [
        {
            description: "Border",
            render: ({ id }) => <BorderSettings id={id} path="style.border" />,
        },
        {
            description: "Border Radius",
            render: ({ id }) => (
                <SizeSettings
                    id={id}
                    label="Border Radius"
                    path="style.border-radius"
                />
            ),
        },
    ],
});

/**
 * Build the Position Section
 * @returns a position section
 */
export const buildPositionSection = () => ({
    name: "Position",
    children: [
        {
            description: "Position",
            render: ({ id }) => (
                <SelectInputSettings
                    id={id}
                    path="style.position"
                    label="Position"
                    options={[
                        { value: "static", display: "Static" },
                        { value: "relative", display: "Relative" },
                        { value: "absolute", display: "Absolute" },
                        { value: "fixed", display: "Fixed" },
                        { value: "sticky", display: "Sticky" },
                    ]}
                />
            ),
        },
        {
            description: "Top",
            render: ({ id }) => (
                <SizeSettings id={id} label="Top" path="style.top" />
            ),
        },
        {
            description: "Z-Index",
            render: ({ id }) => (
                <SizeSettings id={id} label="Z-Index" path="style.zIndex" />
            ),
        },
        {
            description: "Display",
            render: ({ id }) => (
                <SelectInputSettings
                    id={id}
                    path="style.display"
                    label="Display"
                    options={[
                        { value: "block", display: "Block" },
                        { value: "inline", display: "Inline" },
                        { value: "inline-block", display: "Inline Block" },
                        { value: "flex", display: "Flex" },
                        { value: "grid", display: "Grid" },
                        { value: "none", display: "None" },
                    ]}
                />
            ),
        },
        {
            description: "Align Items",
            render: ({ id }) => (
                <ButtonGroupSettings
                    id={id}
                    path="style.alignItems"
                    label="Align Items"
                    options={[
                        {
                            value: "flex-start",
                            icon: AlignHorizontalLeft,
                            title: "Start",
                            isDefault: false,
                        },
                        {
                            value: "center",
                            icon: AlignHorizontalCenter,
                            title: "Center",
                            isDefault: false,
                        },
                        {
                            value: "flex-end",
                            icon: AlignHorizontalRight,
                            title: "End",
                            isDefault: false,
                        },
                    ]}
                />
            ),
        },
        {
            description: "Overflow",
            render: ({ id }) => (
                <SelectInputSettings
                    id={id}
                    path="style.overflow"
                    label="Overflow"
                    options={[
                        { value: "visible", display: "Visible" },
                        { value: "hidden", display: "Hidden" },
                        { value: "scroll", display: "Scroll" },
                        { value: "auto", display: "Auto", isDefault: true },
                    ]}
                />
            ),
        },
    ],
});

/**
 * Build the Typography Section
 * @returns a typography section
 */
export const buildTypographySection = () => ({
    name: "Text",
    children: [
        {
            description: "Style",
            render: ({ id }) => (
                <DistinctPathButtonGroupSettings
                    id={id}
                    label="Style"
                    options={[
                        {
                            value: "bold",
                            icon: FormatBold,
                            path: "style.fontWeight",
                            title: "Bold",
                            isDefault: false,
                        },
                        {
                            value: "italic",
                            icon: FormatItalic,
                            path: "style.fontStyle",
                            title: "Italic",
                            isDefault: false,
                        },
                        {
                            value: "underline",
                            icon: FormatUnderlined,
                            path: "style.textDecoration",
                            title: "Underlined",
                            isDefault: false,
                        },
                    ]}
                />
            ),
        },
        {
            description: "Font",
            render: ({ id }) => (
                <SelectInputSettings
                    id={id}
                    path="style.fontFamily"
                    label="Font"
                    allowUnset
                    allowCustomInput
                    options={[
                        {
                            value: "Roboto",
                            display: "Roboto",
                        },
                        {
                            value: "Helvetica",
                            display: "Helvetica",
                        },
                        {
                            value: "Arial",
                            display: "Arial",
                        },
                        {
                            value: "Times New Roman",
                            display: "Times New Roman",
                        },
                        {
                            value: "Georgia",
                            display: "Georgia",
                        },
                    ]}
                />
            ),
        },
        {
            description: "Color",
            render: ({ id }) => (
                <ColorSettings id={id} label="Color" path="style.color" />
            ),
        },
    ],
});

/**
 * Build the Listener Section
 * @returns the Listener Section
 */
export const buildListener = <D extends BlockDef = BlockDef>(
    trigger: Extract<keyof D["listeners"], string>,
) => [
    {
        description: trigger,
        render: ({ id }) => <ListenerSettings id={id} listener={trigger} />,
    },
];

/**
 * get show field optionslist which will contain static true false, dynamic variables list when the block is selected
 */
export function getShowFieldOptions(id: string) {
    const { state } = useBlocks();
    const stateVariableList = Object.keys(state.variables).reduce(
        (acc, queryKey) => {
            if (
                state.variables[queryKey].type === "query" ||
                state.variables[queryKey].type === "cell" ||
                state.variables[queryKey].type === "block"
            ) {
                return [
                    ...acc,
                    {
                        value: `{{${queryKey}}}`,
                        display: queryKey,
                    },
                ];
            } else {
                return [...acc];
            }
        },
        [],
    );
    return [
        {
            value: "true",
            display: "True",
        },
        {
            value: "false",
            display: "False",
        },
        ...stateVariableList,
    ];
}

/**
 * Show field for the block which contains both static true & false, with other variables and send the field
 */
export const buildShowField = <D extends BlockDef = BlockDef>() => [
    {
        description: "Show Block",
        render: ({ id }) => (
            <QueryInputSettings
                id={id}
                label="Show Block"
                path="show"
                defaultPathMap={{
                    ...trueSegment,
                    ...falseSegment,
                }}
            />
        ),
    },
];
