import {
	AlignCenter,
	AlignJustify,
	AlignLeft,
	AlignRight,
	Bold,
	Italic,
	Redo2,
	Underline,
	Undo2,
} from "lucide-react";
import {
	ButtonGroup,
	ToggleGroup,
	ToggleGroupItem,
	toast,
} from "@semoss/ui/next";
import { OfficeActionButton } from "./office-action-button";
import { OfficeSelect } from "./office-select";

interface OfficeTextControlsProps {
	canEdit: boolean;
	canUndo: boolean;
	canRedo: boolean;
	bold: boolean | null;
	italic: boolean | null;
	underline: boolean | null;
	fontFamily: string | null;
	fontSize: number | null;
	alignment: string | null;
	/** Spreadsheet ranges may enable only some formatting commands. */
	enabled?: {
		bold: boolean;
		italic: boolean;
		underline: boolean;
		fontFamily: boolean;
		fontSize: boolean;
		alignment: boolean;
	};
	fontFamilies?: readonly string[];
	fontSizes?: readonly number[];
	allowJustify?: boolean;
	onBold: () => unknown;
	onItalic: () => unknown;
	onUnderline: () => unknown;
	onFontFamilyChange: (value: string) => unknown;
	onFontSizeChange: (value: number) => unknown;
	onAlignmentChange: (
		value: "left" | "center" | "right" | "justify",
	) => unknown;
	onUndo: () => unknown;
	onRedo: () => unknown;
}

/** Shared SEMOSS controls over each format's public text and history callbacks. */
export const OfficeTextControls = (props: OfficeTextControlsProps) => {
	const formats = [
		{
			value: "bold",
			label: "Bold",
			icon: Bold,
			active: props.bold,
			run: props.onBold,
		},
		{
			value: "italic",
			label: "Italic",
			icon: Italic,
			active: props.italic,
			run: props.onItalic,
		},
		{
			value: "underline",
			label: "Underline",
			icon: Underline,
			active: props.underline,
			run: props.onUnderline,
		},
	] as const;
	const alignments: {
		value: "left" | "center" | "right" | "justify";
		label: string;
		icon: typeof AlignLeft;
	}[] = [
		{ value: "left", label: "Align left", icon: AlignLeft },
		{ value: "center", label: "Align center", icon: AlignCenter },
		{ value: "right", label: "Align right", icon: AlignRight },
		...(props.allowJustify
			? [
					{
						value: "justify" as const,
						label: "Justify",
						icon: AlignJustify,
					},
				]
			: []),
	];
	const run = async (action: () => unknown): Promise<void> => {
		// Canvas hooks report validation failures through their own edit-error state.
		try {
			await action();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : String(error));
		}
	};
	return (
		<>
			<ButtonGroup aria-label="History">
				<OfficeActionButton
					label="Undo"
					icon={Undo2}
					disabled={!props.canEdit || !props.canUndo}
					onAction={props.onUndo}
				/>
				<OfficeActionButton
					label="Redo"
					icon={Redo2}
					disabled={!props.canEdit || !props.canRedo}
					onAction={props.onRedo}
				/>
			</ButtonGroup>
			<OfficeSelect
				label="Font"
				value={props.fontFamily}
				options={(
					props.fontFamilies ?? [
						"Arial",
						"Calibri",
						"Cambria",
						"Courier New",
						"Georgia",
						"Segoe UI",
						"Times New Roman",
						"Verdana",
					]
				).map((value) => ({ value, label: value }))}
				disabled={!props.canEdit || props.enabled?.fontFamily === false}
				onChange={(value) =>
					void run(() => props.onFontFamilyChange(value))
				}
			/>
			<OfficeSelect
				label="Font size"
				value={props.fontSize === null ? null : String(props.fontSize)}
				options={(
					props.fontSizes ?? [
						8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 36, 48, 72,
					]
				).map((value) => ({
					value: String(value),
					label: String(value),
				}))}
				disabled={!props.canEdit || props.enabled?.fontSize === false}
				onChange={(value) =>
					void run(() => props.onFontSizeChange(Number(value)))
				}
			/>
			<ToggleGroup
				type="multiple"
				size="sm"
				aria-label="Text formatting"
				value={formats
					.filter((format) => format.active === true)
					.map((format) => format.value)}
				onValueChange={(values) => {
					const changed = formats.find(
						(format) =>
							values.includes(format.value) !==
							(format.active === true),
					);
					if (changed) void run(changed.run);
				}}
			>
				{formats.map(({ value, label, icon: Icon, active }) => (
					<ToggleGroupItem
						key={value}
						value={value}
						aria-label={label}
						aria-pressed={active === null ? "mixed" : active}
						disabled={
							!props.canEdit || props.enabled?.[value] === false
						}
						onMouseDown={(event) => event.preventDefault()}
					>
						<Icon aria-hidden="true" />
					</ToggleGroupItem>
				))}
			</ToggleGroup>
			<ToggleGroup
				type="single"
				size="sm"
				aria-label="Paragraph alignment"
				value={props.alignment ?? ""}
				disabled={!props.canEdit || props.enabled?.alignment === false}
				onValueChange={(value) => {
					const alignment = alignments.find(
						(item) => item.value === value,
					);
					if (alignment)
						void run(() =>
							props.onAlignmentChange(alignment.value),
						);
				}}
			>
				{alignments.map(({ value, label, icon: Icon }) => (
					<ToggleGroupItem
						key={value}
						value={value}
						aria-label={label}
						onMouseDown={(event) => event.preventDefault()}
					>
						<Icon aria-hidden="true" />
					</ToggleGroupItem>
				))}
			</ToggleGroup>
		</>
	);
};
