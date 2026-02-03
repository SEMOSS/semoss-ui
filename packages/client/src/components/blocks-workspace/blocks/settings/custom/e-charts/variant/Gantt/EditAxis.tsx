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

const StyledAxisDiv = styled("div")({
	display: "flex",
	padding: "8px 16px",
	alignItems: "center",
	gap: "8px",
});

const StyledAxis = styled("div")({
	display: "flex",
	flexDirection: "column",
});

const StyledAxisColDiv = styled("div")({
	display: "flex",
	flexDirection: "column",
	padding: "8px 16px",
	gap: "8px",
});

const StyledAxisSpan = styled("span")({
	display: "flex",
	justifyContent: "space-between",
	width: "100%",
});

const StyledTextField = styled(TextField)({
	width: "100%",
});

const StyledTypography = styled(Typography)({});

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

		const [axisState, setAxisState] = useState(INITIAL_AXIS_STATE);
		const [axisDataUpdated, setAxisDataUpdated] =
			useState<"initial" | "updated">("initial");

		const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

		const buildAxisTitleGraphic = (optionObj: any) => {
			const existing = (optionObj.graphic ?? []).filter(
				(g) => g.__axisTitle !== axisType,
			);

			if (!axisState.showAxisTitle || !axisState.axistitle) {
				return existing;
			}

			if (axisType === "x") {
				existing.push({
					type: "text",
					__axisTitle: "x",
					left: "50%",
					bottom: 20,
					z: 100,
					style: {
						text: axisState.axistitle,
						fontSize: Number(axisState.axisTitleFontSize) || 12,
						fill: "#000",
						align: "center",
					},
				});
			}

			if (axisType === "y") {
				existing.push({
					type: "text",
					__axisTitle: "y",
					left: 20,
					top: "50%",
					rotation: -140,
					z: 100,
					style: {
						text: axisState.axistitle,
						fontSize: Number(axisState.axisTitleFontSize) || 12,
						fill: "#000",
						align: "center",
					},
				});
			}

			return existing;
		};

		const runStateUpdateCustom = (
			optionUpdated: typeof EchartVisualizationBlockConfig.data.option,
		) => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}

			timeoutRef.current = setTimeout(() => {
				setData(
					"option",
					optionUpdated as PathValue<D["data"], typeof path>,
				);
			}, 300);
		};

		const updateChartData = () => {
			if (!option?.[axis]) return;
		
			const optionObj = {
				...option,
				[axis]: {
					...option[axis],
					axisLabel: {
						...(option[axis]?.axisLabel ?? {}),
					},
				},
				graphic: [...(option.graphic ?? [])],
			};
		
			const updatedGraphics = buildAxisTitleGraphic(optionObj);
		
			runStateUpdateCustom({
				...optionObj,
				[axis]: {
					...optionObj[axis],
					axisLabel: {
						...optionObj[axis].axisLabel,
						fontSize: Number(axisState.labelFontSize) || undefined,
						rotate: axisState.rotate,
						truncateCharCount: axisState.truncateCharCount,
						show: optionObj[axis].axisLabel?.show ?? true,
					},
				},
				graphic: updatedGraphics,
				customSettings: {
					...optionObj.customSettings,
					toolsUpdated: true,
				},
			});
		};

		useEffect(() => {
			if (axisDataUpdated === "updated") {
				updateChartData();
			}
		}, [JSON.stringify(axisState), axisDataUpdated]);

		/* ---------------- handlers ---------------- */

		const handleInputChange = (
			e: ChangeEvent<HTMLInputElement> | any,
			key: keyof typeof INITIAL_AXIS_STATE,
			directVal?: any,
		) => {
			if (axisDataUpdated === "initial") {
				setAxisDataUpdated("updated");
			}

			setAxisState((prev) => ({
				...prev,
				[key]: directVal ?? e.target.value,
			}));
		};

		const resetToInitialState = () => {
			setAxisState(INITIAL_AXIS_STATE);
			setAxisDataUpdated("updated");
		};

		/* ---------------- render ---------------- */

		return (
			<StyledAxis>
				<StyledAxisDiv>
					<Switch
						size="small"
						checked={axisState.showAxisTitle}
						onChange={(e) =>
							handleInputChange(
								e,
								"showAxisTitle",
								e.target.checked,
							)
						}
					/>
					<StyledTypography variant="body2">
						Show Axis Title
					</StyledTypography>
				</StyledAxisDiv>

				{axisState.showAxisTitle && (
					<>
						<StyledAxisColDiv>
							<Typography variant="body2" color="secondary">
								Set Axis Title
							</Typography>
							<StyledTextField
								size="small"
								value={axisState.axistitle}
								onChange={(e) =>
									handleInputChange(e, "axistitle")
								}
							/>
						</StyledAxisColDiv>

						<StyledAxisColDiv>
							<Typography variant="body2" color="secondary">
								Axis Title Font Size
							</Typography>
							<TextField
								size="small"
								type="number"
								value={axisState.axisTitleFontSize}
								onChange={(e) =>
									handleInputChange(
										e,
										"axisTitleFontSize",
									)
								}
							/>
						</StyledAxisColDiv>
					</>
				)}

				<StyledAxisColDiv>
					<Typography variant="body2" color="secondary">
						Label Font Size
					</Typography>
					<StyledTextField
						size="small"
						type="number"
						value={axisState.labelFontSize}
						onChange={(e) =>
							handleInputChange(e, "labelFontSize")
						}
					/>
				</StyledAxisColDiv>

				{axisType === "y" && (
					<StyledAxisColDiv>
						<Typography variant="body2" color="secondary">
							Truncate Characters Length
						</Typography>
						<StyledTextField
							size="small"
							type="number"
							value={axisState.truncateCharCount}
							onChange={(e) =>
								handleInputChange(e, "truncateCharCount")
							}
						/>
					</StyledAxisColDiv>
				)}

				<StyledAxisColDiv>
					<Typography variant="body2">
						Rotate {upperCaseAxisType}-Axis Labels
					</Typography>
					<Slider
						size="small"
						value={axisState.rotate}
						min={0}
						max={360}
						valueLabelDisplay="on"
						onChange={(e, v) =>
							handleInputChange(e, "rotate", v)
						}
					/>
					<StyledAxisSpan>
						<span>0</span>
						<span>360</span>
					</StyledAxisSpan>
				</StyledAxisColDiv>

				<StyledAxisDiv style={{ justifyContent: "flex-end" }}>
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
