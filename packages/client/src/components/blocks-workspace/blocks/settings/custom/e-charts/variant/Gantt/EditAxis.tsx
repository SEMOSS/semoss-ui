import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import type {
	BlockDef,
	EchartVisualizationBlockConfig,
	EchartVisualizationBlockDef,
	PathValue,
} from "@semoss/renderer";
import { Button, Input, Slider, Switch } from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks";

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
		const [axisDataUpdated, setAxisDataUpdated] = useState<
			"initial" | "updated"
		>("initial");

		const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

		// biome-ignore lint/suspicious/noExplicitAny: echart event type
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

		// biome-ignore lint/correctness/useExhaustiveDependencies: TODO
		useEffect(() => {
			if (axisDataUpdated === "updated") {
				updateChartData();
			}
		}, [JSON.stringify(axisState), axisDataUpdated]);

		const handleInputChange = (
			// biome-ignore lint/suspicious/noExplicitAny: echart event type
			e: React.ChangeEvent<HTMLInputElement> | any,
			key: keyof typeof INITIAL_AXIS_STATE,
			// biome-ignore lint/suspicious/noExplicitAny: echart event type
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

		return (
			<div className="flex flex-col">
				<div className="flex flex-row items-center gap-2 px-4 py-2">
					<Switch
						checked={axisState.showAxisTitle}
						onCheckedChange={(checked) =>
							handleInputChange(null, "showAxisTitle", checked)
						}
					/>
					<span className="text-sm">Show Axis Title</span>
				</div>

				{axisState.showAxisTitle && (
					<>
						<div className="flex flex-col gap-2 px-4 py-2">
							<span className="text-muted-foreground text-sm">
								Set Axis Title
							</span>
							<Input
								value={axisState.axistitle}
								onChange={(e) =>
									handleInputChange(e, "axistitle")
								}
							/>
						</div>

						<div className="flex flex-col gap-2 px-4 py-2">
							<span className="text-muted-foreground text-sm">
								Axis Title Font Size
							</span>
							<Input
								type="number"
								value={axisState.axisTitleFontSize}
								onChange={(e) =>
									handleInputChange(e, "axisTitleFontSize")
								}
							/>
						</div>
					</>
				)}

				<div className="flex flex-col gap-2 px-4 py-2">
					<span className="text-muted-foreground text-sm">
						Label Font Size
					</span>
					<Input
						type="number"
						value={axisState.labelFontSize}
						onChange={(e) => handleInputChange(e, "labelFontSize")}
					/>
				</div>

				{axisType === "y" && (
					<div className="flex flex-col gap-2 px-4 py-2">
						<span className="text-muted-foreground text-sm">
							Truncate Characters Length
						</span>
						<Input
							type="number"
							value={axisState.truncateCharCount}
							onChange={(e) =>
								handleInputChange(e, "truncateCharCount")
							}
						/>
					</div>
				)}

				<div className="flex flex-col gap-2 px-4 py-2">
					<span className="text-sm">
						Rotate {upperCaseAxisType}-Axis Labels
					</span>
					<Slider
						value={[axisState.rotate]}
						min={0}
						max={360}
						onValueChange={(v: number[]) =>
							handleInputChange(null, "rotate", v[0])
						}
					/>
					<div className="flex justify-between">
						<span>0</span>
						<span>360</span>
					</div>
				</div>

				<div className="flex justify-end px-4 py-2">
					<Button onClick={resetToInitialState}>Reset</Button>
				</div>
			</div>
		);
	},
);
