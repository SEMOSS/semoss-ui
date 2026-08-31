import * as React from "react";
import {
	type Control,
	Controller,
	type ControllerProps,
	type FieldPath,
	type FieldValues,
	FormProvider,
	type SubmitErrorHandler,
	type SubmitHandler,
	type UseFormReturn,
	type UseFormSetValue,
	useFormContext,
} from "react-hook-form";
import { Button } from "@/next/button";
import { Checkbox } from "@/next/checkbox";
import {
	Field,
	FieldContent,
	FieldDescription,
	FieldError,
	FieldLabel,
} from "@/next/field";
import { FileDropzone, type FileDropzoneProps } from "@/next/file-dropzone";
import { Input } from "@/next/input";
import { RadioGroup } from "@/next/radio-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/next/select";
import { Slider } from "@/next/slider";
import { Spinner } from "@/next/spinner";
import { Switch } from "@/next/switch";
import { Textarea } from "@/next/textarea";

/* -------------------------------------------------------------------------- */
/*                               Core primitives                              */
/* -------------------------------------------------------------------------- */
type FormProps<
	TFieldValues extends FieldValues = FieldValues,
	TContext = unknown,
	TTransformedValues = TFieldValues,
> = Omit<React.ComponentProps<"form">, "onSubmit"> & {
	form: UseFormReturn<TFieldValues, TContext, TTransformedValues>;
	onSubmit: SubmitHandler<TTransformedValues>;
	onError?: SubmitErrorHandler<TFieldValues>;
	children: React.ReactNode;
};

const Form = <
	TFieldValues extends FieldValues = FieldValues,
	TContext = unknown,
	TTransformedValues = TFieldValues,
>({
	form,
	children,
	onSubmit,
	onError,
	...otherProps
}: FormProps<TFieldValues, TContext, TTransformedValues>) => {
	return (
		<FormProvider {...form}>
			<form
				onSubmit={form.handleSubmit(onSubmit, onError)}
				{...otherProps}
			>
				{children}
			</form>
		</FormProvider>
	);
};

const FormField = <
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
	props: ControllerProps<TFieldValues, TName>,
) => {
	return <Controller {...props} />;
};

/* -------------------------------------------------------------------------- */
/*                               Field wrappers                               */
/* -------------------------------------------------------------------------- */

type FormFieldBaseProps = {
	/** Name of the field, matching a key in the form schema. */
	name: string;
	/** Optional label rendered above (or beside) the control. */
	label?: React.ReactNode;
	/** Optional helper text rendered below the control. */
	description?: React.ReactNode;
	/** Class applied to the wrapping `Field`. */
	className?: string;
};

type FormInputProps = FormFieldBaseProps &
	Omit<
		React.ComponentProps<typeof Input>,
		"name" | "value" | "onChange" | "defaultValue"
	>;

function FormInput({
	name,
	label,
	description,
	className,
	...inputProps
}: FormInputProps) {
	const { control } = useFormContext();
	const id = React.useId();

	return (
		<FormField
			control={control}
			name={name}
			render={({ field, fieldState }) => (
				<Field data-invalid={!!fieldState.error} className={className}>
					{label && <FieldLabel htmlFor={id}>{label}</FieldLabel>}
					<Input
						{...inputProps}
						id={id}
						aria-invalid={!!fieldState.error}
						{...field}
					/>
					{description && (
						<FieldDescription>{description}</FieldDescription>
					)}
					{fieldState.error?.message && (
						<FieldError>{fieldState.error.message}</FieldError>
					)}
				</Field>
			)}
		/>
	);
}

type FormTextareaProps = FormFieldBaseProps &
	Omit<
		React.ComponentProps<typeof Textarea>,
		"name" | "value" | "onChange" | "defaultValue"
	>;

function FormTextarea({
	name,
	label,
	description,
	className,
	...textareaProps
}: FormTextareaProps) {
	const { control } = useFormContext();
	const id = React.useId();

	return (
		<FormField
			control={control}
			name={name}
			render={({ field, fieldState }) => (
				<Field data-invalid={!!fieldState.error} className={className}>
					{label && <FieldLabel htmlFor={id}>{label}</FieldLabel>}
					<Textarea
						{...textareaProps}
						id={id}
						aria-invalid={!!fieldState.error}
						{...field}
					/>
					{description && (
						<FieldDescription>{description}</FieldDescription>
					)}
					{fieldState.error?.message && (
						<FieldError>{fieldState.error.message}</FieldError>
					)}
				</Field>
			)}
		/>
	);
}

