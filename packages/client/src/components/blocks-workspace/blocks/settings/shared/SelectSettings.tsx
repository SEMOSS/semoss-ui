import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	type Block,
	type BlockDef,
	getValueByPath,
	type Paths,
	type PathValue,
	useBlocks,
} from "@semoss/renderer";
import { useBlockSettings } from "@/hooks";
import { BaseSettingSection } from "../BaseSettingSection";

interface SelectSettingsProps<D extends BlockDef = BlockDef> {
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

	/**
	 * Options
	 */
	options: string[];

	// TODO: ARRAY of options
	/**
	 * Multiple options
	 */
	multiple: boolean;
}

export const SelectSettings = observer(
	<D extends BlockDef = BlockDef>({
		id,
		label = "",
		path,
		options,
		multiple = true,
	}: SelectSettingsProps<D>) => {
		const { data, setData } = useBlockSettings<D>(id);
		// biome-ignore lint/correctness/noUnusedVariables: used in JSX or callback
		const { state } = useBlocks();
		//  track the value
		const [value, setValue] = useState<string[]>([]);

		// track the ref to debounce the input
		const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

		// get the value of the input (wrapped in usememo because of path prop)
		const computedValue = useMemo(() => {
			return computed(() => {
				if (!data) {
					return [];
				}

				const v = getValueByPath(data, path);
				if (typeof v === "undefined") {
					return [];
				} else if (typeof v === "string") {
					return (v as string).split(",");
				}

				return v;
			});
		}, [data, path]).get();

		// update the value whenever the computed one changes
		useEffect(() => {
			setValue(computedValue as string[]);
		}, [computedValue]);

		/**
		 * Sync the data on change
		 */
		const onChange = (newValue: string[]) => {
			// set the value
			setValue(newValue);

			// clear out he old timeout
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}

			timeoutRef.current = setTimeout(() => {
				try {
					// set the value
					setData(
						path,
						newValue as PathValue<D["data"], typeof path>,
					);
				} catch (e) {
					console.log(e);
				}
			}, 300);
		};

		return (
			<BaseSettingSection label={label}>
				{multiple ? (
					<select
						multiple
						className="w-full rounded border border-input p-1 text-sm"
						value={value}
						onChange={(e) => {
							const selected = Array.from(
								e.target.selectedOptions,
								(opt) => opt.value,
							);
							onChange(selected);
						}}
					>
						{options.map((opt) => (
							<option key={opt} value={opt}>
								{opt}
							</option>
						))}
					</select>
				) : (
					<select
						className="w-full rounded border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
						value={value[0] ?? ""}
						onChange={(e) => onChange([e.target.value])}
					>
						<option value="">Select extensions</option>
						{options.map((opt) => (
							<option key={opt} value={opt}>
								{opt}
							</option>
						))}
					</select>
				)}
			</BaseSettingSection>
		);
	},
);
