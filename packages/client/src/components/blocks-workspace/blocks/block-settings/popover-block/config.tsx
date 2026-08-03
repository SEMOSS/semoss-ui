import { Network } from "lucide-react";
import { useRef, useState } from "react";
import {
	type Block,
	type BlockDef,
	type Paths,
	type PathValue,
	useBlocks,
} from "@semoss/renderer";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks/useBlockSettings";
import { BaseSettingSection, ColorSettings } from "../../settings";
import { SwitchSettings } from "../../settings/shared/SwitchSettings";
import { BLOCK_TYPE_LAYOUT } from "../block-defaults.constants";
import {
	buildBorderSection,
	buildDimensionsSection,
	buildListener,
	buildShowField,
	buildSpacingSection,
} from "../block-defaults.shared";
import type { BlockSettingsConfig } from "../settings.types";

const TRIGGER_OPTIONS = [
	{ value: "click", label: "Click" },
	// TODO: Fix hover Trigger
	// { value: "hover", label: "Hover" },
];

const SettingAutocomplete = <D extends BlockDef>({
	id,
	path,
	options,
	initialValue,
	onValueChange,
}: {
	id: string;
	path: Paths<Block<D>["data"], 4>;
	options: Array<{ label: string; value: string }>;
	label: string;
	initialValue?: string;
	onValueChange?: (value: string) => void;
}) => {
	const { data, setData } = useBlockSettings<D>(id);
	const [selectedValue, setSelectedValue] = useState(
		data[path] || initialValue,
	);
	const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

	const setBlockData = (newValue: string | undefined) => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}

		timeoutRef.current = setTimeout(() => {
			try {
				setData(path, newValue as PathValue<D["data"], typeof path>);
				setSelectedValue(newValue);
				if (onValueChange) {
					onValueChange(newValue || "");
				}
			} catch (e) {
				console.log(e);
			}
		}, 300);
	};

	return (
		<Select
			value={selectedValue ?? ""}
			onValueChange={(val) => setBlockData(val)}
		>
			<SelectTrigger className="w-full">
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				{options.map((opt) => (
					<SelectItem key={opt.value} value={opt.value}>
						{opt.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
};

const LayersDropdown = ({ id }) => {
	const { state } = useBlocks();

	// If getAllBlocksOfType isn't available, get all blocks from state
	const allBlocks = Object.values(state.blocks || {});

	const getAllBlock = allBlocks.map((block) => block.id);

	if (getAllBlock.length === 0) {
		return <p className="text-sm">Layers panel not found</p>;
	}

	const options = getAllBlock.map((block) => {
		return {
			label: block,
			value: block,
		};
	});

	return (
		<BaseSettingSection label="Select a layer">
			<SettingAutocomplete
				id={id}
				path={"targetId"}
				options={options}
				label="Select a layer"
			/>
		</BaseSettingSection>
	);
};

export const config: BlockSettingsConfig = {
	type: BLOCK_TYPE_LAYOUT,
	icon: Network,
	contentMenu: [
		{
			name: "General",
			children: [
				{
					description: "Design Mode",
					render: ({ id }) => (
						<SwitchSettings
							id={id}
							label="Design Mode"
							path="designMode"
							description="Enable to edit modal content"
						/>
					),
				},

				{
					description: "Layers",
					render: ({ id }) => <LayersDropdown id={id} />,
				},
				{
					description: "Trigger",
					render: ({ id }) => (
						<BaseSettingSection label="Trigger">
							<SettingAutocomplete
								id={id}
								path="openTrigger"
								options={TRIGGER_OPTIONS}
								label="Trigger"
							/>
						</BaseSettingSection>
					),
				},
			],
		},
		{
			name: "Conditional",
			children: [...buildShowField()],
		},
		{
			name: "Pre Process",
			children: [...buildListener("onOpen")],
		},
		{
			name: "Post Process",
			children: [...buildListener("onClose")],
		},
	],
	styleMenu: [
		buildSpacingSection(),
		buildDimensionsSection(),
		{
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
			],
		},
		buildBorderSection(),
	],
};
