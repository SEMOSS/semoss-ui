/** biome-ignore-all lint/suspicious/noExplicitAny: TODO */
// biome-ignore-all lint/correctness/useExhaustiveDependencies: TODO
import { ChevronDown, X as CloseIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
	type BlockComponent,
	useBlocks,
	useBlocksPixel,
	useFrameHeaders,
} from "@semoss/renderer";
import {
	Button,
	Checkbox,
	Input,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Switch,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	toast,
} from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks/useBlockSettings";
import { SizeSettings } from "../../shared";

const DATA = {
	displayType: ["Checklist", "Dropdown", "Multiselect", "Slider"],
	frame: ["Frame 1", "Frame 2", "Frame 3"],
	colors: [
		"primary",
		"secondary",
		"error",
		"warning",
		"info",
		"success",
		"inherit",
	],
	sizes: ["small", "medium", "large"],
};

export const VisualizationFilterMenu: BlockComponent = ({ id }) => {
	const { data, setData } = useBlockSettings(id);
	const [selectedTab, setSelectedTab] = useState("Data");
	const initialState: Record<string, any> = {
		showPanelTitle: false,
		searchable: false,
		multipleSelection: false,
		displayType: "",
		frame: "",
		column: "",
		filterLabel: "",
		sliderSensitivity: 0,
		listOptions: [],
		selectedValues: [],
		color: "secondary",
		size: "medium",
	};

	const [localState, setLocalState] =
		useState<Record<string, any>>(initialState);
	const getFrames = useBlocksPixel<string[]>("GetFrames();", { data: [] });
	const options = getFrames.status === "SUCCESS" ? getFrames.data : [];
	const [checked, setChecked] = useState<string[]>([]);
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const closeDropdown = () => setDropdownOpen(false);
	const frames = Array.isArray(localState.frame)
		? localState.frame
		: localState.frame
			? [localState.frame]
			: [];
	const frameHeader = useFrameHeaders(frames[0] || "");
	const columnNames = useMemo(() => {
		const allHeaders = frameHeader?.data?.list || [];
		const uniqueAliases = Array.from(
			new Set(allHeaders.map((item) => item.alias)),
		);
		return uniqueAliases;
	}, [frameHeader?.data?.list]);
	useEffect(() => {
		setLocalState({
			showPanelTitle: !!data.showPanelTitle,
			searchable: !!data.searchable,
			multipleSelection: !!data.multipleSelection,
			displayType: data.displayType ?? "",
			frame: data.frame ?? "",
			column: data.column ?? "",
			filterLabel: data.filterLabel ?? "",
			sliderSensitivity: data.sliderSensitivity ?? 0,
			listOptions: data.listOptions ?? [],
			selectedValues: data.selectedValues ?? [],
			color: data.color ?? "",
			size: data.size ?? "",
		});
	}, [data, id]);

	const { state } = useBlocks();
	const updateField = (field: string, value: any) => {
		setLocalState((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	/**
	 * Handles changes to fields in the local state of the component.
	 *
	 * @param field The name of the field that was changed.
	 * @param value The new value of the field.
	 */
	const handleSelectChange = (field: string) => (value: string) => {
		const updatedValue = value ?? "";

		/**
		 * If the field that was changed is the displayType, then
		 * we need to reset some other fields as well.
		 */
		if (field === "displayType") {
			setLocalState((prev) => ({
				...prev,
				displayType: updatedValue,
				filterLabel: "",
				sliderSensitivity: "",
			}));
		} else {
			updateField(field, updatedValue);
		}
	};

	/**
	 * This function is a higher order function that takes a field name
	 * and returns a function that will update the local state with
	 * the new value of that field (for Switch components using onCheckedChange).
	 *
	 * @param field The name of the field to update in the local state.
	 * @returns A function that takes a boolean and updates the local state.
	 */
	const handleSwitchChange = (field: string) => (isChecked: boolean) => {
		setLocalState((prevState) => ({
			...prevState,
			[field]: isChecked,
		}));
	};

	const isApplyDisabled =
		!localState.displayType || !localState.frame || !localState.column;

	/**
	 * Updates the block's data store with the current local state
	 * Fetches list options from the frame for the selected column
	 */
	const handleUpdate = async (): Promise<void> => {
		if (!localState.frame || !localState.column) {
			return;
		}

		try {
			for (let i = 0; i < localState.frame.length; i++) {
				const response = await state.runSideEffect(
					`META | Frame(${localState.frame[i]}) | Select(${localState.column}).as([${localState.column}])|Group(${localState.column})|Sort(${localState.column}) | Offset(0) | Limit(1000) | Collect(1000);`,
				);

				const values = (
					response?.pixelReturn?.[0]?.output as {
						data?: { values?: any[] };
					}
				)?.data?.values;

				// If no values, set empty list (frame might be empty or query might have issues)
				const options = values?.length
					? values.map((item: any) => String(item[0]))
					: [];

				const filterLabel = `Filter of ${localState.column || localState.filterLabel}`;

				setLocalState((prev) => ({
					...prev,
					listOptions: options,
					selectedValues: [],
					filterLabel: filterLabel,
				}));

				// Update all block data fields from local state
				setData("displayType", localState.displayType);
				setData("frame", localState.frame);
				setData("column", localState.column);
				setData("filterLabel", filterLabel);
				setData("sliderSensitivity", localState.sliderSensitivity);
				setData("listOptions", options);
				setData("selectedValues", []);
				setData("showPanelTitle", localState.showPanelTitle);
				setData("searchable", localState.searchable);
				setData("multipleSelection", localState.multipleSelection);
				setData("color", localState.color);
				setData("size", localState.size);

				// Show warning if no values found
				if (!values?.length) {
					console.warn(
						"No values found for column. Frame might be empty or query has issues.",
					);
				}
			}
		} catch (error) {
			console.error("Error during handleUpdate:", error);
			toast.error(
				"Error fetching column values. Check frame and column selection.",
			);
		}
	};

	/**
	 * Resets the current local state and block data
	 */
	const handleReset = () => {
		setLocalState(initialState);
		// Also reset block data to reflect in preview
		Object.entries(initialState).forEach(([key, value]) => {
			setData(key, value);
		});
	};

	const handleToggle = (value: string) => () => {
		if (value === "Select All") {
			if (checked.length === options.length) {
				setChecked([]);
				updateField("frame", []);
			} else {
				setChecked([...options]);
				updateField("frame", [...options]);
			}
		} else {
			const newChecked = checked.includes(value)
				? checked.filter((c) => c !== value)
				: [...checked, value];
			setChecked(newChecked);
			updateField("frame", [...newChecked]);
		}
	};

	return (
		<div className="flex w-full flex-col">
			<Tabs value={selectedTab} onValueChange={setSelectedTab}>
				<TabsList className="w-full">
					<TabsTrigger value="Data" className="flex-1">
						Data
					</TabsTrigger>
					<TabsTrigger value="Tools" className="flex-1">
						Tools
					</TabsTrigger>
				</TabsList>
				<div className="flex h-full flex-col items-start self-stretch">
					<TabsContent value="Data" className="w-full">
						<div className="flex flex-col">
							<div className="flex flex-col items-start gap-2 self-stretch px-4 py-2">
								<p className="self-stretch text-muted-foreground text-sm">
									Select Display Type
								</p>
								<Select
									value={localState.displayType || undefined}
									onValueChange={handleSelectChange(
										"displayType",
									)}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Select display type" />
									</SelectTrigger>
									<SelectContent>
										{DATA.displayType.map((type) => (
											<SelectItem key={type} value={type}>
												{type}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="flex flex-col items-start gap-2 self-stretch px-4 py-2">
								<p className="self-stretch text-muted-foreground text-sm">
									Select Frame
								</p>
								<Popover
									open={dropdownOpen}
									onOpenChange={setDropdownOpen}
								>
									<PopoverTrigger asChild>
										{/* biome-ignore lint/a11y/noStaticElementInteractions: visual item */}
										{/* biome-ignore lint/a11y/useKeyWithClickEvents: visual item */}
										<div
											className="flex min-h-[40px] w-full cursor-pointer items-center justify-between rounded border border-gray-300 px-3 py-2"
											onClick={() =>
												setDropdownOpen((prev) => !prev)
											}
										>
											<span className="text-sm">
												Frames
											</span>
											<div className="flex items-center gap-2">
												<ChevronDown className="size-4" />
												<CloseIcon
													className="size-4"
													onClick={(e) => {
														e.stopPropagation();
														setChecked([]);
														closeDropdown();
													}}
													style={{
														cursor: "pointer",
													}}
												/>
											</div>
										</div>
									</PopoverTrigger>
									<PopoverContent
										className="w-[var(--radix-popover-trigger-width)] p-0"
										align="start"
									>
										<div className="flex max-h-[200px] flex-col overflow-y-auto">
											{/* biome-ignore lint/a11y/noStaticElementInteractions: visual item */}
											{/* biome-ignore lint/a11y/useKeyWithClickEvents: visual item */}
											<div
												className="flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-accent"
												onClick={handleToggle(
													"Select All",
												)}
											>
												<Checkbox
													checked={
														localState.frame
															.length ===
														options.length
													}
												/>
												<span className="text-sm">
													Select All
												</span>
											</div>
											{options.map((option) => (
												// biome-ignore lint/a11y/noStaticElementInteractions: visual item
												// biome-ignore lint/a11y/useKeyWithClickEvents: visual item
												<div
													key={option}
													className="flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-accent"
													onClick={handleToggle(
														option,
													)}
												>
													<Checkbox
														checked={localState.frame.includes(
															option,
														)}
													/>
													<span className="text-sm">
														{option}
													</span>
												</div>
											))}
										</div>
									</PopoverContent>
								</Popover>
							</div>
							<div className="flex flex-col items-start gap-2 self-stretch px-4 py-2">
								<p className="self-stretch text-muted-foreground text-sm">
									Select Column
								</p>
								<Select
									value={localState.column || undefined}
									onValueChange={handleSelectChange("column")}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Select column" />
									</SelectTrigger>
									<SelectContent>
										{columnNames.map((col) => (
											<SelectItem key={col} value={col}>
												{col}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							{localState.displayType === "Dropdown" && (
								<div className="flex flex-col items-start gap-2 self-stretch px-4 py-2">
									<p className="self-stretch text-muted-foreground text-sm">
										Display Filter Label
									</p>
									<Input
										className="w-full"
										value={localState.filterLabel}
										onChange={(e) =>
											updateField(
												"filterLabel",
												e.target.value,
											)
										}
									/>
								</div>
							)}
							{localState.displayType === "Slider" && (
								<div className="flex flex-col items-start gap-2 self-stretch px-4 py-2">
									<p className="self-stretch text-muted-foreground text-sm">
										Slider Sensitivity
									</p>
									<Input
										className="w-full"
										type="number"
										value={localState.sliderSensitivity}
										onChange={(e) =>
											updateField(
												"sliderSensitivity",
												Number(e.target.value),
											)
										}
									/>
								</div>
							)}
							<div className="flex items-center gap-2 self-stretch px-4 py-2">
								<Switch
									checked={localState.showPanelTitle}
									onCheckedChange={handleSwitchChange(
										"showPanelTitle",
									)}
								/>
								<p className="self-center text-muted-foreground text-sm">
									Show Panel Title
								</p>
							</div>
							<div
								className="flex items-center gap-2 self-stretch px-4 py-2"
								style={{
									display:
										localState.displayType === "Slider"
											? "none"
											: "flex",
								}}
							>
								<Switch
									checked={localState.searchable}
									onCheckedChange={handleSwitchChange(
										"searchable",
									)}
								/>
								<p className="self-center text-muted-foreground text-sm">
									Searchable
								</p>
							</div>
							<div
								className="flex items-center gap-2 self-stretch px-4 py-2"
								style={{
									display:
										localState.displayType ===
											"Multiselect" ||
										localState.displayType === "Slider"
											? "none"
											: "flex",
								}}
							>
								<Switch
									checked={localState.multipleSelection}
									onCheckedChange={handleSwitchChange(
										"multipleSelection",
									)}
								/>
								<p className="self-center text-muted-foreground text-sm">
									Allow Multiple Selection
								</p>
							</div>
							<div className="sticky bottom-0 mt-4 flex w-full items-center justify-end gap-2 border-border border-t bg-background px-4 pt-4">
								<Button variant="ghost" onClick={handleReset}>
									Reset
								</Button>
								<Button
									onClick={handleUpdate}
									disabled={isApplyDisabled}
								>
									Update
								</Button>
							</div>
						</div>
					</TabsContent>
					<TabsContent value="Tools" className="w-full">
						<div className="flex flex-col">
							<div className="w-full px-4 py-2 text-[#666666]">
								<SizeSettings
									id={id}
									label="Height"
									path="style.height"
								/>
							</div>
							<div className="w-full px-4 py-2 text-[#666666]">
								<SizeSettings
									id={id}
									label="Width"
									path="style.width"
								/>
							</div>
							<div className="flex flex-col items-start gap-2 self-stretch px-4 py-2">
								<p className="self-stretch text-muted-foreground text-sm">
									Select Button Color
								</p>
								<Select
									value={localState.color || undefined}
									onValueChange={(value) => {
										setData("color", value);
										setLocalState((prev) => ({
											...prev,
											color: value,
										}));
									}}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Select color" />
									</SelectTrigger>
									<SelectContent>
										{DATA.colors.map((color) => (
											<SelectItem
												key={color}
												value={color}
											>
												{color}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="flex flex-col items-start gap-2 self-stretch px-4 py-2">
								<p className="self-stretch text-muted-foreground text-sm">
									Select Button Size
								</p>
								<Select
									value={localState.size || undefined}
									onValueChange={(value) => {
										setData("size", value);
										setLocalState((prev) => ({
											...prev,
											size: value,
										}));
									}}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Select size" />
									</SelectTrigger>
									<SelectContent>
										{DATA.sizes.map((size) => (
											<SelectItem key={size} value={size}>
												{size}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
					</TabsContent>
				</div>
			</Tabs>
		</div>
	);
};
