import { Loader2 } from "lucide-react";
import { observer } from "mobx-react-lite";
import { type CSSProperties, useEffect, useState } from "react";
import { toast } from "@semoss/ui/next";
import { useBlock, useBlocks } from "../../../hooks";
import type { BlockComponent, BlockDef, ListenerActions } from "../../../store";
import FilterChecklistComponent from "./ModularFilterComponents/FilterChecklistComponent";
import FilterDropdownComponent from "./ModularFilterComponents/FilterDropdownComponent";
import FilterMultiselectComponent from "./ModularFilterComponents/FilterMultiselectComponent";
import FilterSliderComponent from "./ModularFilterComponents/FilterSliderComponent";

export interface VisualizationFilterBlockDef
	extends BlockDef<"visualization-filter"> {
	widget: "visualization-filter";
	data: {
		style: CSSProperties;
		displayType: string;
		frame: string;
		column: string;
		showPanelTitle: boolean;
		searchable: boolean;
		multipleSelection: boolean;
		show: string;
		filterLabel: string;
		sliderSensitivity: number;
		listOptions: string[];
		selectedValues: string[];
		color: "secondary" | "primary" | "success" | "warning" | "error";
		size: "small" | "medium" | "large";
	};
	listeners: {
		preProcess: {
			type: "sync" | "async";
			order: ListenerActions[];
		};
	};
}

