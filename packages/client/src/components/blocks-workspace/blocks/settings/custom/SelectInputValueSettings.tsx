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
import { Autocomplete, TextField } from "@semoss/ui";
import { useBlockSettings } from "@/hooks";
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
		const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

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

				return JSON.stringify(v); // check if parsedData.multiple ? [] : ''
			});
		}, [data, path, parsedData.multiple]).get();

		// update the value whenever the computed one changes
		useEffect(() => {
			setValue(computedValue);
		}, [computedValue]);

		/**
		 * Sync the data on change
		 */
		const onChange = (value: string | string[]) => {
			// set the value
			setValue(value);

			// clear out he old timeout
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
			}

			timeoutRef.current = setTimeout(() => {
				try {
					// set the value
					setData(path, value as PathValue<D["data"], typeof path>);
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
						} catch (e) {
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
			return arr.map((option) => {
				if (typeof option !== "string") {
					return JSON.stringify(option);
				} else {
					return option;
				}
			});
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

		return (
			<BaseSettingSection label="Value">
				<Autocomplete
					fullWidth
					multiple={multipleple as boolean}
					options={stringifiedOptions}
					value={selectedValue}
					onChange={(_, newValue: string | string[]) => {
						// sync the data on change
						onChange(newValue);
					}}
					renderInput={(params) => (
						<TextField
							{...params}
							size="small"
							variant="outlined"
						/>
					)}
				/>
			</BaseSettingSection>
		);
	},
);
