import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Block, BlockDef, Paths, PathValue } from "@semoss/renderer";
import { getValueByPath } from "@semoss/renderer";
import {
	Button,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks";

interface CloudSettingsProps<D extends BlockDef = BlockDef> {
	id: string;
	path: Paths<Block<D>["data"], 4>;
}

export const CloudSettings = observer(
	<D extends BlockDef = BlockDef>({ id, path }: CloudSettingsProps<D>) => {
		const { data, setData } = useBlockSettings<D>(id);
		const [detail, setDetail] = useState({
			rotationMin: -90,
			rotationMax: 90,
			rotationStep: 45,
			shape: "pentagon",
		});

		// Track initialization to prevent unnecessary updates
		const isInitialized = useRef(false);

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

		const retainLocalState = useCallback(
			(options: Record<string, unknown>) => {
				if (
					options?.series?.[0]?.rotationRange ||
					options?.series?.[0]?.rotationStep ||
					options?.series?.[0]?.shape
				) {
					const seriesConfig = options.series[0];

					setDetail({
						rotationMin: seriesConfig.rotationRange?.[0] || -90,
						rotationMax: seriesConfig.rotationRange?.[1] || 90,
						rotationStep: seriesConfig.rotationStep || 45,
						shape: seriesConfig.shape || "circle",
					});
				}
			},
			[],
		);

		useEffect(() => {
			if (!data || !Object.hasOwn(data, "option")) {
				return;
			}

			const option = JSON.parse(computedValue);

			const needsInitialization =
				!isInitialized.current || !option.series?.[0];

			if (needsInitialization) {
				if (!option.series || !option.series[0]) {
					const updatedOption = { ...option };
					if (!updatedOption.series) updatedOption.series = [{}];
					if (!updatedOption.series[0]) updatedOption.series[0] = {};

					updatedOption.series[0] = {
						...updatedOption.series[0],
						rotationRange: updatedOption.series[0]
							.rotationRange || [-90, 90],
						rotationStep:
							updatedOption.series[0].rotationStep || 45,
						shape: updatedOption.series[0].shape || "pentagon",
					};

					setData(
						path,
						updatedOption as PathValue<D["data"], typeof path>,
					);
				}
				retainLocalState(option);
				isInitialized.current = true;
			}
		}, [data, computedValue, path, setData, retainLocalState]);

		const handleInputChange = useCallback(
			(inputType: string, inputValue: string | number | boolean) => {
				const option = JSON.parse(computedValue);

				if (!option.series || !option.series[0]) {
					return;
				}

				if (inputType === "rotationMin") {
					const numValue = Number(inputValue);
					const currentMax =
						option.series[0].rotationRange?.[1] ?? 90;
					option.series[0].rotationRange = [numValue, currentMax];
					setDetail((prev) => ({
						...prev,
						rotationMin: numValue,
					}));
				} else if (inputType === "rotationMax") {
					const numValue = Number(inputValue);
					const currentMin =
						option.series[0].rotationRange?.[0] ?? -90;
					option.series[0].rotationRange = [currentMin, numValue];
					setDetail((prev) => ({
						...prev,
						rotationMax: numValue,
					}));
				} else if (inputType === "rotationStep") {
					const numValue = Number(inputValue);
					option.series[0].rotationStep = numValue;
					setDetail((prev) => ({
						...prev,
						rotationStep: numValue,
					}));
				} else if (inputType === "shape") {
					const strValue = String(inputValue);
					option.series[0].shape = strValue;
					setDetail((prev) => ({
						...prev,
						shape: strValue,
					}));
				}

				setData(path, option as PathValue<D["data"], typeof path>);
			},
			[computedValue, path, setData],
		);

		const handleReset = useCallback(() => {
			const option = JSON.parse(computedValue);

			option.series[0].rotationRange = [-90, 90];
			option.series[0].rotationStep = 45;
			option.series[0].shape = "pentagon";

			setData(path, option as PathValue<D["data"], typeof path>);

			retainLocalState(option);
		}, [computedValue, path, setData, retainLocalState]);

		return (
			<div className="flex flex-col">
				<div className="mb-2 flex flex-col gap-2 px-4 py-2">
					<span className="text-muted-foreground text-sm">
						Rotation Min (degrees)
					</span>
					<Input
						id={`CloudRotationMin-${id}`}
						name="rotationMin"
						type="number"
						value={detail?.rotationMin}
						onChange={(e) =>
							handleInputChange("rotationMin", e.target.value)
						}
						placeholder="-90"
					/>
				</div>

				<div className="mb-2 flex flex-col gap-2 px-4 py-2">
					<span className="text-muted-foreground text-sm">
						Rotation Max (degrees)
					</span>
					<Input
						id={`CloudRotationMax-${id}`}
						name="rotationMax"
						type="number"
						value={detail?.rotationMax}
						onChange={(e) =>
							handleInputChange("rotationMax", e.target.value)
						}
						placeholder="90"
					/>
				</div>

				<div className="mb-2 flex flex-col gap-2 px-4 py-2">
					<span className="text-muted-foreground text-sm">
						Rotation Step (degrees)
					</span>
					<Input
						id={`CloudRotationStep-${id}`}
						name="rotationStep"
						type="number"
						value={detail?.rotationStep}
						onChange={(e) =>
							handleInputChange("rotationStep", e.target.value)
						}
						placeholder="45"
					/>
				</div>

				<div className="mb-2 flex flex-col gap-2 px-4 py-2">
					<span className="text-muted-foreground text-sm">
						Word Cloud Shape
					</span>
					<Select
						value={detail?.shape}
						onValueChange={(val) => handleInputChange("shape", val)}
					>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="Select" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="circle">Circle</SelectItem>
							<SelectItem value="cardioid">
								Heart Shape
							</SelectItem>
							<SelectItem value="diamond">Diamond</SelectItem>
							<SelectItem value="triangle-forward">
								Triangle Forward
							</SelectItem>
							<SelectItem value="triangle">Triangle</SelectItem>
							<SelectItem value="pentagon">Pentagon</SelectItem>
							<SelectItem value="star">Star</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div className="mb-2 flex flex-col gap-2 px-4 py-2">
					<Button onClick={handleReset}>Reset Settings</Button>
				</div>
			</div>
		);
	},
);

export default CloudSettings;
