import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import {
	type BlockDef,
	type EchartVisualizationBlockConfig,
	type EchartVisualizationBlockDef,
	getValueByPath,
	type PathValue,
} from "@semoss/renderer";
import {
	Button,
	Slider,
	Switch,
	styled,
	TextField,
	Typography,
} from "@semoss/ui";
import { useBlockSettings } from "@/hooks";

//Axis div for switch type fields
const StyledAxisDiv = styled("div")<{
	display?: string;
	justifyContent?: string;
	gap?: string;
}>(({ theme, display, justifyContent, gap }) => ({
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
}>(({ theme, display, justifyContent }) => ({
	display: display ?? undefined,
	justifyContent: justifyContent ?? undefined,
	flexDirection: "row",
}));

//Axis div for input type fields with label
const StyledAxisColDiv = styled("div")<{
	display?: string;
	justifyContent: string;
}>(({ theme, display, justifyContent }) => ({
	display: display ?? undefined,
	justifyContent: justifyContent ?? undefined,
	flexDirection: "column",
	padding: "8px 16px",
	gap: "8px",
}));

//Axis div for span type elements
const StyledAxisSpan = styled("span")<{
	display?: string;
	justifyContent?: string;
	width?: string;
}>(({ display, justifyContent, width }) => ({
	display: display ?? undefined,
	justifyContent: justifyContent ?? undefined,
	width: width ?? undefined,
}));

//text field styling to have 100% width
const StyledTextField = styled(TextField)(({ theme }) => ({
	width: "100%",
}));

const StyledTypography = styled(Typography)(({ theme }) => ({
	color: theme.palette.text.primary,
}));

// Initial axis state
const INITIAL_AXIS_STATE = {
	axistitle: "",
	showAxisTitle: true,
	axisTitleFontSize: 18,
	labelFontSize: 12,
	rotate: 0,
	rotateLabelMinValue: 0,
	rotateLabelMaxValue: 360,
	showAxisZoom: true,
	truncateCharCount: 0,
};

export const EditAxis = observer(
	<D extends BlockDef = BlockDef>({ id, path, axis: axisType }) => {
		const axis = `${axisType}Axis`;
		const upperCaseAxisType = axisType.toUpperCase();
		const { data, setData } =
			useBlockSettings<EchartVisualizationBlockDef>(id);
		const option = data.option;

		// State
		const [axisState, setAxisState] = useState(INITIAL_AXIS_STATE);
		const [axisDataUpdated, setAxisDataUpdated] = useState<
			"initial" | "updated"
		>("initial");
		const [value, setValue] = useState(data.option);
		const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

		// Get chart config value by path
		const computedValue = useMemo(() => {
			return computed(() => {
				if (!data) return "";
				const v = getValueByPath(data, path);
				if (typeof v === "undefined") return "";
				if (typeof v === "string") return v;
				return JSON.stringify(v, null, 2);
			});
		}, [data, path]).get();

		// Sync value from computedValue
		useEffect(() => {
			setValue(JSON.parse(computedValue));
		}, [computedValue]);

		// Initialize axis state from option
		useEffect(() => {
			const axisStateData = { ...INITIAL_AXIS_STATE };
			if (option[axis]) {
				axisStateData.axistitle =
					option[axis].axisName ?? option[axis].name ?? "";
				axisStateData.showAxisTitle =
					option[axis].showAxisName ??
					INITIAL_AXIS_STATE.showAxisTitle;
				if (option[axis].axisLabel) {
					axisStateData.labelFontSize =
						option[axis].axisLabel.fontSize ?? 12;
					axisStateData.axisTitleFontSize =
						option[axis].nameTextStyle?.fontSize ?? 12;
					axisStateData.rotate = option[axis].axisLabel.rotate ?? 0;
					axisStateData.truncateCharCount =
						option[axis].axisLabel.truncateCharCount ?? 0;
				}
				if (option.dataZoom) {
					const axisPosition = option.dataZoom.findIndex(
						(opt) => opt.axisIndex !== undefined,
					);
					if (axisPosition > -1) {
						axisStateData.showAxisZoom =
							option.dataZoom[axisPosition]?.show ?? false;
					}
				}
			}
			setAxisState((prevState) => ({ ...prevState, ...axisStateData }));
		}, [axis]);

		// Update chart data when axisState changes
		useEffect(() => {
			if (axisDataUpdated === "updated") {
				updateChartData();
			}
		}, [axisState]);

		// Reset axis state
		const resetToInitialState = () => {
			option[axis].name = "";
			option[axis].axisName = "";
			setAxisState(INITIAL_AXIS_STATE);
		};

		// Update chart data in parent state
		const runStateUpdateCustom = (
			optionUpdated: typeof EchartVisualizationBlockConfig.data.option,
		) => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
			}
			timeoutRef.current = setTimeout(() => {
				try {
					setData(
						"option",
						optionUpdated as PathValue<D["data"], typeof path>,
					);
				} catch (e) {
					console.log(e);
				}
			}, 300);
		};

		// Update chart data when axis fields change
		const updateChartData = () => {
			const axisData = {
				showAxisTitle: axisState.showAxisTitle,
				axistitle: axisState.axistitle,
				axisTitleFontSize: axisState.axisTitleFontSize,
				labelFontSize: axisState.labelFontSize,
				rotate: axisState.rotate,
				truncateCharCount: axisState.truncateCharCount,
			};
			const optionObj =
				typeof value === "string" ? JSON.parse(value) : value;
			const axisLabel = optionObj[axis]?.axisLabel ?? {};
			if (optionObj[axis]) {
				if (axisData.showAxisTitle) {
					optionObj[axis].name = axisData.axistitle;
					optionObj[axis].axisName = optionObj[axis].name;
					optionObj[axis].showAxisName = true;
					optionObj[axis].nameTextStyle = {
						...optionObj[axis].nameTextStyle,
						fontSize:
							Number(axisData.axisTitleFontSize) || undefined,
					};
				} else {
					optionObj[axis].axisName = optionObj[axis].name;
					optionObj[axis].showAxisName = false;
					optionObj[axis].name = "";
				}
				axisLabel.fontSize =
					Number(axisData.labelFontSize) || undefined;
				axisLabel.rotate = axisData.rotate;
				axisLabel.truncateCharCount = axisData.truncateCharCount;
				axisLabel.show = axisLabel?.show ?? true;

				runStateUpdateCustom({
					...optionObj,
					[axis]: {
						...optionObj[axis],
						axisLabel: {
							...optionObj[axis].axisLabel,
							...axisLabel,
						},
					},
					customSettings: {
						...optionObj.customSettings,
						toolsUpdated: true,
					},
				});
			}
		};

		// Handle input changes
		const handleInputChange = (e, title, directVal = undefined) => {
			if (axisDataUpdated === "initial") setAxisDataUpdated("updated");
			const newValue =
				directVal !== undefined ? directVal : e.target.value;
			setAxisState((prevAxisState) => ({
				...prevAxisState,
				[title]: newValue,
			}));
		};

		// Helper renderers
		const renderAxisTitle = () =>
			axisState.showAxisTitle && (
				<StyledAxisColDiv display="flex" justifyContent="flex-start">
					<Typography variant="body2" color="secondary">
						Set Axis Title
					</Typography>
					<StyledTextField
						size="small"
						id={`${axis}-title`}
						data-testid={`${axis}-title`}
						value={axisState.axistitle}
						onChange={(e) => handleInputChange(e, "axistitle")}
					/>
				</StyledAxisColDiv>
			);

		const renderAxisTitleFontSize = () =>
			axisState.showAxisTitle && (
				<StyledAxisColDiv display="flex" justifyContent="space-around">
					<Typography variant="body2" color="secondary">
						Edit Axis Title Font Size
					</Typography>
					<TextField
						size="small"
						id={`${axis}_TitleFontSizeField`}
						data-testid={`${axis}_TitleFontSizeField`}
						type="number"
						value={axisState.axisTitleFontSize}
						onChange={(e) =>
							handleInputChange(e, "axisTitleFontSize")
						}
					/>
				</StyledAxisColDiv>
			);

		const renderLabelFontSize = () => (
			<StyledAxisColDiv display="flex" justifyContent="space-around">
				<Typography variant="body2" color="secondary">
					Edit Label Font Size:
				</Typography>
				<StyledTextField
					size="small"
					id={`${axis}_LabelFontSizeField`}
					data-testid={`${axis}_LabelFontSizeField`}
					value={axisState.labelFontSize}
					type="number"
					onChange={(e) => handleInputChange(e, "labelFontSize")}
				/>
			</StyledAxisColDiv>
		);

		const renderTruncateCharCount = () =>
			axisType === "y" && (
				<StyledAxisColDiv display="flex" justifyContent="space-around">
					<Typography variant="body2" color="secondary">
						Truncate Characters Length:
					</Typography>
					<StyledTextField
						size="small"
						id={`${axis}_truncateCharCountField`}
						data-testid={`${axis}_truncateCharCountField`}
						value={axisState.truncateCharCount}
						type="number"
						onChange={(e) =>
							handleInputChange(e, "truncateCharCount")
						}
					/>
				</StyledAxisColDiv>
			);

		const renderRotateSlider = () => (
			<StyledAxisColDiv display="flex" justifyContent="space-between">
				<Typography variant="body2">
					Rotate {upperCaseAxisType}-Axis Values:
				</Typography>
				<Slider
					size="small"
					aria-label="Always visible"
					value={axisState.rotate}
					min={axisState.rotateLabelMinValue}
					max={axisState.rotateLabelMaxValue}
					valueLabelDisplay="on"
					onChange={(event, newValue) =>
						handleInputChange(event, "rotate", newValue)
					}
				/>
				<StyledAxisSpan
					display="flex"
					width="100%"
					justifyContent="space-between"
				>
					<span>{axisState.rotateLabelMinValue}</span>
					<span>{axisState.rotateLabelMaxValue}</span>
				</StyledAxisSpan>
			</StyledAxisColDiv>
		);

		return (
			<StyledAxis>
				<StyledAxisDiv>
					<Switch
						size="small"
						checked={axisState.showAxisTitle}
						onChange={(e: ChangeEvent<HTMLInputElement>) =>
							handleInputChange(
								e,
								"showAxisTitle",
								e.target.checked,
							)
						}
						title="Show Axis Title"
					/>
					<StyledTypography variant="body2">
						Show Axis Title
					</StyledTypography>
				</StyledAxisDiv>
				{renderAxisTitle()}
				{renderAxisTitleFontSize()}
				{renderLabelFontSize()}
				{renderTruncateCharCount()}
				{renderRotateSlider()}
				<StyledAxisDiv display="flex" justifyContent="end">
					<Button
						color="primary"
						variant="contained"
						onClick={resetToInitialState}
					>
						Reset
					</Button>
				</StyledAxisDiv>
			</StyledAxis>
		);
	},
);
