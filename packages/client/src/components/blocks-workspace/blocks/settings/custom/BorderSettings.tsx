import { FormatColorFill } from "@mui/icons-material";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useRef, useState } from "react";
import { SketchPicker } from "react-color";
import {
	type Block,
	type BlockDef,
	getValueByPath,
	type Paths,
	type PathValue,
} from "@semoss/renderer";
import {
	Box,
	ClickAwayListener,
	IconButton,
	Menu,
	Select,
	TextField,
	ToggleButton,
	ToggleButtonGroup,
	Typography,
} from "@semoss/ui";
import { useBlockSettings } from "@/hooks";
import { BaseSettingSection } from "../BaseSettingSection";

/**
 * BorderSettings is its own component because multiple inputs point to the same style path
 * This is done to easily turn on/off all the border properties at once for better UX
 */

interface BorderSettingsProps<D extends BlockDef = BlockDef> {
	/**
	 * Id of the block that is being worked with
	 */
	id: string;
	/**
	 * Path to update
	 */
	path: Paths<Block<D>["data"], 4>;
}

const SIZE_VALUE_TYPES = ["em", "px", "%"];

export const BorderSettings = observer(
	<D extends BlockDef = BlockDef>({ id, path }: BorderSettingsProps<D>) => {
		const { data, setData } = useBlockSettings(id);

		// track the value
		const [borderSizeValue, setBorderSizeValue] = useState(null);
		const [borderStyleValue, setBorderStyleValue] = useState(null);
		const [borderColorValue, setBorderColorValue] = useState("#FFFFFF");
		// track the unit of the value, ex % or px
		const [valueType, setValueType] = useState(null);
		const [showPicker, setShowPicker] = useState(false);
		// track the ref to debounce the input
		const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
		// get the value of the input (wrapped in usememo because of path prop)
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
				return JSON.stringify(v);
			});
		}, [data, path]).get();

		// update the value whenever the computed one changes
		useEffect(() => {
			const borderValues = computedValue.split(" ");
			if (borderValues.length === 3) {
				setBorderSizeValue(borderValues[0]);
				setBorderStyleValue(borderValues[1]);
				setBorderColorValue(borderValues[2]);
			} else {
				setBorderSizeValue(null);
				setBorderStyleValue(null);
				setBorderColorValue(null);
			}
			if (computedValue.includes("%")) {
				setValueType("%");
			} else if (computedValue.includes("px")) {
				setValueType("px");
			} else if (computedValue.includes("em")) {
				setValueType("em");
			}
		}, [computedValue]);

		/**
		 * Sync the data on change
		 */
		const onChange = (
			borderSize: string,
			borderStyle: string,
			borderColor: string,
		) => {
			// set the values
			setBorderSizeValue(borderSize ?? "0px");
			setBorderStyleValue(borderStyle ?? "solid");
			setBorderColorValue(borderColor ?? "#FFFFFF");
			// clear out the old timeout
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
			}

			timeoutRef.current = setTimeout(() => {
				try {
					// set the value
					setData(
						path,
						`${borderSize} ${borderStyle} ${borderColor}` as PathValue<
							D["data"],
							typeof path
						>,
					);
				} catch (e) {
					console.log(e);
				}
			}, 300);
		};

		// numeric value for the text field
		const numericSizeValue = useMemo(() => {
			if (borderSizeValue) {
				return borderSizeValue.replace(/\D+/g, "");
			}
		}, [borderSizeValue]);

		// update data when unit changes
		useMemo(() => {
			if (numericSizeValue) {
				onChange(
					`${numericSizeValue}${valueType}`,
					borderStyleValue ?? "solid",
					borderColorValue ?? "#FFFFFF",
				);
			}
		}, [valueType]);

		// default value type % if one is not set when the value is set
		// remove type when value is unset
		useMemo(() => {
			if (numericSizeValue && !valueType) {
				setValueType("px");
			} else if (!numericSizeValue) {
				setValueType("");
			}
		}, [numericSizeValue]);

		const getColorForButtonValue = (
			buttonValue: string,
		): "primary" | undefined => {
			return valueType === buttonValue ? "primary" : undefined;
		};

		return (
			<>
				<BaseSettingSection label="Border Size">
					<TextField
						fullWidth
						value={numericSizeValue ?? ""}
						onChange={(e) => {
							// sync the data on change
							if (e.target.value) {
								onChange(
									`${e.target.value}${valueType}`,
									borderStyleValue ?? "solid",
									borderColorValue ?? "#FFFFFF",
								);
							} else {
								onChange("", "", "");
							}
						}}
						size="small"
						variant="outlined"
						autoComplete="off"
					/>
					<ToggleButtonGroup value={valueType} exclusive size="small">
						{Array.from(
							SIZE_VALUE_TYPES,
							(buttonValueType: string) => {
								return (
									<ToggleButton
										key={buttonValueType}
										value={buttonValueType}
										color={getColorForButtonValue(
											buttonValueType,
										)}
										onClick={() =>
											setValueType(buttonValueType)
										}
									>
										{buttonValueType}
									</ToggleButton>
								);
							},
						)}
					</ToggleButtonGroup>
				</BaseSettingSection>
				<BaseSettingSection label="Border Style">
					<Select
						fullWidth
						size="small"
						value={borderStyleValue ?? ""}
						onChange={(e) => {
							if (e.target.value) {
								onChange(
									borderSizeValue ?? "0px",
									e.target.value,
									borderColorValue ?? "#FFFFFF",
								);
							} else {
								onChange("", "", "");
							}
						}}
					>
						<Menu.Item value={""}>
							<em>None</em>
						</Menu.Item>
						<Menu.Item value={"solid"}>Solid</Menu.Item>
						<Menu.Item value={"dashed"}>Dashed</Menu.Item>
						<Menu.Item value={"dotted"}>Dotted</Menu.Item>
					</Select>
				</BaseSettingSection>
				<Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
					<Typography variant="body2" color="black">
						Border Color
					</Typography>
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							gap: 1,
							justifyContent: "space-between",
						}}
					>
						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								gap: 3,
							}}
						>
							<Box
								sx={{
									width: 33,
									height: 33,
									borderRadius: "4px",
									backgroundColor:
										borderColorValue ?? "#FFFFFF",
									border: "1px solid #ccc",
								}}
							/>
							<Typography variant="body2" color="textPrimary">
								{borderColorValue ?? "#FFFFFF"}
							</Typography>
						</Box>
						<IconButton onClick={() => setShowPicker(!showPicker)}>
							<FormatColorFill />
						</IconButton>
					</Box>

					{showPicker && (
						<ClickAwayListener
							onClickAway={() => setShowPicker(false)}
						>
							<Box
								sx={{
									display: "flex",
									justifyContent: "flex-end",
									mt: 1,
								}}
							>
								<Box sx={{ borderRadius: 1 }}>
									<SketchPicker
										color={borderColorValue ?? "#FFFFFF"}
										onChange={(color) => {
											onChange(
												borderSizeValue ?? "0px",
												borderStyleValue ?? "solid",
												color.hex ?? "#FFFFFF",
											);
										}}
										width="90%"
									/>
								</Box>
							</Box>
						</ClickAwayListener>
					)}
				</Box>
			</>
		);
	},
);
