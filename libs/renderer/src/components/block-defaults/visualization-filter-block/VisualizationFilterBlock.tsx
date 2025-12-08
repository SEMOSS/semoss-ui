import { observer } from "mobx-react-lite";
import { type CSSProperties, useEffect, useState } from "react";
import {
	Box,
	CircularProgress,
	styled,
	Typography,
	useNotification,
} from "@semoss/ui";
import { useBlock, useBlocks } from "../../../hooks";
import type { BlockComponent, BlockDef, ListenerActions } from "../../../store";
import FilterChecklistComponent from "./ModularFilterComponents/FilterChecklistComponent";
import FilterDropdownComponent from "./ModularFilterComponents/FilterDropdownComponent";
import FilterMultiselectComponent from "./ModularFilterComponents/FilterMultiselectComponent";
import FilterSliderComponent from "./ModularFilterComponents/FilterSliderComponent";

const FilterContainer = styled(Box)(({ theme }) => ({
	display: "flex",
	padding: theme.spacing(0.5),
	flexDirection: "column",
	justifyContent: "center",
	alignItems: "center",
	gap: theme.spacing(1.25),
	alignSelf: "stretch",
	borderRadius: theme.shape.borderRadius,
	border: `1px solid ${theme.palette.divider}`,
	position: "relative",
}));

const FilterHeader = styled(Box)(({ theme }) => ({
	display: "flex",
	height: theme.spacing(5),
	alignItems: "center",
	gap: theme.spacing(1.25),
	flexShrink: 0,
	alignSelf: "stretch",
	borderRadius: theme.shape.borderRadius / 4,
	backgroundColor: "#F5F9FE",
	padding: theme.spacing(0, 1.25),
}));

const FilterBody = styled(Box)(({ theme }) => ({
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	padding: theme.spacing(1.25),
	width: "100%",
	height: "100%",
}));

const LoadingOverlay = styled(Box)(({ theme }) => ({
	position: "absolute",
	top: 0,
	left: 0,
	right: 0,
	bottom: 0,
	display: "flex",
	flexDirection: "column",
	alignItems: "center",
	justifyContent: "center",
	gap: theme.spacing(1.5),
	backgroundColor: "rgba(255, 255, 255, 0.7)",
	backdropFilter: "blur(2px)",
	borderRadius: theme.shape.borderRadius,
	zIndex: 1300,
}));
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
	const notification = useNotification();
	const { state } = useBlocks();
	const [resetChecked, setResetChecked] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	// biome-ignore lint/correctness/noUnusedVariables: <does not need to be used>
	const blocks = state.blocks;
	useEffect(() => {
		if (listeners.preProcess) {
			listeners.preProcess();
		}
	}, [data]);

	const mode = data.displayType.toLowerCase();
	const handleApply = async (selected, type?: string) => {
		if (selected.length === 0) {
			notification.add({
				color: "warning",
				message: "No options selected.",
			});
			return;
		}
		// Set loading to true and try filter logic
		setIsLoading(true);
		try {
			// Set initial value, this will change based off mode and array length
			let valuesString = "";
			// Update the selected values in the block's data
			if (mode !== "slider" && mode !== "multiselect") {
				setData("selectedValues", selected);
			}
			// Try to create filter pixel and apply it to the frame
			// Use notifications to dsipaly messages based on the response
			try {
				for (let i = 0; i < data.frame.length; i++) {
					// Construct the command to set a filter on the frame based on the selected column and values
					const pixelCommand = `META | UnfilterFrame(${data.frame[i]});`;

					// Execute the command as a side effect in the application state
					await state.runSideEffect(pixelCommand);
					// If an successful apply occurs, notify the user with a success message
					notification.add({
						color: "success",
						message: "Filter applied successfully!",
					});
				}
				// biome-ignore lint/correctness/noUnusedVariables: <Error messsage is not needed for notification>
			} catch (error) {
				// If an error occurs, notify the user with an error message
				notification.add({
					color: "error",
					message:
						"Invalid response or errors found while applying the filter.",
				});
			}

			if (type === "slider") {
				// Convert the selected string values to numbers for range
				const selectedNumbers = selected.map((s) => parseInt(s, 10));
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
				// biome-ignore lint/correctness/noUnusedVariables: <Error messsage is not needed for notification>
			} catch (error) {
				// If an error occurs, notify the user with an error message
				notification.add({
					color: "error",
					message:
						"Invalid response or errors found while applying the filter.",
				});
			}
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
		setIsLoading(true);
		try {
			// Update the block's data by removing any selected values
			setData("selectedValues", [...data.listOptions]);

			// Reset the resetChecked state to true to indicate that the reset action has been performed
			setResetChecked(true);

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
							data?: { values };
						}
					)?.data?.values;
					const options = values.map((item) => String(item[0]));
					setData("listOptions", options);
				}
				// If an successful reset occurs, notify the user with a success message
				notification.add({
					color: "success",
					message: "Unfilter applied successfully!",
				});
			} catch (error) {
				// If an error occurs, notify the user with an error message
				notification.add({
					color: "error",
					message: `Invalid response or errors found while fetching options. ${error}`,
				});
			}
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
			<FilterContainer>
				<FilterHeader>
					<Typography variant="subtitle1">
						{data.showPanelTitle ? "Filter by " + data.column : ""}
					</Typography>
				</FilterHeader>
				<FilterBody>
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
				</FilterBody>
			</FilterContainer>
			{isLoading && (
				<LoadingOverlay>
					<CircularProgress />
					<Typography variant="body2" sx={{ fontWeight: 500 }}>
						Applying filter...
					</Typography>
				</LoadingOverlay>
			)}
		</div>
	);
});
