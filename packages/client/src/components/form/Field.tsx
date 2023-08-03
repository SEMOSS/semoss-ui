import React, { useState } from 'react';
import { Controller, Control, FieldValues, Path } from 'react-hook-form';
import {
    Form,
    Input,
    Textarea,
    Select,
    Typeahead,
    Switch,
    Checkbox,
    Checklist,
    Radio,
    Datepicker,
    FileDropzone,
    FormFieldProps,
    theme,
    styled,
} from '@semoss/components';

import {
    InputProps,
    TextareaProps,
    SelectProps,
    TypeaheadProps,
    SwitchProps,
    CheckboxProps,
    ChecklistProps,
    RadioProps,
    DatepickerProps,
    FileDropzoneProps,
} from '@semoss/components';

import {
    TextField,
    Select as MuiSelect,
    Switch as MuiSwitch,
} from '@semoss/ui';

// WORK ON SWITCHING TYPES TO THIS FORMAT
// type GenericField<C, P> = { components: C } & Omit<P, "onChange">;
// type FieldInput = GenericField<"input", InputProps<string>>;

type FieldInput = { component: 'input' } & Omit<
    InputProps<string>,
    'onChange' | 'value' | 'defaultValue'
>;

type FieldNumberpicker = { component: 'numberpicker' } & Omit<
    InputProps<number>,
    'onChange' | 'value' | 'defaultValue'
>;

type FieldSelect = { component: 'select' } & Omit<
    SelectProps<string, false>,
    'onChange' | 'value' | 'defaultValue'
>;

type FieldTypeahead = { component: 'typeahead' } & Omit<
    TypeaheadProps<string, false>,
    'onChange' | 'value' | 'defaultValue'
>;

type FieldTextarea = { component: 'textarea' } & Omit<
    TextareaProps,
    'onChange' | 'value' | 'defaultValue'
>;

type FieldSwitch = { component: 'switch' } & Omit<
    SwitchProps,
    'onChange' | 'value' | 'defaultValue'
>;

type FieldCheckbox = { component: 'checkbox' } & Omit<
    CheckboxProps,
    'onChange' | 'value' | 'defaultValue'
>;

type FieldChecklist = { component: 'checklist' } & Omit<
    ChecklistProps<string, true>,
    'onChange' | 'value' | 'defaultValue'
>;

type FieldRadio = {
    component: 'radio';
    options: {
        display: string;
        // TODO: boolean option for value has been removed since it is not accepted as a type by the SEMOSS Radio Component. Will need to update the Radio component before adding this as an option for the value prop.
        // value: string | boolean;
        value: string;
    }[];
    orientation?: 'vertical' | 'horizontal';
} & Omit<RadioProps, 'onChange' | 'value' | 'defaultValue'>;

type FieldFileDropzone = { component: 'file-dropzone' } & Omit<
    FileDropzoneProps<true>,
    'onChange' | 'value' | 'defaultValue'
>;

type FieldDatepicker = { component: 'datepicker' } & Omit<
    DatepickerProps,
    'onChange' | 'value' | 'defaultValue'
>;

interface FieldProps<V extends FieldValues> {
    name: Path<V>;
    control: Control<V>;
    rules: unknown;
    options:
        | FieldInput
        | FieldNumberpicker
        | FieldSelect
        | FieldTextarea
        | FieldSwitch
        | FieldCheckbox
        | FieldChecklist
        | FieldRadio
        | FieldDatepicker
        | FieldFileDropzone
        | FieldTypeahead;
    description?: string;
    label?: string;
    error?: string;
    disabled?: boolean;
    layout?: FormFieldProps['layout'];
    container?: unknown;
    onChange?: (V) => void;
    sx?: any;
    helperText?: React.ReactNode | string;
}

const StyledRequired = styled('span', {
    color: theme.colors['error-1'],
});

const validateBoolean = (value: boolean) => typeof value === 'boolean';

/**
 * Field in a Form
 */
