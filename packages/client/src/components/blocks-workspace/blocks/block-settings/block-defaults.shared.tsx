import {
	AlignCenter,
	AlignHorizontalJustifyCenter,
	AlignHorizontalJustifyEnd,
	AlignHorizontalJustifyStart,
	AlignJustify,
	AlignLeft,
	AlignRight,
	AlignVerticalDistributeCenter,
	AlignVerticalJustifyEnd,
	AlignVerticalJustifyStart,
	ArrowDown,
	ArrowRight,
	Bold,
	Italic,
	RotateCcw,
	Underline,
} from "lucide-react";
import { type BlockDef, useBlocks } from "@semoss/renderer";
import { ListenerSettings, QueryInputSettings } from "../settings";
import { BorderSettings } from "../settings/custom/BorderSettings";
import { SizeSpacingSettings } from "../settings/custom/SizeSpacingSettings";
import { BoxShadowSizeSettings } from "../settings/shared/BoxShadowSizeSetting";
import { ButtonGroupSettings } from "../settings/shared/ButtonGroupSettings";
import { ColorSettings } from "../settings/shared/ColorSettings";
import { DistinctPathButtonGroupSettings } from "../settings/shared/DistinctPathButtonGroupSettings";
import { SelectInputSettings } from "../settings/shared/SelectInputSettings";
import { SizeSettings } from "../settings/shared/SizeSettings";
import { StandardColorSettings } from "../settings/shared/StandardColorSettings";
import {
	DEFAULT_FALSE_VARIABLE,
	DEFAULT_TRUE_VARIABLE,
} from "./block-defaults.constants";

const trueSegment = DEFAULT_TRUE_VARIABLE;
const falseSegment = DEFAULT_FALSE_VARIABLE;
/**
 * Build the Layout Section
 */
export const buildLayoutSection = () => ({
	name: "Layout",
	children: [
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
							icon: AlignVerticalJustifyStart,
							title: "Top",
							isDefault: true,
						},
						{
							value: "center",
							icon: AlignVerticalDistributeCenter,
							title: "Center",
							isDefault: false,
						},
						{
							value: "end",
							icon: AlignVerticalJustifyEnd,
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
							icon: AlignHorizontalJustifyStart,
							title: "Top",
							isDefault: true,
						},
						{
							value: "center",
							icon: AlignHorizontalJustifyCenter,
							title: "Center",
							isDefault: false,
						},
						{
							value: "right",
							icon: AlignHorizontalJustifyEnd,
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
							icon: ArrowDown,
							title: "Column",
							isDefault: true,
						},
						{
							value: "row",
							icon: ArrowRight,
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
							icon: AlignLeft,
							title: "Left",
							isDefault: true,
						},
						{
							value: "right",
							icon: AlignRight,
							title: "Right",
							isDefault: false,
						},
						{
							value: "center",
							icon: AlignCenter,
							title: "Center",
							isDefault: false,
						},
						{
							value: "justify",
							icon: AlignJustify,
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
				<SizeSpacingSettings
					id={id}
					label="Margin"
					path="style.margin"
				/>
			),
		},
		{
			description: "Padding",
			render: ({ id }) => (
				<SizeSpacingSettings
					id={id}
					label="Padding"
					path="style.padding"
				/>
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
				<StandardColorSettings
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
							icon: RotateCcw,
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
							icon: AlignHorizontalJustifyStart,
							title: "Start",
							isDefault: false,
						},
						{
							value: "center",
							icon: AlignHorizontalJustifyCenter,
							title: "Center",
							isDefault: false,
						},
						{
							value: "flex-end",
							icon: AlignHorizontalJustifyEnd,
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
							icon: Bold,
							path: "style.fontWeight",
							title: "Bold",
							isDefault: false,
						},
						{
							value: "italic",
							icon: Italic,
							path: "style.fontStyle",
							title: "Italic",
							isDefault: false,
						},
						{
							value: "underline",
							icon: Underline,
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
export function getShowFieldOptions(_id: string) {
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
export const buildShowField = <_D extends BlockDef = BlockDef>() => [
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

/**
 * Build the Box Shadow Section
 * @returns a box shadow section
 */

export const buildShadowSection = () => ({
	name: "Box Shadow",
	children: [
		{
			description: "Offset-x",
			render: ({ id }) => (
				<BoxShadowSizeSettings
					id={id}
					label="Offset-x"
					path="boxShadowParts.offsetX"
					required={true}
				/>
			),
		},
		{
			description: "Offset-y",
			render: ({ id }) => (
				<BoxShadowSizeSettings
					id={id}
					label="Offset-y"
					path="boxShadowParts.offsetY"
					required={true}
				/>
			),
		},
		{
			description: "Blur Radius",
			render: ({ id }) => (
				<BoxShadowSizeSettings
					id={id}
					label="Blur Radius"
					path="boxShadowParts.blurRadius"
				/>
			),
		},
		{
			description: "Spread Radius",
			render: ({ id }) => (
				<BoxShadowSizeSettings
					id={id}
					label="Spread Radius"
					path="boxShadowParts.spreadRadius"
				/>
			),
		},
		{
			description: "Color",
			render: ({ id }) => (
				<StandardColorSettings
					id={id}
					label="Color"
					path="boxShadowParts.color"
				/>
			),
		},
	],
});