type FormCheckboxProps = FormFieldBaseProps &
	Omit<
		React.ComponentProps<typeof Checkbox>,
		"checked" | "onCheckedChange" | "defaultChecked" | "name"
	>;

function FormCheckbox({
	name,
	label,
	description,
	className,
	...checkboxProps
}: FormCheckboxProps) {
	const { control } = useFormContext();
	const id = React.useId();

	return (
		<FormField
			control={control}
			name={name}
			render={({ field, fieldState }) => (
				<Field
					orientation="horizontal"
					data-invalid={!!fieldState.error}
					className={className}
				>
					<Checkbox
						{...checkboxProps}
						id={id}
						aria-invalid={!!fieldState.error}
						checked={field.value}
						onCheckedChange={field.onChange}
						onBlur={field.onBlur}
						name={field.name}
					/>
					<FieldContent>
						{label && (
							<FieldLabel htmlFor={id} className="font-normal">
								{label}
							</FieldLabel>
						)}
						{description && (
							<FieldDescription>{description}</FieldDescription>
						)}
						{fieldState.error?.message && (
							<FieldError>{fieldState.error.message}</FieldError>
						)}
					</FieldContent>
				</Field>
			)}
		/>
	);
}

type FormSwitchProps = FormFieldBaseProps &
	Omit<
		React.ComponentProps<typeof Switch>,
		"checked" | "onCheckedChange" | "defaultChecked" | "name"
	>;

function FormSwitch({
	name,
	label,
	description,
	className,
	...switchProps
}: FormSwitchProps) {
	const { control } = useFormContext();
	const id = React.useId();

	return (
		<FormField
			control={control}
			name={name}
			render={({ field, fieldState }) => (
				<Field
					orientation="horizontal"
					data-invalid={!!fieldState.error}
					className={className}
				>
					<Switch
						{...switchProps}
						id={id}
						aria-invalid={!!fieldState.error}
						checked={field.value}
						onCheckedChange={field.onChange}
						onBlur={field.onBlur}
						name={field.name}
					/>
					<FieldContent>
						{label && (
							<FieldLabel htmlFor={id} className="font-normal">
								{label}
							</FieldLabel>
						)}
						{description && (
							<FieldDescription>{description}</FieldDescription>
						)}
						{fieldState.error?.message && (
							<FieldError>{fieldState.error.message}</FieldError>
						)}
					</FieldContent>
				</Field>
			)}
		/>
	);
}

type FormSelectProps = FormFieldBaseProps &
	Omit<
		React.ComponentProps<typeof Select>,
		"value" | "onValueChange" | "defaultValue"
	> & {
		/** Placeholder shown when no value is selected. */
		placeholder?: string;
		/** Class applied to the `SelectTrigger`. */
		triggerClassName?: string;
	};

function FormSelect({
	name,
	label,
	description,
	className,
	placeholder,
	triggerClassName,
	children,
	...selectProps
}: FormSelectProps) {
	const { control } = useFormContext();
	const id = React.useId();

	return (
		<FormField
			control={control}
			name={name}
			render={({ field, fieldState }) => (
				<Field data-invalid={!!fieldState.error} className={className}>
					{label && <FieldLabel htmlFor={id}>{label}</FieldLabel>}
					<Select
						{...selectProps}
						value={field.value}
						onValueChange={field.onChange}
						name={field.name}
					>
						<SelectTrigger
							id={id}
							aria-invalid={!!fieldState.error}
							className={triggerClassName}
						>
							<SelectValue placeholder={placeholder} />
						</SelectTrigger>
						<SelectContent>{children}</SelectContent>
					</Select>
					{description && (
						<FieldDescription>{description}</FieldDescription>
					)}
					{fieldState.error?.message && (
						<FieldError>{fieldState.error.message}</FieldError>
					)}
				</Field>
			)}
		/>
	);
}

const FormSelectItem = SelectItem;

type FormRadioGroupProps = FormFieldBaseProps &
	Omit<
		React.ComponentProps<typeof RadioGroup>,
		"value" | "onValueChange" | "defaultValue"
	>;

function FormRadioGroup({
	name,
	label,
	description,
	className,
	children,
	...radioProps
}: FormRadioGroupProps) {
	const { control } = useFormContext();
	const id = React.useId();

	return (
		<FormField
			control={control}
			name={name}
			render={({ field, fieldState }) => (
				<Field data-invalid={!!fieldState.error} className={className}>
					{label && <FieldLabel htmlFor={id}>{label}</FieldLabel>}
					<RadioGroup
						{...radioProps}
						id={id}
						aria-invalid={!!fieldState.error}
						value={field.value}
						onValueChange={field.onChange}
						onBlur={field.onBlur}
						name={field.name}
					>
						{children}
					</RadioGroup>
					{description && (
						<FieldDescription>{description}</FieldDescription>
					)}
					{fieldState.error?.message && (
						<FieldError>{fieldState.error.message}</FieldError>
					)}
				</Field>
			)}
		/>
	);
}