export const Field = <V extends FieldValues>(
    props: FieldProps<V>,
): JSX.Element => {
    const {
        name,
        control,
        rules,
        options,
        description,
        // optional
        label,
        error,
        disabled,
        layout,
        container,
    } = props;

    const [selected, setSelected] = useState('');
    const returnLabel = (label: string) => {
        return rules['required'] ? (
            <>
                {label}: <StyledRequired>*</StyledRequired>
            </>
        ) : (
            <>{label}:</>
        );
    };
    if (options.component === 'input') {
        return (
            <Controller
                name={name}
                control={control}
                rules={rules}
                render={({ field, fieldState }) => {
                    const hasError = fieldState.error;
                    return (
                        <Form.Field
                            error={hasError ? error : null}
                            description={description}
                            layout={layout}
                            style={{ padding: '8px' }}
                        >
                            <TextField
                                placeholder={options.placeholder}
                                value={field.value ? field.value : ''}
                                onChange={(value) => {
                                    field.onChange(value);
                                }}
                                id={options.id}
                                disabled={disabled}
                                error={!!hasError}
                                label={label ? label : null}
                            />
                        </Form.Field>
                    );
                }}
            />
        );
    } else if (options.component === 'numberpicker') {
        return (
            <Controller
                name={name}
                control={control}
                rules={rules}
                render={({ field, fieldState }) => {
                    const hasError = fieldState.error;

                    return (
                        <Form.Field
                            label={label ? returnLabel(label) : null}
                            error={hasError ? error : null}
                            description={description}
                            layout={layout}
                        >
                            <Input
                                type={'number'}
                                id={options.id}
                                size={options.size ? options.size : 'md'}
                                placeholder={options.placeholder}
                                disabled={disabled ? disabled : false}
                                valid={!hasError}
                                value={field.value ? field.value : ''}
                                onChange={(value) => field.onChange(value)}
                                autoComplete={
                                    options.autoComplete
                                        ? options.autoComplete
                                        : null
                                }
                            />
                        </Form.Field>
                    );
                }}
            />
        );
    } else if (options.component === 'textarea') {
        return (
            <Controller
                name={name}
                control={control}
                rules={rules}
                render={({ field, fieldState }) => {
                    const hasError = fieldState.error;
                    return (
                        <Form.Field
                            label={label ? returnLabel(label) : null}
                            error={hasError ? error : null}
                            description={description}
                            layout={layout}
                        >
                            <Textarea
                                id={options.id}
                                size={options.size ? options.size : 'md'}
                                disabled={disabled}
                                placeholder={options.placeholder}
                                valid={!hasError}
                                value={field.value ? field.value : ''}
                                defaultValue={field.value ? field.value : ''}
                                onChange={(value) => field.onChange(value)}
                                // textareaProps={rules}
                            />
                        </Form.Field>
                    );
                }}
            />
        );
    } else if (options.component === 'select') {
        return (
            <Controller
                name={name}
                control={control}
                rules={rules}
                render={({ field, fieldState }) => {
                    const hasError = fieldState.error;

                    return (
                        <Form.Field
                            error={hasError ? error : null}
                            description={description}
                            layout={layout}
                            style={{ padding: '8px', width: '60%' }}
                        >
                            <MuiSelect
                                id={options.id}
                                selectProps={{ multiple: true }}
                                disabled={disabled}
                                label={label ? label : null}
                                placeholder={options.placeholder}
                                sx={{ width: '75%' }}
                                defaultValue={field.value ? field.value : ''}
                                onChange={(value) => field.onChange(value)}
                            >
                                {options.options.map((option) => {
                                    return (
                                        <MuiSelect.Item value={option}>
                                            {option}
                                        </MuiSelect.Item>
                                    );
                                })}
                            </MuiSelect>
                        </Form.Field>
                    );
                }}
            />
            // {/* </MarginedField> */}
        );
    } else if (options.component === 'typeahead') {
        return (
            <Controller
                name={name}
                control={control}
                rules={rules}
                render={({ field, fieldState }) => {
                    const hasError = fieldState.error;

                    return (
                        <Form.Field
                            label={label ? returnLabel(label) : null}
                            error={hasError ? error : null}
                            description={description}
                            layout={layout}
                        >
                            <Typeahead
                                id={options.id}
                                size={options.size ? options.size : 'md'}
                                disabled={disabled}
                                placeholder={options.placeholder}
                                options={options.options}
                                valid={!hasError}
                                value={field.value ? field.value : ''}
                                defaultValue={field.value ? field.value : ''}
                                onChange={(value) => field.onChange(value)}

                                // container={options.ref}
                                // getSearch?: (search: string, option: O) => boolean;
                                // getKey?: (option: O) => string;
                                // getDisplay?: (option: O) => ReactNode;
                                // inputProps={rules}
                            />
                        </Form.Field>
                    );
                }}
            />
        );
    } else if (options.component === 'switch') {
        // Still working on it
        return (
            <Controller
                name={name}
                control={control}
                rules={rules}
                render={({ field, fieldState }) => {
                    const hasError = fieldState.error;
                    return (
                        <Form.Field
                            label={label ? returnLabel(label) : null}
                            error={hasError ? error : null}
                            description={description}
                            layout={layout}
                        >
                            <MuiSwitch
                                id={options.id ? options.id : null}
                                disabled={disabled}
                                color="primary"
                                valid={!hasError}
                                checked={field.value}
                                onChange={(value) => field.onChange(value)}
                            />
                        </Form.Field>
                    );
                }}
            />
        );
    } else if (options.component === 'checkbox') {
        return (
            <Controller
                name={name}
                control={control}
                rules={rules}
                render={({ field, fieldState }) => {
                    const hasError = fieldState.error;

                    return (
                        <Form.Field
                            label={label ? returnLabel(label) : null}
                            error={hasError ? error : null}
                            description={description}
                            layout={layout}
                        >
                            <Checkbox
                                id={options.id ? options.id : null}
                                indeterminate={options.indeterminate}
                                disabled={disabled}
                                valid={!hasError}
                                value={field.value ? field.value : false}
                                defaultValue={field.value ? field.value : false}
                                onChange={(value) => field.onChange(value)}
                            >
                                {options.children}
                            </Checkbox>
                        </Form.Field>
                    );
                }}
            />
        );
    } else if (options.component === 'checklist') {
        return (
            <Controller
                name={name}
                control={control}
                rules={rules}
                render={({ field, fieldState }) => {
                    const hasError = fieldState.error;

                    return (
                        <Form.Field
                            label={label ? returnLabel(label) : null}
                            error={hasError ? error : null}
                            description={description}
                            layout={layout}
                        >
                            <Checklist
                                placeholder={options.placeholder}
                                options={options.options}
                                multiple={options.multiple}
                                selectAll={options.selectAll}
                                disabled={disabled}
                                valid={!hasError}
                                value={field.value ? field.value : []}
                                defaultValue={field.value ? field.value : []}
                                onChange={(value) => field.onChange(value)}
                            ></Checklist>
                        </Form.Field>
                    );
                }}
            />
        );
    } else if (options.component === 'radio') {
        return (
            <Controller
                name={name}
                control={control}
                rules={rules}
                render={({ field, fieldState }) => {
                    const hasError = fieldState.error;

                    return (
                        <Form.Field
                            label={label ? returnLabel(label) : null}
                            error={hasError ? error : null}
                            description={description}
                            layout={layout}
                        >
                            <Radio
                                orientation={
                                    options.orientation
                                        ? options.orientation
                                        : 'horizontal'
                                }
                                value={
                                    typeof field.value !== 'undefined' &&
                                    field.value !== null &&
                                    field.value !== ''
                                        ? options.options.find(
                                              (opt) =>
                                                  opt.value === field.value,
                                          ).display
                                        : ''
                                }
                                defaultValue={field.value ? field.value : ''}
                                onChange={(value) => field.onChange(value)}
                            >
                                {options.options.map((opt, i) => {
                                    return (
                                        <Radio.Item
                                            key={i}
                                            value={opt.value}
                                            disabled={disabled}
                                        >
                                            {opt.display}
                                        </Radio.Item>
                                    );
                                })}
                            </Radio>
                        </Form.Field>
                    );
                }}
            />
        );
    } else if (options.component === 'datepicker') {
        return (
            <Controller
                name={name}
                control={control}
                rules={rules}
                render={({ field, fieldState }) => {
                    const hasError = fieldState.error;

                    return (
                        <Form.Field
                            label={label ? returnLabel(label) : null}
                            error={hasError ? error : null}
                            description={description}
                            layout={layout}
                        >
                            <Datepicker
                                id={options.id ? options.id : null}
                                placeholder={options.placeholder}
                                format={options.format}
                                disabled={disabled}
                                valid={!hasError}
                                defaultValue={field.value ? field.value : ''}
                                value={field.value ? field.value : ''}
                                onChange={(value) => field.onChange(value)}
                                // inputProps={rules}
                                // container={options.ref}
                            />
                        </Form.Field>
                    );
                }}
            />
        );
    } else if (options.component === 'file-dropzone') {
        // Still working on it
        return (
            <Controller
                name={name}
                control={control}
                rules={rules}
                render={({ field, fieldState }) => {
                    const hasError = fieldState.error;

                    return (
                        <Form.Field
                            label={label ? returnLabel(label) : null}
                            error={hasError ? error : null}
                            description={description}
                            layout={layout}
                        >
                            <FileDropzone
                                value={field.value ? field.value : null}
                                multiple={
                                    options.multiple ? options.multiple : false
                                }
                                extensions={
                                    options.extensions ? options.extensions : []
                                }
                                description={
                                    options.description
                                        ? options.description
                                        : 'Drag and Drop File(s)'
                                }
                                onChange={(value) => {
                                    field.onChange(value);
                                }}
                                // inputProps={rules}
                            />
                        </Form.Field>
                    );
                }}
            />
        );
    }
};
