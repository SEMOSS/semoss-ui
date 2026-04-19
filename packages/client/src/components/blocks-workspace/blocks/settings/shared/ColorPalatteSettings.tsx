// biome-ignore-all lint/correctness/useExhaustiveDependencies: TODO
import { ArrowLeft, Check, PaintBucket, Pencil, Trash2, X } from "lucide-react";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	type Block,
	type BlockDef,
	type EchartVisualizationBlockDef,
	getValueByPath,
	type Paths,
	type PathValue,
} from "@semoss/renderer";
import { Button, Input, Muted } from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks";

interface ColorPalatteSettingProps<D extends BlockDef = BlockDef> {
	/**
	 * Id of the block that is being worked with
	 */
	id: string;
	/**
	 * Path to update
	 */
	path: Paths<Block<D>["data"], 4>;
	onColorPalatteSelected: (option, color) => void;
}

/**
 * A component that renders a color palette with a label.
 */
const ColorPalette = ({
	colors,
	label,
	isCustom,
	onClick,
	onPaletteEditClick,
}) => {
	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: visual item
		// biome-ignore lint/a11y/useKeyWithClickEvents: visual item
		<div
			className="m-[5px] inline-block h-[60px] w-[120px] cursor-pointer rounded-[10px] border border-[#ddd] bg-white text-center shadow"
			onClick={() => onClick(label, colors)}
		>
			{/* Color palette row */}
			<div className="flex overflow-hidden rounded-tl-[10px] rounded-tr-[10px]">
				{colors.map((color, index) => (
					<div
						// biome-ignore lint/suspicious/noArrayIndexKey: TODO
						key={index}
						className="h-[27px] flex-1"
						style={{ backgroundColor: color }}
					/>
				))}
			</div>
			{/* Label below the palette */}
			<div className="font-normal text-sm">
				{label}{" "}
				{isCustom && (
					<button
						type="button"
						className="cursor-pointer border-none bg-transparent p-0"
						onClick={() => onPaletteEditClick(label, colors)}
					>
						<Pencil className="size-4" />
					</button>
				)}
			</div>
		</div>
	);
};