type FormSliderProps = FormFieldBaseProps &
	Omit<
		React.ComponentProps<typeof Slider>,
		"value" | "onValueChange" | "defaultValue"
	>;

function FormSlider({
	name,
	label,
	description,
	className,
	...sliderProps
}: FormSliderProps) {
	const { control } = useFormContext();
	const id = React.useId();

	return (
		<FormField
			control={control}
			name={name}
			render={({ field, fieldState }) => {
				// Support both a single number and a `[min, max]` range value.
				const isRange = Array.isArray(field.value);
				const value = isRange
					? (field.value as number[])
					: [(field.value as number) ?? sliderProps.min ?? 0];

				return (
					<Field
						data-invalid={!!fieldState.error}
						className={className}
					>
						{label && <FieldLabel htmlFor={id}>{label}</FieldLabel>}
						<Slider
							{...sliderProps}
							id={id}
							aria-invalid={!!fieldState.error}
							value={value}
							onValueChange={(next) =>
								field.onChange(isRange ? next : next[0])
							}
							onBlur={field.onBlur}
							name={field.name}
						/>
						{description && (
							<FieldDescription>{description}</FieldDescription>
						)}
						{fieldState.error?.message && (
							<FieldError>{fieldState.error.message}</FieldError>
						)}
					</Field>
				);
			}}
		/>
	);
}

type FormFileDropzoneProps = FormFieldBaseProps &
	Omit<FileDropzoneProps, "value" | "onChange">;

function FormFileDropzone({
	name,
	label,
	description,
	className,
	...dropzoneProps
}: FormFileDropzoneProps) {
	const { control } = useFormContext();
	const id = React.useId();

	return (
		<FormField
			control={control}
			name={name}
			render={({ field, fieldState }) => (
				<Field data-invalid={!!fieldState.error} className={className}>
					{label && <FieldLabel htmlFor={id}>{label}</FieldLabel>}
					<FileDropzone
						{...dropzoneProps}
						value={field.value ?? null}
						onChange={field.onChange}
					/>
					{description && (
						<FieldDescription>{description}</FieldDescription>
					)}
					{fieldState.error?.message && (
						<FieldError>{fieldState.error.message}</FieldError>
					)}
				</Field>
			)}
		/>
	);
}

/* -------------------------------------------------------------------------- */
/*                                Form Actions                                */
/* -------------------------------------------------------------------------- */

type FormActionsProps = {
	/** Mirrors form.formState.isSubmitting — disables both buttons and shows the Spinner. */
	isSubmitting: boolean;
	/** Called when the user clicks Cancel. */
	onCancel: () => void;
	/** Label for the submit button. Defaults to "Save". */
	submitLabel?: string;
	/** Class applied to the wrapping div. */
	className?: string;
};

function FormActions({
	isSubmitting,
	onCancel,
	submitLabel = "Save",
	className,
}: FormActionsProps) {
	return (
		<div className={`flex justify-end gap-2 ${className ?? ""}`}>
			<Button
				type="button"
				variant="outline"
				disabled={isSubmitting}
				onClick={onCancel}
			>
				Cancel
			</Button>
			<Button type="submit" disabled={isSubmitting}>
				{isSubmitting && <Spinner className="size-4" />}
				{submitLabel}
			</Button>
		</div>
	);
}

/* -------------------------------------------------------------------------- */
/*                                  Exports                                    */
/* -------------------------------------------------------------------------- */

export {
	Form,
	FormField,
	// Field wrappers
	FormInput,
	FormTextarea,
	FormCheckbox,
	FormSwitch,
	FormSelect,
	FormSelectItem,
	FormRadioGroup,
	FormSlider,
	FormFileDropzone,
	FormActions,
};

export type {
	FormFieldBaseProps,
	FormInputProps,
	FormTextareaProps,
	FormCheckboxProps,
	FormSwitchProps,
	FormSelectProps,
	FormRadioGroupProps,
	FormSliderProps,
	FormFileDropzoneProps,
	FormActionsProps,
};

export { zodResolver } from "@hookform/resolvers/zod";
// Bare-minimum re-exports so a full form can be built from a single import.
export { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
export type { Control, UseFormSetValue };
export { z } from "zod";
