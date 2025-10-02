import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
	Block,
	BlockDef,
	EchartVisualizationBlockDef,
	Paths,
	PathValue,
} from "@semoss/renderer";
import { getValueByPath, useBlock, useFrame } from "@semoss/renderer";
import { Button, Select, styled, TextField, Typography } from "@semoss/ui";
import { useBlockSettings } from "@/hooks";
import { ColorPickerSettings } from "../../../../shared/ColorPickerSettings";
import { FontFamily, FontWeights } from "../../Visualization.constants";

interface KPIDetailLabelProps<D extends BlockDef = BlockDef> {
	/**
	 * Id of the block that is being worked with
	 */
	id: string;

	path: Paths<Block<D>["data"], 4>;
}

const StyledAxis = styled("div")<{
	display?: string;
	justifyContent?: string;
}>(({ display, justifyContent }) => ({
	display: display ?? undefined,
	justifyContent: justifyContent ?? undefined,
	flexDirection: "row",
}));

const StyledButtonWrapper = styled("div")({
	display: "flex",
	justifyContent: "flex-end",
	padding: "8px 16px",
});

const StyledAxisColDiv = styled("div")<{
	display?: string;
	justifyContent: string;
}>(({ display, justifyContent }) => ({
	display: display ?? undefined,
	justifyContent: justifyContent ?? undefined,
	flexDirection: "column",
	padding: "8px 16px",
	gap: "8px",
	marginBottom: "8px",
}));

const StyledTextField = styled(TextField)(() => ({
	width: "100%",
}));

const StyledSelect = styled(Select)(() => ({
	width: "100%",
}));

