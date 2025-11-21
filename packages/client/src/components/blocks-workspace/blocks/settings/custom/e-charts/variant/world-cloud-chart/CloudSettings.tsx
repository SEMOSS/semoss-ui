import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Block, BlockDef, Paths, PathValue } from "@semoss/renderer";
import { getValueByPath } from "@semoss/renderer";
import { Button, Select, styled, TextField, Typography } from "@semoss/ui";
import { useBlockSettings } from "@/hooks";

interface CloudSettingsProps<D extends BlockDef = BlockDef> {
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

		/**
		 * Retains the local state of the word cloud settings on reset button
		 * With the local state we will be displaying the values in the fields
		 */
		const retainLocalState = useCallback(
			(options: Record<string, unknown>) => {
				if (
					options?.series?.[0]?.rotationRange ||
					options?.series?.[0]?.rotationStep ||
					options?.series?.[0]?.shape
				) {
					const seriesConfig = options.series[0];

					setDetail({
						// Retain rotation settings
						rotationMin: seriesConfig.rotationRange?.[0] || -90,
						rotationMax: seriesConfig.rotationRange?.[1] || 90,
						rotationStep: seriesConfig.rotationStep || 45,
						// Retain the shape
						shape: seriesConfig.shape || "circle",
					});
				}
			},
			[],
		);
		// Initialize the word cloud settings on first load
		useEffect(() => {
			if (!data || !Object.hasOwn(data, "option")) {
				return;
			}

			const option = JSON.parse(computedValue);

			// Only run initialization logic if this is the first time or option is missing series structure
			const needsInitialization =
				!isInitialized.current || !option.series?.[0];

			if (needsInitialization) {
				// Ensure the series structure exists with default values
				if (!option.series || !option.series[0]) {
					const updatedOption = { ...option };
					if (!updatedOption.series) updatedOption.series = [{}];
					if (!updatedOption.series[0]) updatedOption.series[0] = {};

					// Set default word cloud values
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

		/**
		 * Handle the change event for any Word Cloud setting input
		 * @param inputType - name of the input field
		 * @param inputValue - value of the input field
		 */
		const handleInputChange = useCallback(
			(inputType: string, inputValue: string | number | boolean) => {
				const option = JSON.parse(computedValue);

				// Ensure series structure exists
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

				// Update the data with the new option
				setData(path, option as PathValue<D["data"], typeof path>);
			},
			[computedValue, path, setData],
		);

		/**
		 * Resets the word cloud settings to their default values.
		 * Default values are defined in the 'reset' object of the option.
		 */
		const handleReset = useCallback(() => {
			const option = JSON.parse(computedValue);

			// Reset to default word cloud values from VisualMapConstant
			option.series[0].rotationRange = [-90, 90];
			option.series[0].rotationStep = 45;
			option.series[0].shape = "pentagon";

			// Update the data with the reset option
			setData(path, option as PathValue<D["data"], typeof path>);

			// Retain the local state with the updated option
			retainLocalState(option);
		}, [computedValue, path, setData, retainLocalState]);

		return (
			<StyledAxis>
				<StyledAxisColDiv display="flex" justifyContent="space-around">
					<Typography variant="body2" color="secondary">
						Rotation Min (degrees)
					</Typography>
					<StyledTextField
						size="small"
						id={`CloudRotationMin-${id}`}
						name="rotationMin"
						type="number"
						value={detail?.rotationMin}
						onChange={(e) =>
							handleInputChange("rotationMin", e.target.value)
						}
						placeholder="-90"
					/>
				</StyledAxisColDiv>

				<StyledAxisColDiv display="flex" justifyContent="space-around">
					<Typography variant="body2" color="secondary">
						Rotation Max (degrees)
					</Typography>
					<StyledTextField
						size="small"
						id={`CloudRotationMax-${id}`}
						name="rotationMax"
						type="number"
						value={detail?.rotationMax}
						onChange={(e) =>
							handleInputChange("rotationMax", e.target.value)
						}
						placeholder="90"
					/>
				</StyledAxisColDiv>

				<StyledAxisColDiv display="flex" justifyContent="space-around">
					<Typography variant="body2" color="secondary">
						Rotation Step (degrees)
					</Typography>
					<StyledTextField
						size="small"
						id={`CloudRotationStep-${id}`}
						name="rotationStep"
						type="number"
						value={detail?.rotationStep}
						onChange={(e) =>
							handleInputChange("rotationStep", e.target.value)
						}
						placeholder="45"
						inputProps={{ min: 1, max: 90 }}
					/>
				</StyledAxisColDiv>

				<StyledAxisColDiv display="flex" justifyContent="space-around">
					<Typography variant="body2" color="secondary">
						Word Cloud Shape
					</Typography>
					<StyledSelect
						size="small"
						id={`CloudShape-${id}`}
						name="shape"
						value={detail?.shape}
						onChange={(e) =>
							handleInputChange("shape", e.target.value)
						}
					>
						<Select.Item value="circle">Circle</Select.Item>
						<Select.Item value="cardioid">Heart Shape</Select.Item>
						<Select.Item value="diamond">Diamond</Select.Item>
						<Select.Item value="triangle-forward">
							Triangle Forward
						</Select.Item>
						<Select.Item value="triangle">Triangle</Select.Item>
						<Select.Item value="pentagon">Pentagon</Select.Item>
						<Select.Item value="star">Star</Select.Item>
					</StyledSelect>
				</StyledAxisColDiv>

				<StyledAxisColDiv display="flex" justifyContent="space-around">
					<Button
						variant="contained"
						size="small"
						color="primary"
						onClick={handleReset}
					>
						Reset Settings
					</Button>
				</StyledAxisColDiv>
			</StyledAxis>
		);
	},
);

export default CloudSettings;
