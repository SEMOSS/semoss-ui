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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks/useBlockSettings";
import { formatToDataTestId } from "@/utility";
import { BaseSettingSection } from "../BaseSettingSection";

/**
 * Used for discrete selection options tied to values, ex S/M/L
 */

interface SelectInputSettingsProps<D extends BlockDef = BlockDef> {
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

	/**
	 * Options for select
	 */
	options: Array<{ value: string; display: string; isDefault?: boolean }>;

	/**
	 * Whether an empty 'None' option should be in the select
	 */
	allowUnset?: boolean;

	/**
	 * Whether custom entries are allowed
	 */
	allowCustomInput?: boolean;

	/** Whether we should dispatch an event to the designer to update the frame around the block */
	resizeOnSet?: boolean;

	/**
	 * Tooltip to display for the setting
	 */
	tooltip?: string;
}

export const SelectInputSettings = observer(
	<D extends BlockDef = BlockDef>({
		id,
		path,
		label,
		options,
		allowUnset = false,
		allowCustomInput = false,
		resizeOnSet = false,
		tooltip = "",
	}: SelectInputSettingsProps<D>) => {
		const { data, setData } = useBlockSettings(id);
		const { state } = useBlocks();

		// track the value
		const [value, setValue] = useState("");

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
			setValue(computedValue);
		}, [computedValue]);

		useEffect(() => {
			const defaultOption = options.find((option) => option.isDefault);
			if (defaultOption) {
				setValue(defaultOption.value);
			}
		}, [options]);

		/**
		 * Sync the data on change
		 */
		const onChange = (value: string) => {
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
					if (resizeOnSet) {
						// emit event to resize the block on the screen
						state.dispatch({
							message: ActionMessages.DISPATCH_EVENT,
							payload: {
								name: "blockResized",
							},
						});
					}
				} catch (e) {
					console.log(e);
				}
			}, 300);
		};

		return (
			<BaseSettingSection label={label} description={tooltip}>
				{allowCustomInput ? (
					<input
						list={`${id}-${label}-datalist`}
						className="w-full rounded border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
						value={value}
						onChange={(e) => onChange(e.target.value)}
						data-testid={formatToDataTestId(
							`selectInputSettings-${label}-${id}-txt`,
						)}
					></input>
				) : (
					<Select
						value={value || (allowUnset ? "__none__" : value)}
						onValueChange={(val) => {
							onChange(val === "__none__" ? "" : val);
						}}
					>
						<SelectTrigger
							className="w-full"
							data-testid={formatToDataTestId(
								`selectInputSettings-${label}-${id}-select`,
							)}
						>
							<SelectValue placeholder="Select..." />
						</SelectTrigger>
						<SelectContent>
							{allowUnset ? (
								<SelectItem value="__none__">None</SelectItem>
							) : null}
							{Array.from(options, (option, _i) => {
								return (
									<SelectItem
										key={option.value}
										value={option.value}
									>
										{option.display}
									</SelectItem>
								);
							})}
						</SelectContent>
					</Select>
				)}
			</BaseSettingSection>
		);
	},
);
