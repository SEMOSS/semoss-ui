import { PaintBucket } from "lucide-react";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	type Block,
	type BlockDef,
	getValueByPath,
	type Paths,
	type PathValue,
} from "@semoss/renderer";
import {
	Button,
	Input,
	Muted,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	ToggleGroup,
	ToggleGroupItem,
} from "@semoss/ui/next";
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
		const [borderSizeValue, setBorderSizeValue] = useState<string | null>(
			null,
		);
		const [borderStyleValue, setBorderStyleValue] = useState<string | null>(
			null,
		);
		const [borderColorValue, setBorderColorValue] = useState<string | null>(
			"#FFFFFF",
		);
		// track the unit of the value, ex % or px
		const [valueType, setValueType] = useState<string | null>(null);
		const [showPicker, setShowPicker] = useState(false);
		// track the ref to debounce the input
		const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
			return "";
		}, [borderSizeValue]);

		// update data when unit changes
		// biome-ignore lint/correctness/useExhaustiveDependencies: intentionally only re-runs when valueType changes
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
		// biome-ignore lint/correctness/useExhaustiveDependencies: intentionally only re-runs when numericSizeValue changes
		useMemo(() => {
			if (numericSizeValue && !valueType) {
				setValueType("px");
			} else if (!numericSizeValue) {
				setValueType("");
			}
		}, [numericSizeValue]);

		return (
			<>
				<BaseSettingSection label="Border Size">
					<Input
						value={numericSizeValue}
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
						autoComplete="off"
						className="w-full"
					/>
					<ToggleGroup
						type="single"
						value={valueType ?? ""}
						onValueChange={(val) => val && setValueType(val)}
					>
						{Array.from(
							SIZE_VALUE_TYPES,
							(buttonValueType: string) => {
								return (
									<ToggleGroupItem
										key={buttonValueType}
										value={buttonValueType}
										variant="outline"
										size="sm"
									>
										{buttonValueType}
									</ToggleGroupItem>
								);
							},
						)}
					</ToggleGroup>
				</BaseSettingSection>
				<BaseSettingSection label="Border Style">
					<Select
						value={borderStyleValue ?? ""}
						onValueChange={(val) => {
							if (val && val !== "__none__") {
								onChange(
									borderSizeValue ?? "0px",
									val,
									borderColorValue ?? "#FFFFFF",
								);
							} else {
								onChange("", "", "");
							}
						}}
					>
						<SelectTrigger className="w-full">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={"__none__"}>
								<em>None</em>
							</SelectItem>
							<SelectItem value={"solid"}>Solid</SelectItem>
							<SelectItem value={"dashed"}>Dashed</SelectItem>
							<SelectItem value={"dotted"}>Dotted</SelectItem>
						</SelectContent>
					</Select>
				</BaseSettingSection>
				<div className="flex flex-col gap-1">
					<Muted className="text-black">Border Color</Muted>
					<div className="flex items-center justify-between gap-1">
						<div className="flex items-center gap-3">
							<div
								style={{
									width: 33,
									height: 33,
									borderRadius: "4px",
									backgroundColor:
										borderColorValue ?? "#FFFFFF",
									border: "1px solid #ccc",
								}}
							/>
							<Muted>{borderColorValue ?? "#FFFFFF"}</Muted>
						</div>
						<Button
							variant="ghost"
							size="icon-sm"
							onClick={() => setShowPicker(!showPicker)}
						>
							<PaintBucket />
						</Button>
					</div>

					{showPicker && (
						/* biome-ignore lint/a11y/noStaticElementInteractions: mouse-leave dismiss pattern for color picker overlay */
						<div
							className="mt-1 flex justify-end"
							onMouseLeave={() => setShowPicker(false)}
						>
							<div className="rounded">
								<Input
									type="color"
									value={borderColorValue ?? "#FFFFFF"}
									onChange={(color) => {
										onChange(
											borderSizeValue ?? "0px",
											borderStyleValue ?? "solid",
											color.currentTarget.value ??
												"#FFFFFF",
										);
									}}
									autoComplete="off"
									data-testid={`colorSettings-Border Color-txt`}
									className="w-full"
								/>
							</div>
						</div>
					)}
				</div>
			</>
		);
	},
);