export const KPIDetailLabel = observer(
	<D extends BlockDef = BlockDef>({ id, path }: KPIDetailLabelProps<D>) => {
		const { data, setData } = useBlockSettings<D>(id);
		const { data: blockData } = useBlock<EchartVisualizationBlockDef>(id);
		const [value, setValue] = useState("");
		const [detail, setDetail] = useState({
			titleText: "",
			originalTitle: "",
			fontSize: 32,
			fontWeight: "normal",
			fontFamily: "",
			color: "#000000",
			offsetCenterX: 0,
			offsetCenterY: "20%",
		});

		// Track initialization to prevent unnecessary updates
		const isInitialized = useRef(false);

		// Build dynamic query like KPI component does
		const buildDynamicQuery = useCallback(
			(inputData: [string, Record<string, string | undefined>][]) => {
				const selectParts: string[] = [];
				const aliasParts: string[] = [];

				inputData.forEach(([_, fields]) => {
					for (const field in fields) {
						const rawAgg = fields[field];
						aliasParts.push(field);

						if (rawAgg) {
							const cleanedAgg = rawAgg.split(" ").join("");
							selectParts.push(`${cleanedAgg}(${field})`);
						} else {
							selectParts.push(field);
						}
					}
				});
				return `Select(${selectParts.join(", ")}).as([${aliasParts.join(", ")}])`;
			},
			[],
		);
		// Grab the frame so we can get the headers for building the KPI name
		const frameSelector = useMemo(() => {
			return buildDynamicQuery(
				Object.entries(blockData?.aggregate ?? {}),
			);
		}, [buildDynamicQuery, blockData?.aggregate]);

		const frame = useFrame(blockData?.frame?.name, {
			selector: frameSelector,
		});

		const computedValue = useMemo(() => {
			return computed(() => {
				if (!data) {
					return "";
				}
				const v = getValueByPath(data, path);
				if (typeof v === "undefined") {
					return "";
				} else if (typeof v === "string") {
					return v;
				}
				return JSON.stringify(v, null, 2);
			});
		}, [data, path]).get();

		/**
		 * Get the formatted KPI name using the exact same logic as KPI component
		 * Returns Sample KPI if no data is available
		 */
		const getFormattedKPIName = useCallback(() => {
			let kpiName = "Sample KPI";

			if (frame?.data?.headers && frame.data.headers.length > 0) {
				const fieldName = frame.data.headers[0];

				// Format field name: lowercase with first letter capitalized (same as KPI component)
				const formatFieldName = (name: string) => {
					return (
						name.toLowerCase().charAt(0).toUpperCase() +
						name.toLowerCase().slice(1)
					);
				};

				const formattedFieldName = formatFieldName(fieldName);

				// Look for the aggregation type in data.aggregate (same as KPI component)
				const aggregateInfo = blockData?.aggregate?.dimension;

				if (aggregateInfo?.[fieldName]) {
					const aggregationType = aggregateInfo[fieldName];
					kpiName = `${aggregationType} of ${formattedFieldName}`;
				} else {
					kpiName = formattedFieldName;
				}
			}

			return kpiName;
		}, [frame?.data?.headers, blockData?.aggregate?.dimension]);

		/**
		 * Retains the local state of the feature on reset button
		 * With the local state we will be displaying the values in the fields
		 */
		const retainLocalState = useCallback(
			(options: Record<string, unknown>) => {
				if (options?.series?.[0]?.title) {
					const detailConfig = options.series[0].title;
					const currentTitle =
						options.series?.[0]?.data?.[0]?.name || "";
					const originalTitle = options.originalTitle || currentTitle;

					setDetail({
						// Current title text
						titleText: currentTitle,
						// Original title for reset functionality
						originalTitle: originalTitle,
						// Retain the font size
						fontSize: detailConfig.fontSize || 32,
						// Retain the font weight
						fontWeight: detailConfig.fontWeight || "normal",
						// Retain the font family
						fontFamily: detailConfig.fontFamily || "",
						// Retain the color
						color: detailConfig.color || "#000000",
						// Retain the offset center X position
						offsetCenterX: detailConfig.offsetCenter?.[0] || 0,
						// Retain the offset center Y position
						offsetCenterY: detailConfig.offsetCenter?.[1] || "20%",
					});
				}
			},
			[],
		);
		// Update local value state when computedValue changes
		useEffect(() => {
			setValue(computedValue);
		}, [computedValue]);

		// Initialize the label in the local data on first load
		useEffect(() => {
			if (!data || !Object.hasOwn(data, "option") || !computedValue) {
				return;
			}

			// Wait for frame data to be available before initializing
			if (!frame?.data?.headers || frame.data.headers.length === 0) {
				return; // Don't initialize yet, wait for frame data
			}

			const option = JSON.parse(computedValue);

			// Only run initialization logic if this is the first time or option is missing critical structure
			const needsInitialization =
				!isInitialized.current ||
				!option.series?.[0]?.title ||
				!option.series?.[0]?.data?.[0];

			if (needsInitialization) {
				const formattedKPIName = getFormattedKPIName();
				const currentTitle = option.series?.[0]?.data?.[0]?.name;
				const shouldUpdateTitle =
					!currentTitle ||
					(!option.userCustomizedTitle &&
						formattedKPIName &&
						formattedKPIName !== "");

				if (
					shouldUpdateTitle &&
					option.series?.[0]?.data?.[0] &&
					formattedKPIName
				) {
					const updatedOption = { ...option };
					updatedOption.series[0].data[0].name = formattedKPIName;
					updatedOption.originalTitle = formattedKPIName;
					setData(
						path,
						updatedOption as PathValue<D["data"], typeof path>,
					);
				}
				retainLocalState(option);
				isInitialized.current = true;
			}
		}, [
			data,
			computedValue,
			getFormattedKPIName,
			path,
			setData,
			retainLocalState,
			frame?.data?.headers,
		]);

		/**
		 * Handle the change event for any KPI Detail input
		 * @param inputType - name of the input field
		 * @param inputValue - value of the input field
		 */
		const handleInputChange = useCallback(
			(inputType: string, inputValue: string | number | boolean) => {
				const option = JSON.parse(value);

				// Ensure series structure exists
				if (
					!option.series ||
					!option.series[0] ||
					!option.series[0].title
				) {
					return;
				}

				if (inputType === "titleText") {
					const strValue = String(inputValue);
					// Update the KPI title in the series data
					if (option.series?.[0]?.data?.[0]) {
						option.series[0].data[0].name = strValue;
					}
					// Mark that user has customized the title
					option.userCustomizedTitle = true;
					// Update local state immediately
					setDetail((prev) => ({
						...prev,
						titleText: strValue,
					}));
				} else if (inputType === "fontSize") {
					const numValue = Number(inputValue);
					option.series[0].title.fontSize = numValue;
					setDetail((prev) => ({
						...prev,
						fontSize: numValue,
					}));
				} else if (inputType === "fontWeight") {
					const strValue = String(inputValue);
					option.series[0].title.fontWeight = strValue;
					setDetail((prev) => ({
						...prev,
						fontWeight: strValue,
					}));
				} else if (inputType === "fontFamily") {
					const strValue = String(inputValue);
					option.series[0].title.fontFamily = strValue;
					setDetail((prev) => ({
						...prev,
						fontFamily: strValue,
					}));
				} else if (inputType === "color") {
					const strValue = String(inputValue);
					option.series[0].title.color = strValue;
					setDetail((prev) => ({
						...prev,
						color: strValue,
					}));
				} else if (inputType === "offsetCenterX") {
					const currentOffsetY =
						option.series[0].title.offsetCenter?.[1] || "20%";
					const numValue = Number(inputValue);
					option.series[0].title.offsetCenter = [
						numValue,
						currentOffsetY,
					];
					setDetail((prev) => ({
						...prev,
						offsetCenterX: numValue,
					}));
				} else if (inputType === "offsetCenterY") {
					const currentOffsetX =
						option.series[0].title.offsetCenter?.[0] || 0;
					const strValue = String(inputValue);
					option.series[0].title.offsetCenter = [
						currentOffsetX,
						strValue,
					];
					setDetail((prev) => ({
						...prev,
						offsetCenterY: strValue,
					}));
				}

				// Update the data with the new option
				setData(path, option as PathValue<D["data"], typeof path>);
			},
			[value, path, setData],
		);

		/**
		 * Resets the KPI detail feature to its default values.
		 * Default values are defined in the 'reset' object of the option.
		 */
		const handleReset = useCallback(() => {
			const option = JSON.parse(value);
			const formattedKPIName = getFormattedKPIName();

			// Reset title text to the formatted KPI name (original from data) or Sample KPI if no data
			option.series[0].data[0].name = formattedKPIName;
			option.originalTitle = formattedKPIName;

			// Clear the user customization flag
			option.userCustomizedTitle = false;

			// Reset all other title properties
			option.series[0].title.fontSize = 32;
			option.series[0].title.fontWeight = "normal";
			option.series[0].title.fontFamily = "";
			option.series[0].title.color = "#000000";
			option.series[0].title.offsetCenter = [0, "20%"];

			// Update the data with the reset option
			setData(path, option as PathValue<D["data"], typeof path>);

			// Retain the local state with the updated option
			retainLocalState(option);
		}, [value, getFormattedKPIName, path, setData, retainLocalState]);

		return (
			<StyledAxis>
				<StyledAxisColDiv display="flex" justifyContent="space-around">
					<Typography variant="body2" color="secondary">
						Label Text
					</Typography>
					<StyledTextField
						size="small"
						id={`KPILabelText-${id}`}
						name="titleText"
						value={detail?.titleText}
						onChange={(e) =>
							handleInputChange("titleText", e.target.value)
						}
						placeholder="Enter KPI Label"
					/>
				</StyledAxisColDiv>

				<StyledAxisColDiv display="flex" justifyContent="space-around">
					<Typography variant="body2" color="secondary">
						Font Size
					</Typography>
					<StyledTextField
						size="small"
						id={`KPILabelFontSize-${id}`}
						name="fontSize"
						type="number"
						value={detail?.fontSize}
						onChange={(e) =>
							handleInputChange("fontSize", e.target.value)
						}
					/>
				</StyledAxisColDiv>

				<StyledAxisColDiv display="flex" justifyContent="space-around">
					<Typography variant="body2" color="secondary">
						Font Weight
					</Typography>
					<StyledSelect
						size="small"
						id={`KPILabelFontWeight-${id}`}
						name="fontWeight"
						value={detail?.fontWeight}
						onChange={(e) =>
							handleInputChange("fontWeight", e.target.value)
						}
					>
						<Select.Item key="-1" value="">
							Select
						</Select.Item>
						{FontWeights.map((weight) => (
							<Select.Item value={weight} key={weight}>
								{weight}
							</Select.Item>
						))}
					</StyledSelect>
				</StyledAxisColDiv>

				<StyledAxisColDiv display="flex" justifyContent="space-around">
					<Typography variant="body2" color="secondary">
						Select Font Family
					</Typography>
					<StyledSelect
						size="small"
						id={`KPILabelFontFamily-${id}`}
						name="fontFamily"
						value={detail?.fontFamily}
						onChange={(e) =>
							handleInputChange("fontFamily", e.target.value)
						}
					>
						<Select.Item key="-1" value="">
							Select
						</Select.Item>
						{FontFamily.map((label) => {
							return (
								<Select.Item value={label} key={label}>
									{label}
								</Select.Item>
							);
						})}
					</StyledSelect>
				</StyledAxisColDiv>

				<StyledAxisColDiv display="flex" justifyContent="space-around">
					<Typography variant="body2" color="secondary">
						Horizontal Position (X)
					</Typography>
					<StyledTextField
						size="small"
						id={`KPILabelHorizontalPosition-${id}`}
						name="offsetCenterX"
						type="number"
						value={detail?.offsetCenterX}
						onChange={(e) =>
							handleInputChange("offsetCenterX", e.target.value)
						}
						placeholder="0"
					/>
				</StyledAxisColDiv>

				<StyledAxisColDiv display="flex" justifyContent="space-around">
					<Typography variant="body2" color="secondary">
						Vertical Position (Y)
					</Typography>
					<StyledTextField
						size="small"
						id={`KPILabelVerticalPosition-${id}`}
						name="offsetCenterY"
						value={detail?.offsetCenterY}
						onChange={(e) =>
							handleInputChange("offsetCenterY", e.target.value)
						}
						placeholder="-20%"
					/>
				</StyledAxisColDiv>

				<ColorPickerSettings
					id={id}
					path="option.series[0].title.color"
					colorValue={detail.color}
					onChange={(color) => handleInputChange("color", color)}
				/>

				<StyledButtonWrapper>
					<Button
						variant="contained"
						color="primary"
						size="small"
						onClick={handleReset}
					>
						Reset
					</Button>
				</StyledButtonWrapper>
			</StyledAxis>
		);
	},
);
