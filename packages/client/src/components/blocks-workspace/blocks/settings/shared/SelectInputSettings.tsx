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
	Autocomplete,
	createFilterOptions,
	Menu,
	Select,
	TextField,
} from "@semoss/ui";
import { useBlockSettings } from "@/hooks";
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

const filter = createFilterOptions<string>();

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

		const [autocompleteOptions, setAutocompleteOptions] = useState<
			Array<string>
		>([]);

		useEffect(() => {
			if (allowUnset) {
				setAutocompleteOptions([
					"",
					...options.map((option) => option.value),
				]);
			} else {
				setAutocompleteOptions(options.map((option) => option.value));
			}
		}, [options]);

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
					<Autocomplete
						fullWidth
						size="small"
						multiple={false}
						value={value}
						onChange={(_, newValue) => {
							onChange(newValue.replace("Custom: ", ""));
						}}
						filterOptions={(autocompleteOptions, params) => {
							const filtered = filter(
								autocompleteOptions,
								params,
							);

							const { inputValue } = params;
							// Suggest the creation of a new value
							const isExisting = autocompleteOptions.some(
								(option) => inputValue === option,
							);
							if (inputValue !== "" && !isExisting) {
								filtered.push(`${inputValue}`);
							}

							return filtered;
						}}
						selectOnFocus
						clearOnBlur
						handleHomeEndKeys
						options={autocompleteOptions}
						getOptionLabel={(option) => {
							const dropdownOptions = options.find(
								(element) => element.value == option,
							);
							return dropdownOptions?.display ?? option;
						}}
						renderOption={(props, option) => {
							const dropdownOptions = options.find(
								(element) => element.value == option,
							);
							return (
								<li {...props}>
									{dropdownOptions?.display ??
										(option == ""
											? "None"
											: `Custom: ${option}`)}
								</li>
							);
						}}
						freeSolo
						data-testid={formatToDataTestId(
							`selectInputSettings-${label}-${id}-txt`,
						)}
						renderInput={(params) => <TextField {...params} />}
					/>
				) : (
					<Select
						fullWidth
						size="small"
						value={value}
						InputProps={{
							"data-testid": formatToDataTestId(
								`selectInputSettings-${label}-${id}-select`,
							),
						}}
						onChange={(e) => {
							// sync the data on change
							onChange(e.target.value);
						}}
					>
						{allowUnset ? (
							<Menu.Item value={""}>
								<em>None</em>
							</Menu.Item>
						) : null}
						{Array.from(options, (option, i) => {
							return (
								<Menu.Item key={option.value} value={option.value}>
									{option.display}
								</Menu.Item>
							);
						})}
					</Select>
				)}
			</BaseSettingSection>
		);
	},
);
