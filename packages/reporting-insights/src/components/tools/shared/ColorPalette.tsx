import {
	DragDropContext,
	Draggable,
	Droppable,
	type DropResult,
} from "@hello-pangea/dnd";
import {
	ArrowLeft,
	Check,
	GripVertical,
	Pencil,
	Trash2,
	X,
} from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui";
import type { ColorPalette as ColorPaletteType } from "@/types/dashboard";
import { ResetButton } from "./ResetButton";

/** A combined styling patch — the selected palette and/or the custom-palette list. */
export interface ColorPalettePatch {
	colorPalette?: ColorPaletteType;
	customColorPalettes?: ColorPaletteType[];
}

interface ColorPaletteProps {
	value?: ColorPaletteType;
	customPalettes?: ColorPaletteType[];
	/**
	 * A SINGLE combined update so the selected palette and the custom list are
	 * written together. Adding/deleting a custom palette must change both fields
	 * in one patch — emitting two separate updates lets the parent's stale
	 * `styling` snapshot clobber one of them, which is why a newly-added palette
	 * would vanish from the list. `colorPalette: undefined` clears the selection.
	 */
	onChange: (patch: ColorPalettePatch) => void;
}

const DEFAULT_PALETTES: ColorPaletteType[] = [
	{
		label: "Default",
		colors: [
			"#007AFF",
			"#FFEDE9",
			"#FFE9E2",
			"#FF00FF",
			"#A0D8FF",
			"#082B12",
			"#A0FF5E",
			"#22AFFF",
		],
		isCustom: false,
	},
	{
		label: "Vibrant",
		colors: [
			"#FF5733",
			"#33FF57",
			"#5733FF",
			"#FF33A8",
			"#33FFA8",
			"#A833FF",
			"#FFA833",
			"#33A8FF",
		],
		isCustom: false,
	},
	{
		label: "Grayscale",
		colors: [
			"#000000",
			"#444444",
			"#888888",
			"#BBBBBB",
			"#DDDDDD",
			"#FFFFFF",
		],
		isCustom: false,
	},
	{
		label: "Primary",
		colors: [
			"#FF0000",
			"#00FF00",
			"#0000FF",
			"#FFFF00",
			"#FF00FF",
			"#00FFFF",
			"#C0C0C0",
			"#808080",
		],
		isCustom: false,
	},
	{
		label: "Material",
		colors: [
			"#D32F2F",
			"#FBC02D",
			"#388E3C",
			"#1976D2",
			"#7B1FA2",
			"#F57C00",
			"#303F9F",
			"#0288D1",
		],
		isCustom: false,
	},
	{
		label: "Bold",
		colors: [
			"#1E88E5",
			"#D81B60",
			"#43A047",
			"#FB8C00",
			"#8E24AA",
			"#E53935",
			"#00ACC1",
			"#546E7A",
		],
		isCustom: false,
	},
	{
		label: "Muted",
		colors: [
			"#FF6F61",
			"#6B4226",
			"#5F4B8B",
			"#88B04B",
			"#F7CAC9",
			"#92A8D1",
			"#955251",
			"#B565A7",
		],
		isCustom: false,
	},
	{
		label: "Ocean",
		colors: [
			"#E63946",
			"#F1FAEE",
			"#A8DADC",
			"#457B9D",
			"#1D3557",
			"#F4A261",
			"#2A9D8F",
			"#264653",
		],
		isCustom: false,
	},
	{
		label: "Warm",
		colors: [
			"#F94144",
			"#F3722C",
			"#F8961E",
			"#F9C74F",
			"#90BE6D",
			"#43AA8B",
			"#577590",
			"#4D908E",
		],
		isCustom: false,
	},
];

/**
 * Individual color palette display component
 */
