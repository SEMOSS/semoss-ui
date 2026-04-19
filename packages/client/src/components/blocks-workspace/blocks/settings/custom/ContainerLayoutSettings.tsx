import {
	AlignCenterHorizontal as AlignHorizontalCenter,
	AlignStartHorizontal as AlignHorizontalLeft,
	AlignEndHorizontal as AlignHorizontalRight,
	ArrowDown,
	ArrowRight,
	Rows2 as FormatLineSpacing,
	Space,
	AlignEndVertical as VerticalAlignBottom,
	AlignCenterVertical as VerticalAlignCenter,
	AlignStartVertical as VerticalAlignTop,
} from "lucide-react";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import {
	ActionMessages,
	type Block,
	type BlockDef,
	type BlockJSON,
	getValueByPath,
	useBlocks,
} from "@semoss/renderer";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	ToggleGroup,
	ToggleGroupItem,
} from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks";
import { BaseSettingSection } from "../BaseSettingSection";
import { ButtonGroupSettings, SizeSettings } from "../shared";

const calculateItemWidth = (containerWidth, numItems, gap, unit): string => {
	const totalGapSpace = (numItems - 1) * gap;
	const availableSpace = containerWidth - totalGapSpace;
	const itemWidth = availableSpace / numItems;
	return `${itemWidth + unit}`;
};

interface ContainerLayoutSettingsProps<_D extends BlockDef = BlockDef> {
	/**
	 * Id of the block that is being worked with
	 */
	id: string;
}

