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
	const updateField = (field, value) => {
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
				/**
				 * Set the displayType to the new value.
				 */
				displayType: updatedValue,
				/**
				 * Reset the filterLabel field to an empty string.
				 */
				filterLabel: "",
				/**
				 * Reset the sliderSensitivity field to an empty string.
				 */
				sliderSensitivity: "",
			}));
		} else {
			/**
			 * If the field that was changed is not the displayType, then
			 * we can just update the field with the new value.
			 */
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
		setLocalState((prevState) => {
			const updatedState = {
				...prevState,
			};
			updatedState[field] = isChecked;
			return updatedState;
		});
	};

	const isApplyDisabled =
		!localState.displayType || !localState.frame || !localState.column;

	/**
	 * Updates the block's data store with the current local state
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

				if (!values?.length) {
					setLocalState((prev) => ({ ...prev, listOptions: [] }));

					toast.error(
						"Invalid response or errors found while fetching options.",
					);
					return;
				}

				const options = values.map((item: any) => String(item[0]));

				setLocalState((prev) => {
					const updatedState = {
						...prev,
						listOptions: options,
						selectedValues: [],
						filterLabel: `Filter of ${localState.column || localState.filterLabel}`,
					};

					Object.entries(updatedState).forEach(([key, value]) => {
						setData(key, value);
					});

					return updatedState;
				});
			}
		} catch (error) {
			console.error("Error during handleUpdate:", error);
		}
	};

	/**
	 * Resets the current local state
	 */
	const handleReset = () => {
		setLocalState(initialState);
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
										value={
											(localState.column
												? `Filter of ${localState.column}`
												: "") || localState.filterLabel
										}
										onChange={() =>
											updateField(
												"filterLabel",
												(localState.column
													? `Filter of ${localState.column}`
													: "") ||
													localState.filterLabel,
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
												e.target.value,
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
							<div className="absolute right-0 bottom-4 left-0 z-[1000] mt-2 flex w-full items-center justify-end gap-2 pr-2">
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
