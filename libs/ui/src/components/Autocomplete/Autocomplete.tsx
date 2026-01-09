import {
	type ChipTypeMap,
	Autocomplete as MuiAutocomplete,
	type AutocompleteProps as MuiAutocompleteProps,
	TextField as MuiTextField,
} from "@mui/material";
import { Typography } from "../Typography";

export interface AutocompleteProps<
	T,
	Multiple extends boolean | undefined,
	DisableClearable extends boolean | undefined,
	FreeSolo extends boolean | undefined = undefined,
	ChipComponent extends React.ElementType = ChipTypeMap["defaultComponent"],
> extends Omit<
		MuiAutocompleteProps<
			T | string,
			Multiple,
			DisableClearable,
			FreeSolo,
			ChipComponent
		>,
		| "renderInput"
		| "classes"
		| "ChipProps"
		| "clearIcon"
		| "clearText"
		| "closeText"
		| "componentsProps"
		| "forcePopupIcon"
		| "ListboxComponent"
		| "openText"
		| "PaperComponent"
		| "renderTags"
		| "unstable_classNamePrefix"
		| "unstable_isActiveElementInListbox"
		| "autoComplete"
		| "autoHighlight"
		| "autoSelect"
		| "blurOnSelect"
		| "clearOnEscape"
		| "componentName"
		| "disabledItemsFocusable"
		| "disableListWrap"
		| "openOnFocus"
	> {
	renderInput?: MuiAutocompleteProps<
		T | string,
		Multiple,
		DisableClearable,
		FreeSolo
	>["renderInput"];
	label?: React.ReactNode;
	helpText?: React.ReactNode;
	value?: Multiple extends true ? (T | string)[] : T | string | null;
}

export function Autocomplete<
	T,
	Multiple extends boolean | undefined = undefined,
	DisableClearable extends boolean | undefined = undefined,
	FreeSolo extends boolean | undefined = undefined,
	ChipComponent extends React.ElementType = ChipTypeMap["defaultComponent"],
>({
	label,
	helpText = "Press enter to add",
	...props
}: AutocompleteProps<T, Multiple, DisableClearable, FreeSolo, ChipComponent>) {
	return (
		<MuiAutocomplete
			renderInput={(params) => (
				<MuiTextField
					sx={{
						".MuiOutlinedInput-root": {
							borderRadius: "0.5rem",
						},
					}}
					{...params}
					label={label}
					helperText={
						<Typography variant="caption">{helpText}</Typography>
					}
				/>
			)}
			{...props}
		/>
	);
}
