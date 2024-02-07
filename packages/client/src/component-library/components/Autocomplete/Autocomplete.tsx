import { Autocomplete as MuiAutocomplete } from '@mui/material';
import {
    AutocompleteProps as MuiAutocompleteProps,
    ChipTypeMap,
    TextField as MuiTextField,
} from '@mui/material';

export interface AutocompleteProps<
    T,
    Multiple extends boolean | undefined,
    DisableClearable extends boolean | undefined,
    FreeSolo extends boolean | undefined = undefined,
    ChipComponent extends React.ElementType = ChipTypeMap['defaultComponent'],
> extends Omit<
        MuiAutocompleteProps<
            T | string,
            Multiple,
            DisableClearable,
            FreeSolo,
            ChipComponent
        >,
        | 'renderInput'
        | 'classes'
        | 'ChipProps'
        | 'clearIcon'
        | 'clearText'
        | 'closeText'
        | 'componentsProps'
        | 'disablePortal'
        | 'forcePopupIcon'
        | 'ListboxComponent'
        | 'ListboxProps'
        | 'openText'
        | 'PaperComponent'
        | 'PopperComponent'
        | 'renderGroup'
        | 'renderOption'
        | 'renderTags'
        | 'slotProps'
        | 'unstable_classNamePrefix'
        | 'unstable_isActiveElementInListbox'
        | 'autoComplete'
        | 'autoHighlight'
        | 'loading'
        | 'autoSelect'
        | 'blurOnSelect'
        | 'clearOnBlur'
        | 'clearOnEscape'
        | 'componentName'
        | 'disableClearable'
        | 'disableCloseOnSelect'
        | 'disabledItemsFocusable'
        | 'disableListWrap'
        | 'getOptionDisabled'
        | 'handleHomeEndKeys'
        | 'includeInputInList'
        | 'openOnFocus'
        | 'selectOnFocus'
        | 'selectOnFocus'
    > {
    renderInput?: MuiAutocompleteProps<
        T | string,
        Multiple,
        DisableClearable,
        FreeSolo
    >['renderInput'];
    label?: React.ReactNode;
}

export function Autocomplete<
    T,
    Multiple extends boolean | undefined = undefined,
    DisableClearable extends boolean | undefined = undefined,
    FreeSolo extends boolean | undefined = undefined,
    ChipComponent extends React.ElementType = ChipTypeMap['defaultComponent'],
>({
    label,
    ...props
}: AutocompleteProps<T, Multiple, DisableClearable, FreeSolo, ChipComponent>) {
    return (
        <MuiAutocomplete
            renderInput={(params) => (
                <MuiTextField
                    sx={{
                        '.MuiOutlinedInput-root': {
                            borderRadius: '0.5rem',
                        },
                    }}
                    {...params}
                    label={label}
                />
            )}
            {...props}
        />
    );
}