export const VisualizationFilterBlock: BlockComponent = observer(({ id }) => {
	const { attrs, data, setData, listeners } =
		useBlock<VisualizationFilterBlockDef>(id);
	const { state } = useBlocks();
	const [resetChecked, setResetChecked] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only effect
	useEffect(() => {
		if (listeners.preProcess) {
			listeners.preProcess();
		}
	}, [data]);

	const mode = data.displayType.toLowerCase();
	const handleApply = async (selected: string[], type?: string) => {
		if (selected.length === 0) {
			toast.warning("No options selected.", { position: "top-right" });
			return;
		}
		//set initial value of valuesString -- will change based off mode and array length
		let valuesString = "";
		// Update the selected values in the block's data
		if (mode !== "slider" && mode !== "multiselect") {
			setData("selectedValues", selected);
		}

		// Set loading to true and try filter logic
		setIsLoading(true);
		try {
			for (let i = 0; i < data.frame.length; i++) {
				// Construct the command to set a filter on the frame based on the selected column and values
				const pixelCommand = `META | UnfilterFrame(${data.frame[i]});`;

				// Execute the command as a side effect in the application state
				await state.runSideEffect(pixelCommand);
			}
			// biome-ignore lint/correctness/noUnusedVariables: <use error as needed>
		} catch (error) {
			// If an error occurs, notify the user with an error message
			toast.error(
				"Invalid response or errors found while applying the filter.",
				{ position: "top-right" },
			);
			setIsLoading(false);
			return;
		}

		if (type === "slider") {
			// Convert the selected string values to numbers for range
			const selectedNumbers = selected.map((s: string) =>
				parseInt(s, 10),
			);
			valuesString = `[${selectedNumbers}]`;
		} else {
			// if selected is only one value, do not create an array of values to pass in (this is to account for multi select)
			if (selected.length === 1) {
				valuesString = `'${selected}'`;
			} else {
				valuesString = `[${selected}]`;
			}
		}
		// Create a string representation of the selected numbers array
		try {
			// if no items are selected, do not use the value string
			for (let i = 0; i < data.frame.length; i++) {
				// Construct the command to set a filter on the frame based on the selected column and values
				const pixelCommand = `META | ${data.frame[i]} | AddFrameFilter(((${data.column} == ${selected.length > 0 ? valuesString : "[]"})));`;

				// Execute the command as a side effect in the application state
				await state.runSideEffect(pixelCommand);
			}
			// If successful, notify the user with a success message
			toast.success("Filter applied successfully!", {
				position: "top-right",
			});
			// biome-ignore lint/correctness/noUnusedVariables: <use as needed>
		} catch (error) {
			// If an error occurs, notify the user with an error message
			toast.error(
				"Invalid response or errors found while applying the filter.",
				{ position: "top-right" },
			);
		} finally {
			setIsLoading(false);
		}
	};

	/**
	 * Handle the reset of the filter values in the block's data
	 * and the unfiltering of the frame in the application state.
	 * This function is called when the user clicks the "Reset" button
	 * on the filter component.
	 */
	const handleReset = async () => {
		// Update the block's data by removing any selected values
		setData("selectedValues", [...data.listOptions]);

		// Reset the resetChecked state to true to indicate that the reset action has been performed
		setResetChecked(true);

		setIsLoading(true);
		try {
			for (let i = 0; i < data.frame.length; i++) {
				// Construct the command to unfilter the frame in the application state
				const pixelUnfilterCommand = `META | UnfilterFrame(${data.frame[i]});`;
				// Execute the command as a side effect in the application state
				await state.runSideEffect(pixelUnfilterCommand);
				const res = await state.runSideEffect(
					`META | Frame(${data.frame[i]}) | Select(${data.column}).as([${data.column}])|Group(${data.column})|Sort(${data.column}) | Offset(0) | Limit(1000) | Collect(1000);`,
				);
				const values = (
					res?.pixelReturn?.[0]?.output as {
						// biome-ignore lint/suspicious/noExplicitAny: <more information needed>
						data?: { values?: any[] };
					}
				)?.data?.values;
				if (values) {
					const options = values.map((item) => String(item[0]));
					setData("listOptions", options);
				}
			}
			// If successful reset occurs, notify the user with a success message
			toast.success("Unfilter applied successfully!", {
				position: "top-right",
			});
		} catch (error) {
			// If an error occurs, notify the user with an error message
			toast.error(
				`Invalid response or errors found while fetching options. ${error}`,
				{ position: "top-right" },
			);
		} finally {
			setIsLoading(false);
		}
	};
	return (
		<div
			style={{
				...data.style,
				position: "relative",
			}}
			{...attrs}
		>
			<div className="flex flex-col items-center justify-center gap-[10px] self-stretch rounded border border-border p-0.5">
				<div className="flex h-10 shrink-0 items-center gap-[10px] self-stretch rounded-sm bg-[#F5F9FE] px-[10px]">
					<p className="font-semibold text-base">
						{data.showPanelTitle ? `Filter by ${data.column}` : ""}
					</p>
				</div>
				<div className="flex h-full w-full items-center justify-center p-[10px]">
					{mode === "dropdown" && (
						<FilterDropdownComponent
							key={JSON.stringify(data)}
							mode={mode}
							listOptions={
								data.displayType === "Multiselect"
									? data.selectedValues.length > 0
										? data.selectedValues
										: data.listOptions
									: data.listOptions
							}
							multi={data.multipleSelection}
							showSearch={data.searchable}
							checkedValues={data.selectedValues}
							onApply={handleApply}
							filterLabel={data.filterLabel}
							onReset={handleReset}
							color={data.color}
							size={data.size}
							resetChecked={resetChecked}
							setResetChecked={setResetChecked}
						/>
					)}
					{mode === "slider" && (
						<FilterSliderComponent
							key={JSON.stringify(data)}
							mode={mode}
							listOptions={
								data.displayType === "Multiselect"
									? data.selectedValues.length > 0
										? data.selectedValues
										: data.listOptions
									: data.listOptions
							}
							onApply={handleApply}
							sliderSensitivity={data.sliderSensitivity}
							onReset={handleReset}
							color={data.color}
							size={data.size}
						/>
					)}
					{mode === "multiselect" && (
						<FilterMultiselectComponent
							key={JSON.stringify(data)}
							mode={mode}
							listOptions={
								data.displayType === "Multiselect"
									? data.selectedValues.length > 0
										? data.selectedValues
										: data.listOptions
									: data.listOptions
							}
							multi={data.multipleSelection}
							onApply={handleApply}
							onReset={handleReset}
							color={data.color}
							size={data.size}
						/>
					)}
					{mode === "checklist" && (
						<FilterChecklistComponent
							key={JSON.stringify(data)}
							mode={mode}
							listOptions={
								data.displayType === "Multiselect"
									? data.selectedValues.length > 0
										? data.selectedValues
										: data.listOptions
									: data.listOptions
							}
							multi={data.multipleSelection}
							showSearch={data.searchable}
							checkedValues={data.selectedValues}
							onApply={handleApply}
							onReset={handleReset}
							color={data.color}
							size={data.size}
							resetChecked={resetChecked}
							setResetChecked={setResetChecked}
						/>
					)}
				</div>
			</div>
			{/* Loading Overlay */}
			{isLoading && (
				<div
					className="absolute inset-0 z-[1300] flex flex-col items-center justify-center gap-1.5 rounded backdrop-blur-sm"
					style={{
						backgroundColor: "rgba(255, 255, 255, 0.7)",
					}}
				>
					<Loader2 className="size-8 animate-spin text-primary" />
					<p className="font-medium text-sm">Applying filter...</p>
				</div>
			)}
		</div>
	);
});