export const ColorPalatteSettings = observer(
	({ id, path, onColorPalatteSelected }: ColorPalatteSettingProps) => {
		const { data: Data } =
			useBlockSettings<EchartVisualizationBlockDef>(id);
		const palettes = [
			{
				label: "Option 1",
				palatteLabel: "Option 1",
				isCustom: false,
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
			},
			{
				label: "Option 2",
				palatteLabel: "Option 2",
				isCustom: false,
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
			},
			{
				label: "Option 3",
				palatteLabel: "Option 3",
				isCustom: false,
				colors: [
					"#000000",
					"#444444",
					"#888888",
					"#BBBBBB",
					"#DDDDDD",
					"#FFFFFF",
				],
			},
			{
				label: "Option 4",
				palatteLabel: "Option 4",
				isCustom: false,
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
				index: 1,
			},
			{
				label: "Option 5",
				palatteLabel: "Option 5",
				isCustom: false,
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
			},
			{
				label: "Option 6",
				palatteLabel: "Option 6",
				isCustom: false,
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
			},
			{
				label: "Option 7",
				palatteLabel: "Option 7",
				isCustom: false,
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
			},
			{
				label: "Option 8",
				palatteLabel: "Option 8",
				isCustom: false,
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
			},
			{
				label: "Option 9",
				palatteLabel: "Option 9",
				isCustom: false,
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
			},
		];
		const [colors, setColors] = useState([]);
		const [_showCustomPopover, setShowCustomPopover] =
			useState<HTMLButtonElement | null>(null);
		const [color, setColor] = useState("#000000");
		const [editColor, setEditColor] = useState("");
		// biome-ignore lint/suspicious/noExplicitAny: TODO
		const { data, setData } = useBlockSettings<any>(id);
		const [_value, setValue] = useState(data.option);
		const [optionValue, setOptionValue] = useState(data.option);
		const [colorPalatteFlag, setColorPalatteFlag] = useState(false);
		const [editColorPalatte, setEditColorPalatte] = useState(-1);
		const [editIndex, setEditIndex] = useState(-1);
		const [paletteEditIndex, setPaletteEditIndex] = useState(-1);
		const [paletteName, setPaletteName] = useState("");
		const pathVal = path;
		const optionPathVal = "option";
		const [colorPalette, setColorPalette] = useState(palettes);
		const [toggleAddEdit, setToggleAddEdit] = useState<"" | "add" | "edit">(
			"",
		);
		const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
		const computedValue = useMemo(() => {
			return computed(() => {
				if (!data) {
					return "";
				}
				const v = getValueByPath(data, pathVal);
				if (typeof v === "undefined") {
					return "";
				} else if (typeof v === "string") {
					return v;
				}
				return JSON.stringify(v, null, 2);
			});
		}, [data, pathVal]).get();
		const optionComputedValue = useMemo(() => {
			return computed(() => {
				if (!data) {
					return "";
				}
				const v = getValueByPath(data, optionPathVal);
				if (typeof v === "undefined") {
					return "";
				} else if (typeof v === "string") {
					return v;
				}
				return JSON.stringify(v, null, 2);
			});
		}, [data, optionPathVal]).get();
		useEffect(() => {
			setValue(computedValue);
		}, [computedValue]);
		useEffect(() => {
			setOptionValue(optionComputedValue);
		}, [optionComputedValue]);
		useEffect(() => {
			const option =
				typeof optionComputedValue === "string"
					? JSON.parse(optionComputedValue)
					: optionComputedValue;
			if (
				Object.hasOwn(option, "customSettings") &&
				Object.hasOwn(option.customSettings, "customColorPalette")
			) {
				const paletteColors = colorPalette.filter(
					(item) => item.isCustom === false,
				);
				const colorPaletteData = [
					...paletteColors,
					...option.customSettings.customColorPalette,
				];
				setColorPalette(() => {
					return [...colorPaletteData];
				});
			}
		}, [id]);

		function handleClick() {
			setToggleAddEdit("add");
			setColors([]);
		}
		function handleClose() {
			setColorPalatteFlag(false);
			setShowCustomPopover(null);
			setToggleAddEdit("");
		}
		function handleDelete() {
			const option =
				typeof optionValue === "string"
					? JSON.parse(optionValue)
					: optionValue;
			colorPalette.splice(paletteEditIndex, 1);
			const customColorPalette = option.customSettings.customColorPalette;
			const index = customColorPalette.findIndex(
				(item) => item.index === paletteEditIndex + 1,
			);
			customColorPalette.splice(index, 1);
			let paletteIndex = paletteEditIndex;
			for (let i = index; i < customColorPalette.length; i++) {
				if (customColorPalette[i].index !== undefined) {
					customColorPalette[i].index = paletteIndex + 1;
					paletteIndex++;
				}
			}
			setData(
				optionPathVal,
				// biome-ignore lint/suspicious/noExplicitAny: TODO
				option as PathValue<any, typeof optionPathVal>,
			);
			setColorPalette(colorPalette);
			setColorPalatteFlag(false);
			setShowCustomPopover(null);
			setToggleAddEdit("");
		}
		function handleEdit(index) {
			setEditIndex(index);
			setColorPalatteFlag(false);
		}
		function handleColorPicker() {
			setColorPalatteFlag(!colorPalatteFlag);
		}
		function handleColorChange(label) {
			setPaletteName(label);
			const colors =
				label === "" || label === undefined
					? colorPalette[0]
					: colorPalette.find((item) => item.label === label);
			if (
				Data.variation === "echart-scatter-plots" ||
				Data.variation === "echart-stack-chart"
			) {
				runStateUpdate(
					optionComputedValue,
					optionPathVal,
					colors.colors,
				);
			} else {
				runStateUpdateCustom(colors.colors, pathVal);
			}
			onColorPalatteSelected(optionComputedValue, colors.colors);
		}
		function handlePaletteEditButtonClick(id, label, colors, index) {
			setPaletteEditIndex(index);
			setPaletteName(label);
			setToggleAddEdit("edit");
			setEditColorPalatte(id);
			setColors(colors);
		}
		function addColorRow(color) {
			if (!colors.includes(color)) {
				setColors([...colors, color]);
			}
		}
		function editColorRow(color, index) {
			colors.splice(index, 1, color);
		}
		function duplicateExists() {
			return availableLabels.includes(paletteName);
		}
		function handleAddPalette() {
			if (
				paletteName === "" ||
				colors.length === 0 ||
				duplicateExists()
			) {
				return;
			}
			setColorPalette((prev) => [
				...prev,
				{
					label: paletteName,
					colors: colors,
					palatteLabel: paletteName,
					isCustom: true,
				},
			]);
			let option =
				typeof optionValue === "string"
					? JSON.parse(optionValue)
					: optionValue;
			if (Object.hasOwn(option, "customSettings")) {
				option = {
					...option,
					customSettings: {
						...option.customSettings,
					},
				};
			} else {
				option = {
					...option,
					customSettings: {},
				};
			}
			if (Object.hasOwn(option.customSettings, "customColorPalette")) {
				option = {
					...option,
					customSettings: {
						customColorPalette: [
							...option.customSettings.customColorPalette,
							{
								label: paletteName,
								colors: colors,
								palatteLabel: paletteName,
								isCustom: true,
								index: colorPalette.length + 1,
							},
						],
					},
				};
			} else {
				option = {
					...option,
					customSettings: {
						customColorPalette: [
							{
								label: paletteName,
								colors: colors,
								palatteLabel: paletteName,
								isCustom: true,
								index: colorPalette.length + 1,
							},
						],
					},
				};
			}
			setData(
				optionPathVal,
				// biome-ignore lint/suspicious/noExplicitAny: TODO
				option as PathValue<any, typeof optionPathVal>,
			);
			setColors([]);
			setPaletteName("");
			handleClose();
			setToggleAddEdit("");
		}
		function handleEditPalette() {
			if (paletteEditIndex >= 0) {
				colorPalette.splice(paletteEditIndex, 1, {
					label: paletteName,
					colors: colors,
					palatteLabel: paletteName,
					isCustom: true,
					index: paletteEditIndex,
				});
				let option =
					typeof optionValue === "string"
						? JSON.parse(optionValue)
						: optionValue;
				if (Object.hasOwn(option, "customSettings")) {
					option = {
						...option,
						customSettings: {
							...option.customSettings,
						},
					};
					if (
						Object.hasOwn(
							option.customSettings,
							"customColorPalette",
						)
					) {
						const customColorPalette =
							option.customSettings.customColorPalette;
						const index = customColorPalette.find(
							(item) => item.index === paletteEditIndex + 1,
						);
						if (index) {
							customColorPalette.splice(index, 1, {
								label: paletteName,
								colors: colors,
								palatteLabel: paletteName,
								isCustom: true,
								index: paletteEditIndex + 1,
							});
						}
					} else {
						option = {
							...option,
							customSettings: {
								customColorPalette: [
									{
										label: paletteName,
										colors: colors,
										palatteLabel: paletteName,
										isCustom: true,
										index: paletteEditIndex,
									},
								],
							},
						};
					}
				}
				setData(
					optionPathVal,
					// biome-ignore lint/suspicious/noExplicitAny: TODO
					option as PathValue<any, typeof optionPathVal>,
				);
			}
			setColors([]);
			setPaletteName("");
			handleClose();
			setToggleAddEdit("");
		}
		function runStateUpdateCustom(option, path = "option") {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
			}
			timeoutRef.current = setTimeout(() => {
				try {
					// biome-ignore lint/suspicious/noExplicitAny: TODO
					setData(path, option as PathValue<any, typeof path>);
				} catch (e) {
					console.log(e);
				}
			}, 300);
		}
		function runStateUpdate(option, path, colors) {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
			}
			const options = JSON.parse(option);
			options.color = colors;

			timeoutRef.current = setTimeout(() => {
				try {
					// biome-ignore lint/suspicious/noExplicitAny: TODO
					setData(path, options as PathValue<any, typeof path>);
				} catch (e) {
					console.log(e);
				}
			}, 300);
		}
		const availableLabels = useMemo(() => {
			return colorPalette.map((item) => item.label);
		}, [colorPalette]);

		const popOverContent = (
			<>
				{/* header */}
				<div className="flex w-fit items-center">
					<div className="flex w-fit flex-col">
						<div className="mb-2 flex items-center justify-between">
							<button
								type="button"
								className="rounded p-1 font-bold text-black/50 text-xs hover:bg-accent"
								onClick={() => {
									setToggleAddEdit("");
									setShowCustomPopover(null);
									handleClose();
								}}
							>
								<ArrowLeft className="size-4" />
							</button>
							<span className="text-base">
								&nbsp;
								{toggleAddEdit === "add" ? "Create" : "Edit"} a
								Custom Color Palette
							</span>
						</div>
					</div>
				</div>
				{/* Name section */}
				<div className="mb-2 flex flex-col gap-2 px-4 py-2">
					<Muted>Name</Muted>
					<Input
						defaultValue={
							toggleAddEdit === "edit" ? paletteName : ""
						}
						onChange={(e) => {
							setPaletteName(e.target.value);
						}}
						placeholder="Enter Palette Name"
					/>
				</div>
				{/* Colors section */}
				<div className="mb-2 flex flex-col gap-2 px-4 py-2">
					<Muted>Colors</Muted>
					<div className="flex items-center gap-2">
						<Input
							placeholder="Enter Hex code or Pick Color"
							aria-label="Select Colour"
							type="text"
						/>
						<button
							type="button"
							aria-label="select colour"
							onClick={handleColorPicker}
							className="rounded p-1 hover:bg-accent"
						>
							<PaintBucket className="block h-[33px] w-[33px] rounded-[20%]" />
						</button>
					</div>
				</div>
				{/* show color palette when color palate button is pressed */}
				{colorPalatteFlag && (
					<div className="mx-5 inline-block rounded-[10px] border border-[#ddd] pr-[10px] shadow">
						<Input
							className="h-8 w-full p-0.5"
							type="color"
							value={color}
							onChange={(newColor) => {
								setColor(newColor.target.value);
							}}
							data-testid={`color-palette-settings-${editColorPalatte}`}
						/>
						<hr />
						<div className="flex justify-end px-4 py-2">
							<button
								type="button"
								className="mr-[5px] cursor-pointer border-none bg-transparent text-[#666] text-sm"
								onClick={() => {
									setColorPalatteFlag(false);
								}}
							>
								<X />
							</button>
							<button
								type="button"
								className="cursor-pointer rounded-lg border-none text-[20px]"
								onClick={() => {
									addColorRow(color);
								}}
							>
								<Check />
							</button>
						</div>
					</div>
				)}
				{/* selected Colors section */}
				<div>
					{(
						colors ||
						colorPalette[editColorPalatte]?.colors ||
						[]
					).map((color, index) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: TODO
						<div key={index}>
							<div className="mx-5 mb-2 flex items-center justify-start rounded p-2">
								<div
									className="h-[33px] w-[33px] rounded-[20%]"
									style={{ backgroundColor: color }}
								/>
								<span className="ml-5">{color}</span>
								<button
									type="button"
									aria-label="select colour"
									className="mr-0 ml-auto rounded p-1 hover:bg-accent"
									onClick={() => {
										handleEdit(index);
										setEditColor(color);
									}}
								>
									<Pencil className="block h-[33px] w-[33px] rounded-[20%]" />
								</button>
								<button
									type="button"
									aria-label="select colour"
									className="rounded p-1 hover:bg-accent"
									onClick={() => {
										setColors(
											colors.filter(
												(item) => item !== color,
											),
										);
									}}
								>
									<Trash2 className="block h-[33px] w-[33px] rounded-[20%]" />
								</button>
							</div>
							{index === editIndex && (
								<div className="mx-5 inline-block rounded-[10px] border border-[#ddd] pr-[10px] shadow">
									<Input
										className="h-8 w-full p-0.5"
										type="color"
										value={editColor}
										onChange={(newColor) => {
											setColor(newColor.target.value);
										}}
									/>
									<hr />
									<div
										className="flex justify-end px-4 py-2"
										style={{
											marginTop: "5px",
											marginBottom: "10px",
										}}
									>
										<button
											type="button"
											className="mr-[5px] cursor-pointer border-none bg-transparent text-[#666] text-sm"
											onClick={() => {
												setColorPalatteFlag(false);
												setEditIndex(-1);
											}}
										>
											<X />
										</button>
										<button
											type="button"
											className="cursor-pointer rounded-lg border-none text-[20px]"
											onClick={() => {
												editColorRow(editColor, index);
												setEditIndex(-1);
											}}
										>
											<Check />
										</button>
									</div>
								</div>
							)}
						</div>
					))}
				</div>
				<div className="flex justify-end px-4 py-2">
					{toggleAddEdit === "edit" && (
						<>
							<button
								type="button"
								className="mr-[5px] cursor-pointer border-none bg-transparent text-[#666] text-sm"
								onClick={handleDelete}
							>
								Delete
							</button>
							<Button size="sm" onClick={handleEditPalette}>
								Save
							</Button>
						</>
					)}
					{toggleAddEdit !== "edit" && (
						<>
							<button
								type="button"
								className="mr-[5px] cursor-pointer border-none bg-transparent text-[#666] text-sm"
								onClick={handleClose}
							>
								Close
							</button>
							<Button size="sm" onClick={handleAddPalette}>
								Add
							</Button>
						</>
					)}
				</div>
			</>
		);

		return (
			<div>
				{toggleAddEdit !== "" && <div>{popOverContent}</div>}
				{toggleAddEdit === "" && (
					<div className="flex justify-center p-4">
						<Button
							onClick={handleClick}
							variant="outline"
							size="sm"
						>
							+ Add Custom Color Palette
						</Button>
					</div>
				)}
				<hr />
				<div className="flex flex-wrap justify-center">
					{colorPalette.map((palette, index) => (
						<ColorPalette
							key={palette.label}
							onClick={handleColorChange}
							onPaletteEditClick={() =>
								handlePaletteEditButtonClick(
									index,
									palette.label,
									palette.colors,
									index,
								)
							}
							colors={palette.colors}
							isCustom={palette.isCustom}
							label={palette.label}
						/>
					))}
				</div>
			</div>
		);
	},
);