export const ContainerLayoutSettings = observer(
	<D extends BlockDef = BlockDef>({
		id,
	}: ContainerLayoutSettingsProps<D>) => {
		const { data, setData } = useBlockSettings(id);
		const { state } = useBlocks();

		const gridDimension = getValueByPath(
			data,
			"dimension",
		) as unknown as string;
		const layoutType = getValueByPath(data, "type") as unknown as string;
		const flexDirection = getValueByPath(
			data,
			"style.flexDirection",
		) as unknown as string;

		// track the gap spacing with unit
		const [gapSpacing, setGapSpacing] = useState<{
			unit: "%" | "px" | "em" | "";
			value: string;
		}>({
			unit: "",
			value: "",
		});

		// track the row spacing with unit
		const [rowSpacing, setRowSpacing] = useState<{
			unit: "%" | "px" | "em" | "";
			value: string;
		}>({
			unit: "",
			value: "",
		});

		//get the row spacing value from the block
		const computedRowValue = useMemo(() => {
			return computed(() => {
				if (!data) {
					return "";
				}

				const v = getValueByPath(data, "rowSpacing");
				if (typeof v === "undefined") {
					return "";
				} else if (typeof v === "string") {
					return v;
				}

				return JSON.stringify(v);
			});
		}, [data]).get();

		//get the gap spacing value from the block
		const computedGapValue = useMemo(() => {
			return computed(() => {
				if (!data) {
					return "";
				}

				const v = getValueByPath(data, "style.gap");
				if (typeof v === "undefined") {
					return "";
				} else if (typeof v === "string") {
					return v;
				}

				return JSON.stringify(v);
			});
		}, [data]).get();

		//set the value of the row spacing input
		useEffect(() => {
			const r: typeof rowSpacing = {
				unit: "",
				value: "",
			};

			// get the unit
			if (computedRowValue.includes("%")) {
				r.unit = "%";
			} else if (computedRowValue.includes("px")) {
				r.unit = "px";
			} else if (computedRowValue.includes("em")) {
				r.unit = "em";
			}

			//remove the units from the computed value
			const amount = JSON.stringify(computedRowValue).replace(
				/[^0-9]/g,
				"",
			);

			if (r.unit) {
				r.value = amount;
			} else {
				r.value = computedRowValue;
			}

			setRowSpacing(r);
		}, [computedRowValue]);

		//set the value of the gap spacing input
		useEffect(() => {
			const r: typeof gapSpacing = {
				unit: "",
				value: "",
			};

			// get the unit
			if (computedGapValue.includes("%")) {
				r.unit = "%";
			} else if (computedGapValue.includes("px")) {
				r.unit = "px";
			} else if (computedGapValue.includes("em")) {
				r.unit = "em";
			}

			//remove the units from the computed value
			const amount = JSON.stringify(computedGapValue).replace(
				/[^0-9]/g,
				"",
			);

			if (r.unit) {
				r.value = amount;
			} else {
				r.value = computedGapValue;
			}

			setGapSpacing(r);
		}, [computedGapValue]);

		/**
		 * Sync the data on change
		 */
		const changeRowSpacing = (
			amount: string,
			unit: "%" | "px" | "em" | "",
		) => {
			setRowSpacing({
				value: amount,
				unit: unit,
			});

			setData("rowSpacing", amount + unit);

			const b = state.getBlock(id);

			if (b.slots.children.children.length) {
				b.slots.children.children.forEach(async (cId) => {
					state.dispatch({
						message: ActionMessages.SET_BLOCK_DATA,
						payload: {
							id: cId,
							path: "style.marginBottom",
							value: amount + unit,
						},
					});
				});
			}
		};

		const changeGapSpacing = (
			amount: string,
			unit: "%" | "px" | "em" | "",
		) => {
			setGapSpacing({
				value: amount,
				unit: unit,
			});

			setData("style.gap", (amount + unit) as never);

			const b = state.getBlock(id);

			if (b.slots.children.children.length) {
				b.slots.children.children.forEach(async (cId) => {
					state.dispatch({
						message: ActionMessages.SET_BLOCK_DATA,
						payload: {
							id: cId,
							path: "style.gap",
							value: amount + unit,
						},
					});
				});
			}
		};

		const modifyGrid = (val: string, gap?: string) => {
			const b: Block = state.getBlock(id);

			const width = calculateItemWidth(
				100,
				val,
				gap ? gap : gapSpacing.value,
				gapSpacing.unit,
			) as string;

			const elsCount = parseInt(val as string, 10);

			// Modify width of existing blocks in container
			if (b.slots.children.children.length) {
				b.slots.children.children.forEach(async (cId) => {
					state.dispatch({
						message: ActionMessages.SET_BLOCK_DATA,
						payload: {
							id: cId,
							path: "style.width",
							value: `${width}`,
						},
					});
				});

				if (b.slots.children.children.length < elsCount) {
					const leftOver = Array.from({
						length: elsCount - b.slots.children.children.length,
					});

					const position = {
						parent: b.id,
						slot: "children",
						sibling:
							b.slots.children.children[
								b.slots.children.children.length - 1
							],
						type: "after",
					};

					leftOver.forEach(async () => {
						// Add some blocks automatically for user
						const id = await state.dispatch({
							message: ActionMessages.ADD_BLOCK,
							payload: {
								json: {
									widget: "container",
									data: {
										style: {
											display: "flex",
											flexDirection: "column",
											gap: "8px",
											flexWrap: "wrap",
											width: `${width}`,
											border: "1px solid #e0e0e0",
											borderRadius: "12px",
											backgroundColor: "#ffffff",
											height: "120px",
										},
									},
									listeners: {
										preProcess: {
											type: "sync",
											order: [],
										},
									},
									slots: {
										children: [],
									},
								} as BlockJSON,
								position: position,
							},
						});

						position.sibling = id as string;
					});
				}
			} else {
				const l = Array.from({ length: parseInt(val as string, 10) });
				const position = {
					parent: b.id,
					slot: "children",
					sibling: "",
					type: "after",
				};

				l.forEach(async () => {
					// Add some blocks automatically for user
					const id = await state.dispatch({
						message: ActionMessages.ADD_BLOCK,
						payload: {
							json: {
								widget: "container",
								data: {
									style: {
										display: "flex",
										flexDirection: "column",
										gap: "8px",
										flexWrap: "wrap",
										width: `${width}`,
										border: "1px solid #e0e0e0",
										borderRadius: "12px",
										backgroundColor: "#ffffff",
										height: "120px",
									},
								},
								listeners: {
									preProcess: {
										type: "sync",
										order: [],
									},
								},
								slots: {
									children: [],
								},
							} as BlockJSON,
							position: position,
						},
					});

					position.sibling = id as string;
				});
			}
		};

		return (
			<div className="flex flex-col gap-1">
				<BaseSettingSection label="">
					{/* Layout type tab switcher */}
					<div className="flex min-h-[42px] w-full items-center gap-0.5 rounded-md border border-input p-0.5">
						{["custom", "grid"].map((tab) => (
							<button
								key={tab}
								type="button"
								onClick={() => {
									setData("type", tab);
									if (tab === "custom") {
										setData("dimension", null);
										setData(
											"style.flexDirection",
											"column" as never,
										);
										setData("style.gap", "0px" as never);
										const b: Block = state.getBlock(id);
										b.slots.children.children.forEach(
											(c) => {
												state.dispatch({
													message:
														ActionMessages.SET_BLOCK_DATA,
													payload: {
														id: c,
														path: "style.marginBottom",
														value: "0px",
													},
												});
											},
										);
									} else {
										setData(
											"style.flexDirection",
											"row" as never,
										);
										setData("style.gap", "2%" as never);
									}
								}}
								className={`flex-1 rounded-sm py-1 font-medium text-sm transition-colors ${
									layoutType === tab
										? "bg-background shadow-sm"
										: "hover:bg-muted/50"
								}`}
							>
								{tab.charAt(0).toUpperCase() + tab.slice(1)}
							</button>
						))}
					</div>
				</BaseSettingSection>
				{layoutType === "grid" ? (
					<div className="flex flex-col">
						<BaseSettingSection label={"Column Count"}>
							<Select
								value={gridDimension}
								onValueChange={(val) => {
									setData("dimension", val);
									modifyGrid(val);
								}}
							>
								<SelectTrigger className="w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value={"3"}>
										3 columns
									</SelectItem>
									<SelectItem value={"4"}>
										4 columns
									</SelectItem>
									<SelectItem value={"5"}>
										5 columns
									</SelectItem>
									<SelectItem value={"6"}>
										6 columns
									</SelectItem>
								</SelectContent>
							</Select>
						</BaseSettingSection>

						<BaseSettingSection label={"Row Spacing"} wide>
							<InputGroup className="w-full">
								<InputGroupAddon>
									<FormatLineSpacing className="size-4" />
								</InputGroupAddon>
								<InputGroupInput
									value={rowSpacing.value}
									onChange={(e) => {
										changeRowSpacing(
											e.target.value,
											rowSpacing.unit,
										);
									}}
									autoComplete="off"
								/>
							</InputGroup>
							<ToggleGroup
								type="single"
								value={rowSpacing.unit}
								onValueChange={(val) => {
									if (val)
										changeRowSpacing(
											rowSpacing.value,
											val as "%" | "px" | "em" | "",
										);
								}}
							>
								{(["em", "px", "%"] as const).map((unit) => (
									<ToggleGroupItem
										key={unit}
										value={unit}
										variant="outline"
										size="sm"
									>
										{unit}
									</ToggleGroupItem>
								))}
							</ToggleGroup>
						</BaseSettingSection>
						<BaseSettingSection label={"Gap"} wide>
							<InputGroup className="w-full">
								<InputGroupAddon>
									<Space className="size-4" />
								</InputGroupAddon>
								<InputGroupInput
									value={gapSpacing.value}
									onChange={(e) => {
										changeGapSpacing(
											e.target.value,
											gapSpacing.unit,
										);
									}}
									autoComplete="off"
								/>
							</InputGroup>
							<ToggleGroup
								type="single"
								value={gapSpacing.unit}
								onValueChange={(val) => {
									if (val)
										changeGapSpacing(
											gapSpacing.value,
											val as "%" | "px" | "em" | "",
										);
								}}
							>
								{(["em", "px", "%"] as const).map((unit) => (
									<ToggleGroupItem
										key={unit}
										value={unit}
										variant="outline"
										size="sm"
									>
										{unit}
									</ToggleGroupItem>
								))}
							</ToggleGroup>
						</BaseSettingSection>
					</div>
				) : (
					<div className="flex flex-col gap-1">
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
						<ButtonGroupSettings
							id={id}
							path="style.alignItems"
							label={
								flexDirection === "row"
									? "Vertical Align"
									: "Horizontal Align"
							}
							options={[
								{
									value: "start",
									icon:
										flexDirection === "row"
											? VerticalAlignTop
											: AlignHorizontalLeft,
									title: "Top",
									isDefault: true,
								},
								{
									value: "center",
									icon:
										flexDirection === "row"
											? VerticalAlignCenter
											: AlignHorizontalCenter,
									title: "Center",
									isDefault: false,
								},
								{
									value: "end",
									icon:
										flexDirection === "row"
											? VerticalAlignBottom
											: AlignHorizontalRight,
									title: "Bottom",
									isDefault: false,
								},
							]}
						/>
						<ButtonGroupSettings
							id={id}
							path="style.justifyContent"
							label={
								flexDirection === "row"
									? "Horizontal Align"
									: "Vertical Align"
							}
							options={[
								{
									value: "flex-start",
									icon:
										flexDirection === "row"
											? AlignHorizontalLeft
											: VerticalAlignTop,
									title: "Top",
									isDefault: true,
								},
								{
									value: "center",
									icon:
										flexDirection === "row"
											? AlignHorizontalCenter
											: VerticalAlignCenter,
									title: "Center",
									isDefault: false,
								},
								{
									value: "flex-end",
									icon:
										flexDirection === "row"
											? AlignHorizontalRight
											: VerticalAlignBottom,
									title: "Bottom",
									isDefault: false,
								},
							]}
						/>
						<SizeSettings id={id} label="Gap" path="style.gap" />
					</div>
				)}
			</div>
		);
	},
);
