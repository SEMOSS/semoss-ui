import { Controller, Control, FieldValues, Path } from 'react-hook-form';
import {
    styled,
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
        value: string | boolean;
    }[];
} & Omit<RadioProps, 'onChange' | 'value' | 'defaultValue'>;

type FieldRadio2 = {
    component: 'radio2';
    options: {
        display: string;
        value: string | boolean;
    }[];
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
    rules: Record<string,unknown>;
    options:
        | FieldInput
        | FieldNumberpicker
        | FieldSelect
        | FieldTextarea
        | FieldSwitch
        | FieldCheckbox
        | FieldChecklist
        | FieldRadio
        | FieldRadio2
        | FieldDatepicker
        | FieldFileDropzone
        | FieldTypeahead;
    description?: string;
    label?: string;
    error?: string;
    disabled?: boolean;
    layout?: FormFieldProps['layout'];
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
        rules = {},
        options,
        description,
        // optional
        label,
        error,
        disabled,
        layout,
    } = props;

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
                            label={label ? returnLabel(label) : null}
                            error={hasError ? error : null}
                            description={description}
                            layout={layout}
                        >
                            <Input
                                // {...options}
                                id={options.id}
                                size={options.size ? options.size : 'md'}
                                placeholder={options.placeholder}
                                autoComplete={options.autoComplete}
                                type={options.type}
                                disabled={disabled ? disabled : false}
                                valid={!hasError}
                                value={field.value ? field.value : ''}
                                onChange={(value) => field.onChange(value)}
                                inputProps={options.inputProps}
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
                                textareaProps={options.textareaProps}
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
                            label={label ? returnLabel(label) : null}
                            error={hasError ? error : null}
                            description={description}
                            layout={layout}
                        >
                            <Select
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
                            <Switch
                                id={options.id}
                                disabled={disabled}
                                valid={!hasError}
                                value={field.value ? field.value : false}
                                defaultValue={field.value ? field.value : false}
                                onChange={(value) => field.onChange(value)}
                                // inputProps={rules}
                            >
                                {options.children}
                            </Switch>
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
                                id={options.id}
                                indeterminate={options.indeterminate}
                                disabled={disabled}
                                valid={!hasError}
                                value={field.value ? field.value : false}
                                defaultValue={field.value ? field.value : false}
                                onChange={(value) => field.onChange(value)}
                                // inputProps={rules}
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
                rules={
                    rules['required'] === true
                        ? {
                              validate: validateBoolean,
                          }
                        : rules
                }
                render={({ field, fieldState }) => {
                    const hasError = fieldState.error;

                    return (
                        <Form.Field
                            label={label ? returnLabel(label) : null}
                            error={hasError ? error : null}
                            description={description}
                            layout={layout}
                            labelProps={{
                                style: {
                                    overflow: 'visible',
                                },
                            }}
                        >
                            <Radio
                                orientation={options.orientation}
                                defaultValue={field.value ? field.value : ''}
                                value={
                                    typeof field.value !== 'undefined' &&
                                    field.value !== null &&
                                    field.value !== ''
                                        ? options.options.find(
                                              (opt) =>
                                                  opt.value === field.value,
                                          )?.display
                                        : ''
                                }
                                onChange={(value) => {
                                    field.onChange(
                                        options.options.find(
                                            (opt) => opt.display === value,
                                        )?.value,
                                    );
                                }}
                            >
                                {options.options.map((opt, i) => {
                                    return (
                                        <Radio.Item
                                            key={i}
                                            value={opt.display}
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
    } else if (options.component === 'radio2') {
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
                            labelProps={{
                                style: {
                                    overflow: 'visible',
                                },
                            }}
                        >
                            <Radio
                                orientation={options.orientation}
                                defaultValue={field.value ? field.value : ''}
                                value={
                                    typeof field.value !== 'undefined' &&
                                    field.value !== null &&
                                    field.value !== ''
                                        ? options.options.find(
                                              (opt) =>
                                                  opt.value === field.value,
                                          )?.display
                                        : ''
                                }
                                onChange={(value) => {
                                    field.onChange(
                                        options.options.find(
                                            (opt) => opt.display === value,
                                        )?.value,
                                    );
                                }}
                            >
                                {options.options.map((opt, i) => {
                                    return (
                                        <Radio.Item
                                            key={i}
                                            value={opt.display}
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
            <Controllers
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

    return <></>;
};