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
import { useBlockSettings } from "@/hooks/useBlockSettings";
import { BaseSettingSection } from "../BaseSettingSection";

interface SizeSettingsProps<D extends BlockDef = BlockDef> {
	id: string;
	label: string;
	path: Paths<Block<D>["data"], 4>;
}

const SIZE_VALUE_TYPES = ["em", "px", "%"] as const;

export const SizeSettings = observer(
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
		}>({ unit: "", amount: "" });

		const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

		const computedValue = useMemo(() => {
			return computed(() => {
				if (!data) return "";
				const v = getValueByPath(data, path);
				if (typeof v === "undefined") return "";
				if (typeof v === "string") return v;
				return JSON.stringify(v);
			});
		}, [data, path]).get();

		useEffect(() => {
			const p: typeof parsed = { unit: "", amount: "" };
			if (computedValue.includes("%")) p.unit = "%";
			else if (computedValue.includes("px")) p.unit = "px";
			else if (computedValue.includes("em")) p.unit = "em";
			p.amount = p.unit
				? computedValue.replace(/\D+/g, "")
				: computedValue;
			setParsed(p);
		}, [computedValue]);

		const onChange = (amount: string, unit: "%" | "px" | "em" | "") => {
			setParsed({ amount, unit });
			const v = unit ? amount + unit : amount;
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
			timeoutRef.current = setTimeout(() => {
				try {
					setData(path, v as PathValue<D["data"], typeof path>);
					state.dispatch({
						message: ActionMessages.DISPATCH_EVENT,
						payload: { name: "blockResized" },
					});
				} catch (e) {
					console.log(e);
				}
			}, 300);
		};

		return (
			<BaseSettingSection label={label} wide>
				<Input
					value={parsed.amount}
					onChange={(e) => onChange(e.target.value, parsed.unit)}
					autoComplete="off"
				/>
				<ToggleGroup
					type="single"
					variant="outline"
					value={parsed.unit}
					onValueChange={(unit) => {
						if (unit)
							onChange(parsed.amount, unit as "%" | "px" | "em");
					}}
				>
					{SIZE_VALUE_TYPES.map((unit) => (
						<ToggleGroupItem key={unit} value={unit} size="sm">
							{unit}
						</ToggleGroupItem>
					))}
				</ToggleGroup>
			</BaseSettingSection>
		);
	},
);
