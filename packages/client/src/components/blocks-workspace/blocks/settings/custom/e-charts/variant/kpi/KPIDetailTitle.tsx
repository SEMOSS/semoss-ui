import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import type { ChangeEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Block, BlockDef, Paths, PathValue } from "@semoss/renderer";
import { getValueByPath } from "@semoss/renderer";
import {
	Button,
	Select,
	Switch,
	styled,
	TextField,
	Typography,
} from "@semoss/ui";
import { useBlockSettings } from "@/hooks";
import { ColorPickerSettings } from "../../../../shared/ColorPickerSettings";
import { FontFamily, FontWeights } from "../../Visualization.constants";

interface KPIDetailToolProps<D extends BlockDef = BlockDef> {
	/**
	 * Id of the block that is being worked with
	 */
	id: string;

	path: Paths<Block<D>["data"], 4>;
}

const StyledAxisDiv = styled("div")<{
	display?: string;
	justifyContent?: string;
	gap?: string;
}>(({ display, justifyContent, gap }) => ({
	display: display ?? undefined,
	justifyContent: justifyContent ?? undefined,
	flexDirection: "row",
	padding: "8px 16px",
	alignItems: "center",
	gap: gap ?? undefined,
}));

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

export const KPIDetailTitle = observer(
	<D extends BlockDef = BlockDef>({ id, path }: KPIDetailToolProps<D>) => {
		const { data, setData } = useBlockSettings<D>(id);
		const [value, setValue] = useState("");
		const [showAnimation, setshowAnimation] = useState(true);
		const [detail, setDetail] = useState({
			fontSize: 64,
			fontWeight: "bold",
			fontFamily: "",
			color: "#0471F0",
			offsetCenterX: 0,
			offsetCenterY: "-20%",
			valueAnimation: true,
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
		 * Retains the local state of the feature on reset button
		 * With the local state we will be displaying the values in the fields
		 */
		const retainLocalState = useCallback(
			(options: Record<string, unknown>) => {
				if (options?.series?.[0]?.detail) {
					const detailConfig = options.series[0].detail;
					setDetail({
						// Retain the font size
						fontSize: detailConfig.fontSize || 64,
						// Retain the font weight
						fontWeight: detailConfig.fontWeight || "bold",
						// Retain the font family
						fontFamily: detailConfig.fontFamily || "",
						// Retain the color
						color: detailConfig.color || "#0471F0",
						// Retain the offset center X position
						offsetCenterX: detailConfig.offsetCenter?.[0] || 0,
						// Retain the offset center Y position
						offsetCenterY: detailConfig.offsetCenter?.[1] || "-20%",
						// Retain the value animation setting
						valueAnimation: detailConfig.valueAnimation !== false,
					});
				}
			},
			[],
		);

		// Reinitialize the feature when the chart is loaded
		const reInitializeFeatures = useCallback(() => {
			// KPI detail is always shown in gauge charts, but we can control visibility
			setshowAnimation(true);
		}, []);

		useEffect(() => {
			setValue(computedValue);
		}, [computedValue]);

		useEffect(() => {
			if (Object.hasOwn(data, "option")) {
				reInitializeFeatures();
				retainLocalState(data.option as Record<string, unknown>);
			}
		}, [data, reInitializeFeatures, retainLocalState]);

		/**
		 * Handle the change event for any KPI Detail input
		 * @param inputType - name of the input field
		 * @param inputValue - value of the input field
		 */
		function handleInputChange(
			inputType: string,
			inputValue: string | number | boolean,
		) {
			const option = JSON.parse(value);

			// Ensure series structure exists
			if (
				!option.series ||
				!option.series[0] ||
				!option.series[0].detail
			) {
				return;
			}

			if (inputType === "showAnimation") {
				//can control animation
				const boolValue = Boolean(inputValue);
				option.series[0].detail.valueAnimation = boolValue;
				setshowAnimation(boolValue);
				setDetail((prev) => ({
					...prev,
					valueAnimation: boolValue,
				}));
			} else if (inputType === "fontSize") {
				const numValue = Number(inputValue);
				option.series[0].detail.fontSize = numValue;
				setDetail((prev) => ({
					...prev,
					fontSize: numValue,
				}));
			} else if (inputType === "fontWeight") {
				const strValue = String(inputValue);
				option.series[0].detail.fontWeight = strValue;
				setDetail((prev) => ({
					...prev,
					fontWeight: strValue,
				}));
			} else if (inputType === "fontFamily") {
				const strValue = String(inputValue);
				option.series[0].detail.fontFamily = strValue;
				setDetail((prev) => ({
					...prev,
					fontFamily: strValue,
				}));
			} else if (inputType === "color") {
				const strValue = String(inputValue);
				option.series[0].detail.color = strValue;
				setDetail((prev) => ({
					...prev,
					color: strValue,
				}));
			} else if (inputType === "offsetCenterX") {
				const currentOffsetY =
					option.series[0].detail.offsetCenter?.[1] || "-20%";
				const numValue = Number(inputValue);
				option.series[0].detail.offsetCenter = [
					numValue,
					currentOffsetY,
				];
				setDetail((prev) => ({
					...prev,
					offsetCenterX: numValue,
				}));
			} else if (inputType === "offsetCenterY") {
				const currentOffsetX =
					option.series[0].detail.offsetCenter?.[0] || 0;
				const strValue = String(inputValue);
				option.series[0].detail.offsetCenter = [
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
		}

		/**
		 * Resets the KPI detail feature to its default values.
		 * Default values are defined in the 'reset' object of the option.
		 */
		function handleReset() {
			const option = JSON.parse(value);
			console.log(option);

			// Reset all detail properties
			option.series[0].detail.fontSize = 64;
			option.series[0].detail.fontWeight = "bold";
			option.series[0].detail.fontFamily = "";
			option.series[0].detail.color = "#0471F0";
			option.series[0].detail.offsetCenter = [0, "-20%"];
			option.series[0].detail.valueAnimation = true;

			// Update the data with the reset option
			setData(path, option as PathValue<D["data"], typeof path>);

			// Retain the local state with the updated option
			retainLocalState(option);
		}

		return (
			<StyledAxis>
				<StyledAxisDiv
					display="flex"
					gap="8px"
					style={{ marginTop: "8px" }}
				>
					<Switch
						size="small"
						checked={showAnimation && detail.valueAnimation}
						onChange={(e: ChangeEvent<HTMLInputElement>) =>
							handleInputChange("showAnimation", e.target.checked)
						}
						title="Enable Value Animation"
					/>
					<Typography variant="body2" color="secondary">
						Value Animation
					</Typography>
				</StyledAxisDiv>

				<StyledAxisColDiv display="flex" justifyContent="space-around">
					<Typography variant="body2" color="secondary">
						Font Size
					</Typography>
					<StyledTextField
						size="small"
						id={`KPITitleFontSize-${id}`}
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
						id={`KPITitleFontWeight-${id}`}
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
						id={`KPITitleFontFamily-${id}`}
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
						id={`KPITitleHorizontalPosition-${id}`}
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
						id={`KPITitleVerticalPosition-${id}`}
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
					path="option.series[0].detail.color"
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