function PaletteCard({
	palette,
	isSelected,
	onSelect,
	onEdit,
}: {
	palette: ColorPaletteType;
	isSelected: boolean;
	onSelect: () => void;
	onEdit?: () => void;
}) {
	return (
		<div
			className={`m-1.5 inline-block h-16 w-32 cursor-pointer rounded-lg border-2 bg-white text-center shadow-sm transition-all hover:shadow-md ${
				isSelected
					? "border-indigo-500 ring-2 ring-indigo-200"
					: "border-stone-200"
			}`}
			onClick={onSelect}
		>
			{/* Color swatches */}
			<div className="flex overflow-hidden rounded-t-lg">
				{palette.colors.slice(0, 8).map((color, index) => (
					<div
						key={index}
						className="h-7 flex-1"
						style={{ backgroundColor: color }}
					/>
				))}
			</div>
			{/* Label */}
			<div className="flex items-center justify-center gap-1 px-2 py-1.5 font-medium text-xs">
				<span className="truncate">{palette.label}</span>
				{palette.isCustom && onEdit && (
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							onEdit();
						}}
						className="flex-shrink-0 rounded p-0.5 hover:bg-stone-100"
					>
						<Pencil className="h-3 w-3 text-stone-500" />
					</button>
				)}
			</div>
		</div>
	);
}

function parseBulkHex(
	raw: string,
	existing: string[],
): { valid: string[]; skipped: number } {
	// Tokenize on commas that are outside parentheses so rgb(r,g,b) stays as one token
	const tokens: string[] = [];
	let depth = 0;
	let current = "";
	for (const ch of raw) {
		if (ch === "(") {
			depth++;
			current += ch;
		} else if (ch === ")") {
			depth--;
			current += ch;
		} else if (ch === "," && depth === 0) {
			const t = current.trim();
			if (t) tokens.push(t);
			current = "";
		} else {
			current += ch;
		}
	}
	const t = current.trim();
	if (t) tokens.push(t);

	const seen = new Set(existing.map((c) => c.toLowerCase()));
	const valid: string[] = [];
	let skipped = 0;

	for (const token of tokens) {
		let hex: string | null = null;

		const hexCandidate = token.startsWith("#") ? token : `#${token}`;
		if (/^#[0-9A-Fa-f]{6}$/.test(hexCandidate)) {
			hex = hexCandidate;
		} else {
			const m = token.match(
				/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i,
			);
			if (m) {
				const [r, g, b] = [+m[1], +m[2], +m[3]];
				if (r <= 255 && g <= 255 && b <= 255) {
					hex =
						"#" +
						[r, g, b]
							.map((v) => v.toString(16).padStart(2, "0"))
							.join("");
				}
			}
		}

		if (hex) {
			const lower = hex.toLowerCase();
			if (!seen.has(lower)) {
				valid.push(hex);
				seen.add(lower);
			}
		} else {
			skipped++;
		}
	}

	return { valid, skipped };
}

