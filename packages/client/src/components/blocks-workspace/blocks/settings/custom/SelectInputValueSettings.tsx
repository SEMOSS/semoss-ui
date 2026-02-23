import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	type Block,
	type BlockDef,
	copy,
	getValueByPath,
	type Paths,
	type PathValue,
	useBlocks,
} from "@semoss/renderer";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks/useBlockSettings";
import { BaseSettingSection } from "../BaseSettingSection";

/**
 * Used to set the values setting on a select block
 * Binds to the block's data.options for the select options
 */

interface SelectInputValueSettingsProps<D extends BlockDef = BlockDef> {
	/**
	 * Id of the block that is being worked with
	 */
	id: string;

	/**
	 * Path to update
	 */
	path: Paths<Block<D>["data"], 4>;
}

export const SelectInputValueSettings = observer(
	<D extends BlockDef = BlockDef>({
		id,
		path,
	}: SelectInputValueSettingsProps<D>) => {
		const { data, setData } = useBlockSettings(id);
		const { state } = useBlocks();

		// get the block
		const block = state.getBlock(id);

		// get the parsedData
		const parsedData = computed(() => {
			return copy(block.data, (instance) => {
				if (typeof instance === "string") {
					// try to extract the variable
					return state.parseVariable(instance);
				}

				return instance;
			});
		}).get();

		// track the value
		const [value, setValue] = useState<string | string[]>(
			parsedData.multiple ? [] : "",
		);

		// track the ref to debounce the input
		const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

		// get the value of the input (wrapped in usememo because of path prop)
		const computedValue = useMemo(() => {
			return computed(() => {
				if (!data) {
					return parsedData.multiple ? [] : "";
				}

				const v = getValueByPath(data, path);
				if (typeof v === "undefined") {
					return parsedData.multiple ? [] : "";
				} else if (Array.isArray(v) && parsedData.multiple) {
					return v;
				} else if (typeof v === "string" && !parsedData.multiple) {
					return v;
				}

				return JSON.stringify(v);
			});
		}, [data, path, parsedData.multiple]).get();

		// update the value whenever the computed one changes
		useEffect(() => {
			setValue(computedValue);
		}, [computedValue]);

		/**
		 * Sync the data on change
		 */
		const onChange = (value: unknown) => {
			// Handle nulls and normalize nested arrays
			let safeValue: string | string[];

			if (value === null || value === undefined) {
				safeValue = parsedData.multiple ? [] : "";
			} else if (Array.isArray(value)) {
				// Flatten any nested arrays and convert to strings
				safeValue = value.flat(Infinity).map(String);
			} else {
				safeValue = String(value);
			}

			// set the value
			setValue(safeValue);

			// clear out the old timeout
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
			}

			timeoutRef.current = setTimeout(() => {
				try {
					// set the value using safeValue, not value
					setData(
						path,
						safeValue as PathValue<D["data"], typeof path>,
					);
				} catch (e) {
					console.log(e);
				}
			}, 300);
		};

		const stringifiedOptions: string[] = useMemo(() => {
			let arr = [];
			if (!parsedData.options) {
				// NOOP
				return [];
			}

			// Check if options has the data.values structure (tabular format)
			if (
				typeof parsedData.options === "object" &&
				"data" in parsedData.options &&
				parsedData.options.data &&
				typeof parsedData.options.data === "object" &&
				"values" in parsedData.options.data &&
				Array.isArray(parsedData.options.data.values) &&
				"headers" in parsedData.options.data &&
				Array.isArray(parsedData.options.data.headers)
			) {
				// Handle tabular data format
				const { values, headers } = parsedData.options.data as {
					values: unknown[][];
					headers: string[];
				};

				if (headers.length === 1) {
					// Single column - extract as simple array
					arr = values.map((row: unknown[]) => row[0]);
				} else {
					// Multiple columns - convert rows to objects
					arr = values.map((row: unknown[]) => {
						const obj: Record<string, unknown> = {};
						headers.forEach((header, idx) => {
							obj[header] = row[idx];
						});
						return obj;
					});
				}
			} else if (!Array.isArray(parsedData?.options)) {
				if (typeof parsedData.options === "string") {
					let opts: string = (parsedData.options as string).trim();
					// If Python-style array, convert to valid JSON
					if (opts.startsWith("[") && opts.endsWith("]")) {
						// Replace single quotes with double quotes
						opts = opts.replace(/'/g, '"');
						// Remove spaces after commas
						opts = opts.replace(/,\s+/g, ",");
						try {
							arr = JSON.parse(opts);
						} catch (_e) {
							// fallback: try to split manually
							arr = opts
								.slice(1, -1)
								.split(",")
								.map((s) => s.trim().replace(/^"|"$/g, ""));
						}
					}
				}
			} else {
				arr = parsedData.options;
			}

			const result = arr.map((option: unknown) => {
				if (typeof option !== "string") {
					return JSON.stringify(option);
				} else {
					return option;
				}
			});
			return result;
		}, [parsedData.options]);

		const multipleple =
			typeof parsedData.multiple === "boolean"
				? parsedData.multiple
				: false;

		// Ensure that value is always an array when multiple is true
		const selectedValue = useMemo(() => {
			if (parsedData.multiple) {
				return Array.isArray(value) ? value : [];
			}
			return value || null;
		}, [parsedData.multiple, value]);

		if (multipleple) {
			// For multiple select, use a native multi-select
			return (
				<BaseSettingSection label="Value">
					<select
						multiple
						value={
							Array.isArray(selectedValue) ? selectedValue : []
						}
						onChange={(e) => {
							const selected = Array.from(
								e.target.selectedOptions,
								(opt) => opt.value,
							);
							onChange(selected);
						}}
						className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
					>
						{stringifiedOptions.map((opt) => (
							<option key={opt} value={opt}>
								{opt}
							</option>
						))}
					</select>
				</BaseSettingSection>
			);
		}

		return (
			<BaseSettingSection label="Value">
				<Select
					value={
						typeof selectedValue === "string" ? selectedValue : ""
					}
					onValueChange={(val) => {
						onChange(val);
					}}
				>
					<SelectTrigger className="w-full">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{stringifiedOptions.map((opt) => (
							<SelectItem key={opt} value={opt}>
								{opt}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</BaseSettingSection>
		);
	},
);
