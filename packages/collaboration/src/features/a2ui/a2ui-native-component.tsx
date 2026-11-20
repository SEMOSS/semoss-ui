import type { ReactA2uiComponentProps } from "@a2ui/react";
import { Fragment, useId } from "react";
import {
	Button,
	Card,
	CardContent,
	Checkbox,
	cn,
	Field,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSet,
	Input,
	Muted,
	RadioGroup,
	RadioGroupItem,
	Separator,
	Textarea,
} from "@semoss/ui/next";
import { isRecord } from "@semoss/utility/object";

/** Adapt SDK-resolved catalog values to SEMOSS controls; the SDK owns field bindings. */
export function A2uiNativeComponent({
	props,
	context,
	buildChild,
}: ReactA2uiComponentProps<Record<string, unknown>>) {
	const id = useId();
	const kind = context.componentModel.type;
	const label = typeof props.label === "string" ? props.label : kind;
	const value = props.value;
	const setValue = (next: string | number | boolean | string[]): void => {
		if (typeof props.setValue === "function") props.setValue(next);
	};
	const child = (entry: unknown) => {
		if (typeof entry === "string")
			return <Fragment key={entry}>{buildChild(entry)}</Fragment>;
		if (isRecord(entry) && typeof entry.id === "string")
			return (
				<Fragment key={entry.id}>
					{buildChild(
						entry.id,
						typeof entry.basePath === "string"
							? entry.basePath
							: undefined,
					)}
				</Fragment>
			);
		return null;
	};
	switch (kind) {
		case "Text":
			return (
				<Muted
					className={cn(
						"wrap-anywhere block min-w-0 whitespace-pre-wrap font-normal text-base leading-normal",
						props.variant === "caption"
							? "text-muted-foreground text-sm"
							: "text-inherit",
					)}
				>
					{typeof props.text === "string" ? props.text : ""}
				</Muted>
			);
		case "Row":
		case "Column":
			return (
				<div
					className={cn(
						"flex min-w-0 gap-4",
						kind === "Row" ? "flex-wrap items-center" : "flex-col",
					)}
				>
					{Array.isArray(props.children)
						? props.children.map(child)
						: null}
				</div>
			);
		case "Card":
			return (
				<Card>
					<CardContent>{child(props.child)}</CardContent>
				</Card>
			);
		case "Divider":
			return (
				<Separator
					orientation={
						props.axis === "vertical" ? "vertical" : "horizontal"
					}
				/>
			);
		case "Button":
			return (
				<Button
					type="button"
					variant={
						props.variant === "primary"
							? "default"
							: props.variant === "borderless"
								? "ghost"
								: "outline"
					}
					className="h-auto min-h-10 max-w-full whitespace-normal"
					onClick={() => {
						if (typeof props.action === "function")
							void props.action();
					}}
				>
					{child(props.child)}
				</Button>
			);
		case "CheckBox":
			return (
				<Field orientation="horizontal">
					<Checkbox
						id={id}
						checked={value === true}
						onCheckedChange={(checked) =>
							setValue(checked === true)
						}
					/>
					<FieldLabel htmlFor={id}>{label}</FieldLabel>
				</Field>
			);
		case "ChoicePicker": {
			const selected = Array.isArray(value)
				? value.filter(
						(entry): entry is string => typeof entry === "string",
					)
				: [];
			const options = Array.isArray(props.options)
				? props.options.filter(
						(option): option is { value: string; label: string } =>
							isRecord(option) &&
							typeof option.value === "string" &&
							typeof option.label === "string",
					)
				: [];
			return (
				<FieldSet>
					<FieldLegend>{label}</FieldLegend>
					{props.variant === "multipleSelection" ? (
						<FieldGroup>
							{options.map((option, index) => {
								const optionValue = option.value;
								return (
									<Field
										key={optionValue}
										orientation="horizontal"
									>
										<Checkbox
											id={`${id}-${index}`}
											checked={selected.includes(
												optionValue,
											)}
											onCheckedChange={(checked) =>
												setValue(
													checked === true
														? [
																...selected.filter(
																	(item) =>
																		item !==
																		optionValue,
																),
																optionValue,
															]
														: selected.filter(
																(item) =>
																	item !==
																	optionValue,
															),
												)
											}
										/>
										<FieldLabel htmlFor={`${id}-${index}`}>
											{option.label}
										</FieldLabel>
									</Field>
								);
							})}
						</FieldGroup>
					) : (
						<RadioGroup
							aria-label={label}
							value={selected[0] ?? ""}
							onValueChange={(next) => setValue([next])}
						>
							{options.map((option, index) => (
								<Field
									key={option.value}
									orientation="horizontal"
								>
									<RadioGroupItem
										id={`${id}-${index}`}
										value={option.value}
									/>
									<FieldLabel htmlFor={`${id}-${index}`}>
										{option.label}
									</FieldLabel>
								</Field>
							))}
						</RadioGroup>
					)}
				</FieldSet>
			);
		}
		case "TextField":
		case "DateTimeInput":
		case "Slider": {
			const type =
				kind === "Slider"
					? "range"
					: kind === "DateTimeInput"
						? props.enableDate && props.enableTime
							? "datetime-local"
							: props.enableTime
								? "time"
								: "date"
						: props.variant === "number"
							? "number"
							: "text";
			const textValue =
				typeof value === "string" || typeof value === "number"
					? value
					: "";
			const min =
				kind === "Slider"
					? typeof props.min === "number"
						? props.min
						: 0
					: undefined;
			const max =
				typeof props.max === "number" || typeof props.max === "string"
					? props.max
					: undefined;
			const placeholder =
				typeof props.placeholder === "string"
					? props.placeholder
					: undefined;
			return (
				<Field>
					<FieldLabel htmlFor={id}>
						{label}
						{kind === "Slider" && typeof value === "number"
							? `: ${value}`
							: null}
					</FieldLabel>
					{kind === "TextField" && props.variant === "longText" ? (
						<Textarea
							id={id}
							value={textValue}
							placeholder={placeholder}
							onChange={(event) => setValue(event.target.value)}
						/>
					) : (
						<Input
							id={id}
							type={type}
							value={textValue}
							min={min}
							max={max}
							step={
								kind === "Slider" &&
								typeof min === "number" &&
								typeof max === "number" &&
								typeof props.steps === "number"
									? (max - min) / props.steps
									: kind === "Slider" || type === "number"
										? "any"
										: undefined
							}
							placeholder={placeholder}
							onChange={(event) =>
								setValue(
									kind === "Slider"
										? event.target.valueAsNumber
										: event.target.value,
								)
							}
						/>
					)}
				</Field>
			);
		}
		default:
			throw new Error("Unsupported interface component.");
	}
}
