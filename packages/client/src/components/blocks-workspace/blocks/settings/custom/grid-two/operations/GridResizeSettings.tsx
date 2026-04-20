import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	ActionMessages,
	type Block,
	type BlockDef,
	getValueByPath,
	type Paths,
	type PathValue,
	useBlocks,
} from "@semoss/renderer";
import { Input, ToggleGroup, ToggleGroupItem } from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks";

/**
 * Used for any style settings that utilize a size number, ex width and height
 * Supports % and px units for size
 */

interface SizeSettingsProps<D extends BlockDef = BlockDef> {
	/**
	 * Id of the block that is being worked with
	 */
	id: string;

	/**
	 * Label to pass into the input
	 */
	label: string;

	/**
	 * Path to update
	 */
	path: Paths<Block<D>["data"], 4>;
}

const SIZE_VALUE_TYPES = ["em", "px", "%"] as const;

export const GridResizeSettings = observer(
	<D extends BlockDef = BlockDef>({
		id,
		label = "",
		path,
	}: SizeSettingsProps<D>) => {
		const { state } = useBlocks();
		const { data, setData } = useBlockSettings<D>(id);
		const [parsed, setParsed] = useState<{
			unit: "%" | "px" | "em" | "";
			amount: string;
		}>({
			unit: "",
			amount: "",
		});
		const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
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
		useEffect(() => {
			const p: typeof parsed = {
				unit: "",
				amount: "",
			};
			if (computedValue.includes("%")) {
				p.unit = "%";
			} else if (computedValue.includes("px")) {
				p.unit = "px";
			} else if (computedValue.includes("em")) {
				p.unit = "em";
			}
			if (p.unit) {
				p.amount = computedValue.replace(/\D+/g, "");
			} else {
				p.amount = computedValue;
			}

			setParsed(p);
		}, [computedValue]);

		/**
		 * Sync the data on change
		 */
		const onChange = (amount: string, unit: "%" | "px" | "em" | "") => {
			setParsed({
				amount: amount,
				unit: unit,
			});
			const v = unit ? amount + unit : amount;
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
			}

			timeoutRef.current = setTimeout(() => {
				try {
					setData(path, v as PathValue<D["data"], typeof path>);
					state.dispatch({
						message: ActionMessages.DISPATCH_EVENT,
						payload: {
							name: "blockResized",
						},
					});
				} catch (e) {
					console.log(e);
				}
			}, 300);
		};

		return (
			<div className="flex flex-col gap-4">
				<div className="flex flex-row items-center justify-center gap-4">
					{/* biome-ignore lint/suspicious/noCommentText: JSX comment in text node */}
					{/* biome-ignore lint/a11y/noLabelWithoutControl: label */}
					<label>
						<p className="text-muted-foreground text-sm">{label}</p>
					</label>
					<Input
						value={parsed.amount}
						onChange={(e) => {
							onChange(e.target.value, parsed.unit);
						}}
						autoComplete="off"
					/>
					<ToggleGroup
						type="single"
						value={parsed.unit}
						onValueChange={(val) => {
							if (val)
								onChange(
									parsed.amount,
									val as "%" | "px" | "em",
								);
						}}
					>
						{SIZE_VALUE_TYPES.map((unit) => (
							<ToggleGroupItem key={unit} value={unit} size="sm">
								{unit}
							</ToggleGroupItem>
						))}
					</ToggleGroup>
				</div>
			</div>
		);
	},
);
