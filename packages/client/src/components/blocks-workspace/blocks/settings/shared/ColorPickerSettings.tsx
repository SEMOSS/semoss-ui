// biome-ignore-all lint/correctness/useExhaustiveDependencies: TODO
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
	Input,
	Muted,
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks/useBlockSettings";

interface ColorPickerSettingProps<D extends BlockDef = BlockDef> {
	/**
	 * Id of the block that is being worked with
	 */
	id: string;

	/**
	 * Path to update
	 */
	path: Paths<Block<D>["data"], 4>;
	colorValue: string;
	onChange: (color: string) => void;
}

export const ColorPickerSettings = observer<ColorPickerSettingProps>(
	<D extends BlockDef = BlockDef>({
		id,
		path,
		colorValue = "#000000",
		onChange,
	}) => {
		const [showPopover, setShowPopover] = useState(false);
		const [_color, setColor] = useState(colorValue);
		// biome-ignore lint/suspicious/noExplicitAny: TODO
		const { data, setData } = useBlockSettings<any>(id);
		const [value, setValue] = useState<string | null>(null);
		const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
		const optiontimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
		const [colorPickerState, setColorPickerState] = useState<
			"initial" | "updated"
		>("initial");
		const optionPathVal = "option";
		const [_optionValue, setOptionValue] = useState(data.option);

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

		const optionComputedValue = useMemo(() => {
			return computed(() => {
				if (!data) {
					return "";
				}
				const v = getValueByPath(data, optionPathVal);
				if (typeof v === "undefined") {
					return "";
				} else if (typeof v === "string") {
					return v;
				}
				return JSON.stringify(v, null, 2);
			});
		}, [data, optionPathVal]).get();

		useEffect(() => {
			setOptionValue(optionComputedValue);
		}, [optionComputedValue]);

		useEffect(() => {
			setValue(computedValue);
			if (colorPickerState === "updated") {
				updateLatestChartDetail();
			}
		}, [computedValue]);

		function updateLatestChartDetail() {
			if (optiontimeoutRef.current) {
				clearTimeout(optiontimeoutRef.current);
				optiontimeoutRef.current = null;
			}
			optiontimeoutRef.current = setTimeout(() => {
				try {
					const options = JSON.parse(optionComputedValue);
					options.lastUpdatedTime = Date.now();
					setData(
						optionPathVal,
						options as PathValue<D["data"], typeof path>,
					);
				} catch (e) {
					console.log(e);
				}
			}, 300);
		}

		function runStateUpdateCustom(option) {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
			}
			timeoutRef.current = setTimeout(() => {
				try {
					setData(path, option as PathValue<D["data"], typeof path>);
				} catch (e) {
					console.log(e);
				}
			}, 300);
		}

		return (
			<div className="mb-2 flex flex-col gap-2 px-4 py-2">
				<Muted>Select Colour</Muted>
				<div className="relative w-full">
					<Input
						placeholder="Select Colour"
						aria-label="Select Colour"
						type="text"
						value={value ?? ""}
						className="w-full pr-10"
						onChange={(e) => {
							setColor(e.target.value);
							runStateUpdateCustom(e.target.value);
							setColorPickerState("updated");
						}}
					/>
					<Popover open={showPopover} onOpenChange={setShowPopover}>
						<PopoverTrigger asChild>
							<button
								type="button"
								aria-label="select colour"
								className="-translate-y-1/2 absolute top-1/2 right-2 cursor-pointer border-none bg-transparent p-0"
							>
								<span
									className="block h-[33px] w-[33px] rounded-[20%] border border-black"
									style={{
										backgroundColor: value ?? "#000000",
									}}
								/>
							</button>
						</PopoverTrigger>
						<PopoverContent className="w-auto p-2">
							<Input
								className="h-8 w-full p-0.5"
								type="color"
								value={value ?? "#000000"}
								onChange={(newColor) => {
									setColor(newColor.target.value);
									runStateUpdateCustom(newColor.target.value);
									onChange(newColor.target.value);
									setColorPickerState("updated");
								}}
								autoComplete="off"
								data-testid={`colorSettings-Color Picker-txt`}
							/>
						</PopoverContent>
					</Popover>
				</div>
			</div>
		);
	},
);
