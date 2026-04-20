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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks";
import { BaseSettingSection } from "../BaseSettingSection";

interface QueryNameDropdownSettingsProps<D extends BlockDef = BlockDef> {
	/**
	 * Id of the block that is being worked with
	 */
	id: string;

	/**
	 * Path to update
	 */
	path: Paths<Block<D>["data"], 4>;

	/**
	 * Settings label
	 */
	label: string;
}

export const QueryNameDropdownSettings = observer(
	<D extends BlockDef = BlockDef>({
		id,
		path,
		label,
	}: QueryNameDropdownSettingsProps<D>) => {
		const { data, setData } = useBlockSettings<D>(id);
		const { state } = useBlocks();

		// Track the value
		const [value, setValue] = useState("");

		// Track the ref to debounce the input
		const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

		// Get the value of the input (wrapped in useMemo because of path prop)
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

		// Update the value whenever the computed one changes
		useEffect(() => {
			setValue(computedValue);
		}, [computedValue]);

		// Available queries for autocomplete
		const queries = useMemo(() => {
			return Object.keys(state.queries);
		}, [state.queries]);

		/**
		 * Sync the data on change
		 */
		const onChange = (value: string) => {
			// Set the value
			setValue(value);

			// Clear out the old timeout
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
			}

			timeoutRef.current = setTimeout(() => {
				try {
					setData(path, value as PathValue<D["data"], typeof path>);
				} catch (e) {
					console.log(e);
				}
			}, 300);
		};

		return (
			<BaseSettingSection label={label}>
				<Select
					value={value}
					onValueChange={(val) => {
						onChange(val);
					}}
				>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="Query" />
					</SelectTrigger>
					<SelectContent>
						{queries.map((queryKey) => (
							<SelectItem key={queryKey} value={queryKey}>
								{queryKey}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</BaseSettingSection>
		);
	},
);