export function ColorPalette({
	value,
	customPalettes = [],
	onChange,
}: ColorPaletteProps) {
	const [mode, setMode] = useState<"" | "add" | "edit">("");
	const [editingPalette, setEditingPalette] =
		useState<ColorPaletteType | null>(null);
	const [paletteName, setPaletteName] = useState("");
	const [colors, setColors] = useState<string[]>([]);
	const [currentColor, setCurrentColor] = useState("#000000");
	const [editingColorIndex, setEditingColorIndex] = useState(-1);
	const [bulkInput, setBulkInput] = useState("");
	const [bulkStep, setBulkStep] = useState<"" | "input" | "confirm">("");
	const [pendingColors, setPendingColors] = useState<string[]>([]);

	const allPalettes = [...DEFAULT_PALETTES, ...customPalettes];
	const selectedLabel = value?.label || DEFAULT_PALETTES[0].label;

	const handleAddClick = () => {
		setMode("add");
		setPaletteName("");
		setColors([]);
		setEditingPalette(null);
	};

	const handleEditClick = (palette: ColorPaletteType) => {
		setMode("edit");
		setPaletteName(palette.label);
		setColors([...palette.colors]);
		setEditingPalette(palette);
	};

	const handleClose = () => {
		setMode("");
		setPaletteName("");
		setColors([]);
		setEditingPalette(null);
		setEditingColorIndex(-1);
		setBulkInput("");
		setBulkStep("");
		setPendingColors([]);
	};

	const handleSave = () => {
		if (!paletteName.trim() || colors.length === 0) return;

		const existingNames = allPalettes
			.filter((p) => p !== editingPalette)
			.map((p) => p.label);
		if (existingNames.includes(paletteName.trim())) {
			alert("A palette with this name already exists");
			return;
		}

		// Edit keeps its index; add takes max(existing)+1 so indices stay unique even
		// after deletions (length-based ids could collide and break edit/delete).
		const nextIndex =
			customPalettes.reduce(
				(max, p) => Math.max(max, p.index ?? -1),
				-1,
			) + 1;
		const newPalette: ColorPaletteType = {
			label: paletteName.trim(),
			colors: [...colors],
			isCustom: true,
			index:
				mode === "edit" && editingPalette?.index !== undefined
					? editingPalette.index
					: nextIndex,
		};

		// Persist the custom list AND the new selection in one patch — see the
		// `onChange` doc for why these must not be two separate updates.
		if (mode === "add") {
			onChange({
				customColorPalettes: [...customPalettes, newPalette],
				colorPalette: newPalette,
			});
		} else if (mode === "edit" && editingPalette) {
			const updated = customPalettes.map((p) =>
				p.index === editingPalette.index ? newPalette : p,
			);
			onChange({
				customColorPalettes: updated,
				colorPalette: newPalette,
			});
		}
		handleClose();
	};

	const handleDelete = () => {
		if (editingPalette && editingPalette.index !== undefined) {
			const updated = customPalettes.filter(
				(p) => p.index !== editingPalette.index,
			);
			// Only clear the selection if the palette being deleted is the selected one.
			const wasSelected = value?.label === editingPalette.label;
			onChange({
				customColorPalettes: updated,
				...(wasSelected ? { colorPalette: undefined } : {}),
			});
			handleClose();
		}
	};

	const editColor = (index: number) => {
		setEditingColorIndex(index);
		setCurrentColor(colors[index]);
	};

	const saveEditedColor = (index: number) => {
		const updated = [...colors];
		updated[index] = currentColor;
		setColors(updated);
		setEditingColorIndex(-1);
	};

	const deleteColor = (index: number) => {
		setColors(colors.filter((_, i) => i !== index));
	};

	const handleColorDragEnd = (result: DropResult) => {
		if (!result.destination) return;
		const reordered = [...colors];
		const [moved] = reordered.splice(result.source.index, 1);
		reordered.splice(result.destination.index, 0, moved);
		setColors(reordered);
	};

	// Editor UI
	if (mode) {
		const liveParsed =
			bulkStep === "input"
				? parseBulkHex(bulkInput, colors)
				: { valid: [], skipped: 0 };
		const confirmSkipped =
			bulkStep === "confirm"
				? parseBulkHex(bulkInput, colors).skipped
				: 0;

		return (
			<div className="space-y-4">
				{/* Header */}
				<div className="flex items-center gap-2 border-b pb-3">
					<button
						type="button"
						onClick={handleClose}
						className="rounded p-1 transition-colors hover:bg-stone-100"
					>
						<ArrowLeft className="h-4 w-4" />
					</button>
					<span className="font-semibold text-sm">
						{mode === "add" ? "Create" : "Edit"} Custom Color
						Palette
					</span>
				</div>

				{/* Name input */}
				<div>
					<label className="mb-1.5 block font-semibold text-stone-600 text-xs">
						Name
					</label>
					<Input
						type="text"
						value={paletteName}
						onChange={(e) => setPaletteName(e.target.value)}
						placeholder="Enter palette name"
						className="w-full rounded border border-stone-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
					/>
				</div>

				{/* View A - Color view + add button section */}
				{bulkStep === "" && (
					<div>
						<div className="mb-1.5 flex items-center justify-between">
							<label className="block font-semibold text-stone-600 text-xs">
								Colors
							</label>
							<button
								type="button"
								onClick={() => setBulkStep("input")}
								className="font-medium text-indigo-600 text-xs hover:underline"
							>
								+ Add
							</button>
						</div>
					</div>
				)}

				{/* View B — bulk textarea input */}
				{bulkStep === "input" && (
					<div className="space-y-2">
						<label className="block font-semibold text-stone-600 text-xs">
							Add Multiple Colors
						</label>
						<textarea
							value={bulkInput}
							onChange={(e) => setBulkInput(e.target.value)}
							placeholder="#FF0000, rgb(0,255,0), 3B82F6 — hex or rgb(), comma-separated"
							rows={3}
							className="w-full resize-none rounded border border-stone-200 px-3 py-2 font-mono text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
						/>
						{bulkInput.trim() && (
							<div className="flex min-h-5 flex-wrap gap-1">
								{liveParsed.valid.map((c, i) => (
									<div
										key={i}
										className="h-5 w-5 flex-shrink-0 rounded border border-stone-200"
										style={{ backgroundColor: c }}
										title={c}
									/>
								))}
								{liveParsed.skipped > 0 && (
									<div
										className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border border-stone-300 bg-stone-200 font-bold text-stone-500"
										style={{ fontSize: 10 }}
									>
										?
									</div>
								)}
							</div>
						)}
						<div className="flex justify-between pt-1">
							<button
								type="button"
								onClick={() => {
									setBulkStep("");
									setBulkInput("");
								}}
								className="rounded px-3 py-1.5 font-medium text-stone-600 text-xs transition-colors hover:bg-stone-100"
							>
								Cancel
							</button>
							<button
								type="button"
								disabled={liveParsed.valid.length === 0}
								onClick={() => {
									const { valid } = parseBulkHex(
										bulkInput,
										colors,
									);
									setPendingColors(valid);
									setBulkStep("confirm");
								}}
								className="rounded bg-indigo-600 px-3 py-1.5 font-medium text-white text-xs transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
							>
								Next →
							</button>
						</div>
					</div>
				)}

				{/* View C — confirm pending colors before committing */}
				{bulkStep === "confirm" && (
					<div className="space-y-3">
						{colors.length > 0 && (
							<div>
								<p className="mb-1 font-medium text-stone-500 text-xs">
									Already in palette ({colors.length})
								</p>
								<div className="flex flex-wrap gap-1">
									{colors.map((c, i) => (
										<div
											key={i}
											className="h-5 w-5 flex-shrink-0 rounded border border-stone-200"
											style={{ backgroundColor: c }}
											title={c}
										/>
									))}
								</div>
							</div>
						)}
						<div>
							<p className="mb-1 font-medium text-stone-500 text-xs">
								Adding {pendingColors.length} color
								{pendingColors.length !== 1 ? "s" : ""}
							</p>
							<div className="flex flex-wrap gap-1">
								{pendingColors.map((c, i) => (
									<div
										key={i}
										className="flex items-center gap-0.5 rounded border border-stone-200 bg-white px-1 py-0.5"
									>
										<div
											className="h-4 w-4 flex-shrink-0 rounded"
											style={{ backgroundColor: c }}
											title={c}
										/>
										<button
											type="button"
											onClick={() =>
												setPendingColors((prev) =>
													prev.filter(
														(_, j) => j !== i,
													),
												)
											}
											className="text-stone-400 leading-none hover:text-stone-600"
										>
											<X className="h-3 w-3" />
										</button>
									</div>
								))}
							</div>
						</div>
						{confirmSkipped > 0 && (
							<p className="text-stone-400 text-xs">
								{confirmSkipped} invalid value
								{confirmSkipped !== 1 ? "s" : ""} skipped
							</p>
						)}
						<div className="flex justify-between pt-1">
							<button
								type="button"
								onClick={() => setBulkStep("input")}
								className="rounded px-3 py-1.5 font-medium text-stone-600 text-xs transition-colors hover:bg-stone-100"
							>
								← Back
							</button>
							<button
								type="button"
								disabled={pendingColors.length === 0}
								onClick={() => {
									setColors((prev) => [
										...prev,
										...pendingColors,
									]);
									setBulkStep("");
									setBulkInput("");
									setPendingColors([]);
								}}
								className="rounded bg-indigo-600 px-3 py-1.5 font-medium text-white text-xs transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
							>
								Add {pendingColors.length} Color
								{pendingColors.length !== 1 ? "s" : ""}
							</button>
						</div>
					</div>
				)}

				{/* Color list — draggable to reorder; hidden during confirm view */}
				{bulkStep !== "confirm" && (
					<DragDropContext onDragEnd={handleColorDragEnd}>
						<Droppable droppableId="palette-colors">
							{(provided) => (
								<div
									ref={provided.innerRef}
									{...provided.droppableProps}
									className="space-y-2"
								>
									{colors.map((color, index) => (
										<Draggable
											key={`${color}-${index}`}
											draggableId={`palette-color-${index}`}
											index={index}
										>
											{(provided, snapshot) => (
												<div
													ref={provided.innerRef}
													{...provided.draggableProps}
													className={`flex items-center gap-3 rounded border border-stone-200 bg-white p-2 ${snapshot.isDragging ? "shadow-md ring-1 ring-indigo-300" : ""}`}
												>
													<span
														{...provided.dragHandleProps}
														className="flex-shrink-0 cursor-grab text-stone-300 hover:text-stone-500"
														title="Drag to reorder"
													>
														<GripVertical className="h-4 w-4" />
													</span>
													<div
														className="h-8 w-8 flex-shrink-0 rounded"
														style={{
															backgroundColor:
																color,
														}}
													/>
													<span className="flex-1 font-mono text-sm">
														{color}
													</span>
													<button
														type="button"
														onClick={() =>
															editColor(index)
														}
														className="rounded p-1 hover:bg-stone-100"
													>
														<Pencil className="h-4 w-4 text-stone-600" />
													</button>
													<button
														type="button"
														onClick={() =>
															deleteColor(index)
														}
														className="rounded p-1 hover:bg-stone-100"
													>
														<Trash2 className="h-4 w-4 text-stone-600" />
													</button>

													{/* Inline color editor */}
													{editingColorIndex ===
														index && (
														<div className="absolute z-10 mt-12 ml-12 rounded-lg border border-stone-200 bg-white p-3 shadow-lg">
															<Input
																type="color"
																value={
																	currentColor
																}
																onChange={(e) =>
																	setCurrentColor(
																		e.target
																			.value,
																	)
																}
																className="h-32 w-48 cursor-pointer rounded"
															/>
															<div className="mt-3 flex justify-end gap-2">
																<button
																	type="button"
																	onClick={() =>
																		setEditingColorIndex(
																			-1,
																		)
																	}
																	className="p-1 text-stone-400 hover:text-stone-600"
																>
																	<X className="h-4 w-4" />
																</button>
																<button
																	type="button"
																	onClick={() =>
																		saveEditedColor(
																			index,
																		)
																	}
																	className="p-1 text-indigo-600 hover:text-indigo-700"
																>
																	<Check className="h-4 w-4" />
																</button>
															</div>
														</div>
													)}
												</div>
											)}
										</Draggable>
									))}
									{provided.placeholder}
								</div>
							)}
						</Droppable>
					</DragDropContext>
				)}

				{/* Actions */}
				<div className="flex justify-between border-t pt-3">
					{mode === "edit" ? (
						<>
							<button
								type="button"
								onClick={handleDelete}
								className="rounded px-4 py-2 font-semibold text-red-600 text-sm transition-colors hover:bg-red-50"
							>
								Delete
							</button>
							<button
								type="button"
								onClick={handleSave}
								disabled={
									!paletteName.trim() || colors.length === 0
								}
								className="rounded bg-indigo-600 px-4 py-2 font-semibold text-sm text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
							>
								Save
							</button>
						</>
					) : (
						<>
							<button
								type="button"
								onClick={handleClose}
								className="rounded px-4 py-2 font-semibold text-sm text-stone-600 transition-colors hover:bg-stone-100"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={handleSave}
								disabled={
									!paletteName.trim() || colors.length === 0
								}
								className="rounded bg-indigo-600 px-4 py-2 font-semibold text-sm text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
							>
								Add
							</button>
						</>
					)}
				</div>
			</div>
		);
	}

	// Palette grid UI
	return (
		<div className="space-y-4">
			<div className="flex justify-center">
				<button
					type="button"
					onClick={handleAddClick}
					className="rounded bg-indigo-50 px-4 py-2 font-semibold text-indigo-600 text-sm transition-colors hover:bg-indigo-100 hover:text-indigo-700"
				>
					+ Add Custom Color Palette
				</button>
			</div>

			<div className="border-t pt-4">
				<div className="flex flex-wrap justify-center">
					{allPalettes.map((palette) => (
						<PaletteCard
							key={palette.label}
							palette={palette}
							isSelected={palette.label === selectedLabel}
							onSelect={() => onChange({ colorPalette: palette })}
							onEdit={
								palette.isCustom
									? () => handleEditClick(palette)
									: undefined
							}
						/>
					))}
				</div>
			</div>

			<div className="pt-2">
				<ResetButton
					onReset={() => onChange({ colorPalette: undefined })}
				/>
			</div>
		</div>
	);
}
