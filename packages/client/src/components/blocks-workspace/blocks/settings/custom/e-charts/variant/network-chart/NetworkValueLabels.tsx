import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import {
	type Block,
	type BlockDef,
	getValueByPath,
	type Paths,
	type PathValue,
} from "@semoss/renderer";
import {
	Button,
	Select,
	Slider,
	Switch,
	styled,
	TextField,
	Typography,
} from "@semoss/ui";
import { useBlockSettings } from "@/hooks";
import { ColorPickerSettings } from "../../../../shared/ColorPickerSettings";
import { FontFamily, Line_Alignment } from "../../Visualization.constants";

interface JsonSettingsProps<D extends BlockDef = BlockDef> {
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
	marginTop: "8px",
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
	margin: "8px 16px",
});
const StyledAxisColDiv = styled("div")<{
	display?: string;
	justifyContent: string;
}>(({ theme, display, justifyContent }) => ({
	display: display ?? undefined,
	justifyContent: justifyContent ?? undefined,
	flexDirection: "column",
	padding: "8px 16px",
	gap: "8px",
	marginBottom: "8px",
}));
const StyledAxisSpan = styled("span")<{
	display?: string;
	justifyContent?: string;
	width?: string;
}>(({ display, justifyContent, width }) => ({
	display: display ?? undefined,
	justifyContent: justifyContent ?? undefined,
	width: width ?? undefined,
}));
const StyledTextField = styled(TextField)(() => ({
	width: "100%",
}));
const StyledSelect = styled(Select)(() => ({
	width: "100%",
}));
export const NetworkValueLabel = observer(
	<D extends BlockDef = BlockDef>({ id, path }: JsonSettingsProps<D>) => {
		const { data, setData } = useBlockSettings<D>(id);
		const [value, setValue] = useState("");
		const [showValueLabel, setShowValueLabel] = useState(true);
		const [valueLabel, setvalueLabel] = useState({
			position: "top",
			fontSize: 8,
			distance: 8,
			family: "",
			rotate: 0,
			rotateLabelMinValue: 0,
			rotateLabelMaxValue: 360,
			color: "#000000",
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

		useEffect(() => {
			setValue(computedValue);
		}, [computedValue, data]);

		useEffect(() => {
			if (Object.hasOwn(data, "option")) {
				reInitializeFeatures(data.option);
			}
		}, [id]);

		useEffect(() => {
			if (Object.hasOwn(data, "option")) {
				retainLocalState(data.option);
			}
		}, [showValueLabel]);

		//Retain the local state of the feature on toggle switch and on reset button
		//With the local state we will be displaying the values in the fields
		const retainLocalState = (options) => {
			setvalueLabel((prev) => ({
				...prev,
				position: options.series[0].label.position,
				fontSize: options.series[0].label.fontSize,
				distance: options.series[0].label.distance,
				family: options.series[0].label.fontFamily,
				rotate: options.series[0].label.rotate,
			}));
		};
		//Reinitialize the feature when the chart is loaded
		const reInitializeFeatures = (options) => {
			setShowValueLabel(options.series[0].label.show ?? true);
		};

		function handleShowLabel(inputValue) {
			const option = JSON.parse(value);
			option.series[0].label.show = inputValue;
			setShowValueLabel(inputValue);
			setData(path, option as PathValue<D["data"], typeof path>);
		}

		//Handle the change event for any Value Label input
		function handleInputChange(input, inputValue) {
			const option = JSON.parse(value);
			option.series[0].label[input] = inputValue;
			setvalueLabel((prev) => ({
				...prev,
				[input]: inputValue,
			}));
			setData(path, option as PathValue<D["data"], typeof path>);
		}

		//Retain the local state of the feature on reset button
		//The default values are set in the reset object in the option
		function handleReset() {
			const option = JSON.parse(value);
			option.series[0].label.show = option.reset.label.show;
			option.series[0].label.position = option.reset.label.position;
			option.series[0].label.rotate = option.reset.label.rotate;
			option.series[0].label.fontSize = option.reset.label.fontSize;
			option.series[0].label.distance = option.reset.label.distance;
			option.series[0].label.fontFamily = option.reset.label.fontFamily;
			option.series[0].label.color = option.reset.label.color;
			setData(path, option as PathValue<D["data"], typeof path>);
			retainLocalState(option);
		}
		return (
			<StyledAxis>
				<StyledAxisDiv display="flex" gap="8px">
					<Switch
						size="small"
						checked={showValueLabel}
						onChange={(e: ChangeEvent<HTMLInputElement>) =>
							handleShowLabel(e.target.checked)
						}
						title="Show Value Label"
					/>

					<Typography variant="body2" color="primary">
						Show Value Label
					</Typography>
				</StyledAxisDiv>
				{showValueLabel && (
					<StyledAxisColDiv
						display="flex"
						justifyContent="space-around"
					>
						<Typography variant="body2" color="secondary">
							Choose a position for Value Label
						</Typography>
						<StyledSelect
							size="small"
							id="position"
							name="position"
							value={valueLabel?.position}
							onChange={(e) =>
								handleInputChange("position", e.target.value)
							}
						>
							<Select.Item key="-1" value="">
								Select
							</Select.Item>
							{Line_Alignment.map((label) => {
								return (
									<Select.Item value={label} key={label}>
										{label}
									</Select.Item>
								);
							})}
						</StyledSelect>
					</StyledAxisColDiv>
				)}
				{showValueLabel && (
					<StyledAxisColDiv
						display="flex"
						justifyContent="space-around"
					>
						<Typography variant="body2" color="secondary">
							Rotate Value Label:
						</Typography>

						<Typography variant="body2" color="secondary">
							Choose a position for Value Label
						</Typography>
						<Slider
							size="small"
							aria-label="Always visible"
							value={valueLabel.rotate}
							min={valueLabel.rotateLabelMinValue}
							max={valueLabel.rotateLabelMaxValue}
							valueLabelDisplay="on"
							onChange={(_event, newValue) =>
								handleInputChange("rotate", newValue)
							}
						/>
						<StyledAxisSpan
							display="flex"
							width="100%"
							justifyContent="space-between"
						>
							<span>{valueLabel.rotateLabelMinValue}</span>
							<span>{valueLabel.rotateLabelMaxValue}</span>
						</StyledAxisSpan>
					</StyledAxisColDiv>
				)}
				{showValueLabel && (
					<StyledAxisColDiv
						display="flex"
						justifyContent="space-around"
					>
						<Typography variant="body2" color="secondary">
							Value Label Size
						</Typography>
						<StyledTextField
							size="small"
							id="size"
							name="size"
							value={valueLabel?.fontSize}
							onChange={(e) =>
								handleInputChange("fontSize", e.target.value)
							}
						/>
					</StyledAxisColDiv>
				)}
				{showValueLabel && (
					<StyledAxisColDiv
						display="flex"
						justifyContent="space-around"
					>
						<Typography variant="body2" color="secondary">
							Value Label Line Length
						</Typography>
						<StyledTextField
							size="small"
							id="length"
							name="length"
							value={valueLabel?.distance}
							onChange={(e) =>
								handleInputChange(
									"distance",
									Number(e.target.value),
								)
							}
						/>
					</StyledAxisColDiv>
				)}
				{showValueLabel && (
					<StyledAxisColDiv
						display="flex"
						justifyContent="space-around"
					>
						<Typography variant="body2" color="secondary">
							Select Font Family
						</Typography>

						<StyledSelect
							size="small"
							id="font-family"
							name="fontFamily"
							value={valueLabel?.family}
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
				)}
				{showValueLabel && (
					<ColorPickerSettings
						id={id}
						path="option.series.0.label.color"
						colorValue={valueLabel.color}
						onChange={(e) => handleInputChange("color", e)}
					/>
				)}
				{showValueLabel && (
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
				)}
			</StyledAxis>
		);
	},
);
