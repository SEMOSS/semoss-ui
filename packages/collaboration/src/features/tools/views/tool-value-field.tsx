import { Plus, X } from "lucide-react";
import { type ChangeEvent, useEffect, useId, useRef, useState } from "react";
import {
	Button,
	Field,
	FieldError,
	FieldLabel,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Textarea,
} from "@semoss/ui/next";
import {
	readToolProperty,
	type ToolArgumentError,
	type ToolProperty,
} from "../api/use-tool-definition";
import { resultRecord, toolFieldLabel } from "./tool-result-data";

interface ToolValueFieldProps {
	/** Request field name and optional authoritative reactor schema. */
	name: string;
	property: ToolProperty;
	value: unknown;
	isRequired?: boolean;
	isDisabled: boolean;
	/** The first invalid field and this input's exact path in the request. */
	error?: ToolArgumentError | null;
	path?: string[];
	onChange: (value: unknown) => void;
}

/** Edit structured arguments without losing arrays, false, zero, or omitted values. */
export function ToolValueField({
	name,
	property,
	value,
	isRequired = false,
	isDisabled,
	error,
	path = [name],
	onChange,
}: ToolValueFieldProps) {
	const id = useId();
	const control = useRef<HTMLElement | null>(null);
	const errorId = `${id}-error`;
	const isInvalid = Boolean(
		error && JSON.stringify(error.path) === JSON.stringify(path),
	);
	useEffect(() => {
		if (isInvalid && error && !isDisabled) {
			control.current?.focus();
			document
				.getElementById(errorId)
				?.scrollIntoView({ block: "nearest" });
		}
	}, [isInvalid, error, isDisabled, errorId]);
	// Decide once so editing across a length threshold never replaces the focused input.
	const [isLong] = useState(
		() =>
			/(?:text|body|message|description|prompt|resolution|note|instructions|content|preferences)/i.test(
				name,
			) ||
			(typeof value === "string" &&
				(value.includes("\n") || value.length > 100)),
	);
	// This form owns list edits; stable row IDs keep sibling inputs mounted after removal.
	const [itemKeys, setItemKeys] = useState(() =>
		(Array.isArray(value) ? value : value === undefined ? [] : [value]).map(
			() => crypto.randomUUID(),
		),
	);
	const addButton = useRef<HTMLButtonElement>(null);
	const label = toolFieldLabel(name);
	const type =
		property.type ??
		(Array.isArray(value)
			? "array"
			: value !== null && typeof value === "object"
				? "object"
				: typeof value === "boolean"
					? "boolean"
					: typeof value === "number"
						? "number"
						: "string");
	if (type === "array") {
		const items = Array.isArray(value)
			? value
			: value === undefined
				? []
				: [value];
		return (
			<fieldset
				ref={(element) => {
					control.current = element;
				}}
				tabIndex={-1}
				aria-invalid={isInvalid || undefined}
				aria-describedby={isInvalid ? errorId : undefined}
				disabled={isDisabled}
				className="min-w-0 space-y-2"
			>
				<legend className="mb-2 font-medium text-sm">
					{label}
					{isRequired ? " (required)" : ""}
				</legend>
				{items.map((item, index) => (
					<div
						key={itemKeys[index]}
						className="flex min-w-0 items-start gap-2"
					>
						<div className="min-w-0 flex-1">
							<ToolValueField
								name={`${name} ${index + 1}`}
								property={readToolProperty(property.items)}
								value={item}
								isRequired
								isDisabled={isDisabled}
								path={[...path, String(index)]}
								error={error}
								onChange={(next) =>
									onChange(
										items.map((current, at) =>
											at === index ? next : current,
										),
									)
								}
							/>
						</div>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							disabled={isDisabled}
							onClick={() => {
								setItemKeys((keys) =>
									keys.filter((_, at) => at !== index),
								);
								onChange(items.filter((_, at) => at !== index));
								addButton.current?.focus();
							}}
							aria-label={`Remove ${label.toLowerCase()} ${index + 1}`}
						>
							<X aria-hidden="true" className="size-4" />
						</Button>
					</div>
				))}
				<Button
					ref={addButton}
					type="button"
					size="sm"
					variant="outline"
					disabled={isDisabled}
					onClick={() => {
						setItemKeys((keys) => [...keys, crypto.randomUUID()]);
						onChange([
							...items,
							readToolProperty(property.items).type === "object"
								? {}
								: "",
						]);
					}}
				>
					<Plus aria-hidden="true" className="size-4" />
					Add {label.toLowerCase()}
				</Button>
				{isInvalid && (
					<FieldError id={errorId}>{error?.message}</FieldError>
				)}
			</fieldset>
		);
	}
	if (type === "object") {
		const fields = resultRecord(value) ?? {};
		const properties = resultRecord(property.properties) ?? {};
		const names = [
			...new Set([...Object.keys(fields), ...Object.keys(properties)]),
		];
		const required = Array.isArray(property.required)
			? property.required
			: [];
		return (
			<fieldset
				ref={(element) => {
					control.current = element;
				}}
				tabIndex={-1}
				aria-invalid={isInvalid || undefined}
				aria-describedby={isInvalid ? errorId : undefined}
				disabled={isDisabled}
				className="min-w-0 space-y-3"
			>
				<legend className="mb-2 font-medium text-sm">{label}</legend>
				{names.map((key) => (
					<ToolValueField
						key={key}
						name={key}
						property={readToolProperty(properties[key])}
						value={fields[key]}
						isRequired={required.includes(key)}
						isDisabled={isDisabled}
						path={[...path, key]}
						error={error}
						onChange={(next) => {
							const updated = { ...fields };
							if (next === undefined) delete updated[key];
							else updated[key] = next;
							onChange(updated);
						}}
					/>
				))}
				{isInvalid && (
					<FieldError id={errorId}>{error?.message}</FieldError>
				)}
			</fieldset>
		);
	}
	const isNumber = type === "number" || type === "integer";
	const choices = type === "boolean" ? ["true", "false"] : property.enum;
	const inputProps = {
		id,
		ref: (element: HTMLInputElement | HTMLTextAreaElement | null) => {
			control.current = element;
		},
		"aria-invalid": isInvalid || undefined,
		"aria-describedby": isInvalid ? errorId : undefined,
		disabled: isDisabled,
		required: isRequired,
		value:
			typeof value === "string" || typeof value === "number" ? value : "",
		onChange: (
			event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
		) =>
			onChange(
				isNumber
					? event.target.value === ""
						? undefined
						: Number(event.target.value)
					: event.target.value === "" && !isRequired
						? undefined
						: event.target.value,
			),
	};
	return (
		<Field data-invalid={isInvalid || undefined}>
			<FieldLabel htmlFor={id}>
				{label}
				{isRequired ? " (required)" : ""}
			</FieldLabel>
			{choices ? (
				<Select
					value={
						value === undefined ? "unset" : `value:${String(value)}`
					}
					disabled={isDisabled}
					onValueChange={(next) =>
						onChange(
							next === "unset"
								? undefined
								: type === "boolean"
									? next === "value:true"
									: next.slice(6),
						)
					}
				>
					<SelectTrigger
						ref={(element) => {
							control.current = element;
						}}
						id={id}
						aria-required={isRequired}
						aria-invalid={isInvalid || undefined}
						aria-describedby={isInvalid ? errorId : undefined}
					>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="unset">Not set</SelectItem>
						{choices.map((choice) => (
							<SelectItem key={choice} value={`value:${choice}`}>
								{type === "boolean"
									? choice === "true"
										? "Yes"
										: "No"
									: choice || "Empty text"}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			) : isLong ? (
				<Textarea
					{...inputProps}
					rows={4}
					className="min-h-24 resize-y"
				/>
			) : (
				<Input
					{...inputProps}
					type={isNumber ? "number" : "text"}
					step={type === "integer" ? 1 : "any"}
					min={property.minimum}
					max={property.maximum}
				/>
			)}
			{isInvalid && (
				<FieldError id={errorId}>{error?.message}</FieldError>
			)}
		</Field>
	);
}
