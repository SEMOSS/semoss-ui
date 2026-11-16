import { useTranslation } from "@semoss/i18n";
import {
	Badge,
	Checkbox,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Textarea,
} from "@semoss/ui/next";
import { CollapsibleField } from "./collapsible-field";
import { JSONEditor } from "./json-editor";

/** Props for {@link ToolField}. */
interface ToolFieldProps<T = unknown> {
	/** The parameter's name, shown as is and used as the input's id. */
	fieldName: string;
	/** JSON schema definition for the field. */
	fieldSchema: {
		/** JSON schema type (string, number, boolean, array, object, etc.) */
		type?: string;
		/** Allowed enum values for string types */
		enum?: string[];
		/** Schema for array item types */
		items?: unknown;
		/** Minimum value for numeric types */
		minimum?: number;
		/** Maximum value for numeric types */
		maximum?: number;
		/** Minimum length for string types */
		minLength?: number;
		/** Maximum length for string types */
		maxLength?: number;
		/** Regex pattern for string validation */
		pattern?: string;
		/** Format hint (e.g., 'date', 'email') */
		format?: string;
		/** Default value for the field */
		default?: unknown;
		/** Human-readable description of the field */
		description?: string;
	};
	/** Whether this field is required, which marks its label. */
	required?: boolean;
	/** Whether the field is read-only. */
	disabled?: boolean;
	/** Current value of the field. */
	value: T;
	/** Called with the field's next value as the user edits it. */
	onChange: (value: T) => void;
}

/**
 * One parameter of a tool call's default form, drawn by its JSON schema type: a
 * select for an enum, a text input or a collapsible textarea for a string, a
 * number input, a checkbox, a collapsible textarea for an array, and a JSON
 * editor for an object.
 */
export const ToolField = ({
	fieldName,
	fieldSchema,
	required = false,
	disabled = false,
	value,
	onChange,
}: ToolFieldProps) => {
	const { t } = useTranslation("mcp");
	// Show the raw parameter name, so the default view shows the exact keys to debug with
	const displayName = fieldName;

	switch (fieldSchema.type) {
		case "string": {
			if (fieldSchema.enum) {
				return (
					<div key={fieldName} className="space-y-1">
						<div className="mb-2 flex items-center gap-2">
							<Label
								htmlFor={fieldName}
								className="font-semibold"
							>
								{displayName}
								{required && (
									<span className="text-destructive"> *</span>
								)}
							</Label>
							<Badge variant="outline" className="text-xs">
								{fieldSchema.type}
							</Badge>
						</div>
						<Select
							value={value as string}
							onValueChange={onChange}
							disabled={disabled}
						>
							<SelectTrigger className="w-full">
								<SelectValue
									placeholder={t("tools.selectField", {
										field: displayName,
									})}
								/>
							</SelectTrigger>
							<SelectContent>
								{fieldSchema.enum.map((option: string) => (
									<SelectItem key={option} value={option}>
										{option}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{fieldSchema.description && (
							<p className="text-muted-foreground text-sm">
								{fieldSchema.description}
							</p>
						)}
					</div>
				);
			}

			const stringValue = typeof value === "string" ? value : "";
			const lineCount = stringValue.split("\n").length;
			// Long or multiline text gets a textarea
			const isMultiline =
				lineCount > 1 ||
				stringValue.length > 100 ||
				(fieldSchema.maxLength !== undefined &&
					fieldSchema.maxLength > 100);

			if (isMultiline) {
				// A read-only textarea grows to its text, within limits
				const rows = disabled
					? Math.min(12, Math.max(3, lineCount))
					: 4;
				return (
					<CollapsibleField
						key={fieldName}
						fieldName={displayName}
						required={required}
						badge={fieldSchema.type ?? "string"}
					>
						<Textarea
							id={fieldName}
							value={stringValue}
							onChange={(e) => onChange(e.target.value)}
							placeholder={t("tools.enterField", {
								field: displayName,
							})}
							rows={rows}
							className="w-full resize-none font-mono text-sm"
							readOnly={disabled}
						/>
						{fieldSchema.description && (
							<p className="text-muted-foreground text-sm">
								{fieldSchema.description}
							</p>
						)}
					</CollapsibleField>
				);
			}

			return (
				<div key={fieldName} className="space-y-1">
					<div className="mb-2 flex items-center gap-2">
						<Label htmlFor={fieldName} className="font-semibold">
							{displayName}
							{required && (
								<span className="text-destructive"> *</span>
							)}
						</Label>
						<Badge variant="outline" className="text-xs">
							{fieldSchema.type}
						</Badge>
					</div>
					<Input
						id={fieldName}
						value={stringValue}
						onChange={(e) => onChange(e.target.value)}
						placeholder={t("tools.enterField", {
							field: displayName,
						})}
						className="w-full"
						readOnly={disabled}
					/>
					{fieldSchema.description && (
						<p className="text-muted-foreground text-sm">
							{fieldSchema.description}
						</p>
					)}
				</div>
			);
		}

		// Numeric fields (number or integer)
		case "number":
		case "integer":
			return (
				<div key={fieldName} className="space-y-1">
					<div className="mb-2 flex items-center gap-2">
						<Label htmlFor={fieldName} className="font-semibold">
							{displayName}
							{required && (
								<span className="text-destructive"> *</span>
							)}
						</Label>
						<Badge variant="outline" className="text-xs">
							{fieldSchema.type}
						</Badge>
					</div>
					<Input
						id={fieldName}
						type="number"
						value={value as number}
						onChange={(e) =>
							onChange(Number.parseFloat(e.target.value))
						}
						placeholder={t("tools.enterField", {
							field: displayName,
						})}
						min={fieldSchema.minimum}
						max={fieldSchema.maximum}
						className="w-full"
						readOnly={disabled}
					/>
					{fieldSchema.description && (
						<p className="text-muted-foreground text-sm">
							{fieldSchema.description}
						</p>
					)}
				</div>
			);

		case "boolean":
			return (
				<div key={fieldName} className="space-y-1">
					<div className="mb-2 flex items-center gap-2">
						<div className="flex size-6 shrink-0 items-center justify-center">
							<Checkbox
								id={fieldName}
								checked={(value as boolean) || false}
								onCheckedChange={(checked) => onChange(checked)}
								disabled={disabled}
							/>
						</div>
						<Label htmlFor={fieldName} className="font-semibold">
							{displayName}
							{required && (
								<span className="text-destructive"> *</span>
							)}
						</Label>
						<Badge variant="outline" className="text-xs">
							{fieldSchema.type}
						</Badge>
					</div>
					{fieldSchema.description && (
						<p className="text-muted-foreground text-sm">
							{fieldSchema.description}
						</p>
					)}
				</div>
			);

		case "array":
			return (
				<CollapsibleField
					key={fieldName}
					fieldName={displayName}
					required={required}
					badge={fieldSchema.type ?? "array"}
				>
					<Textarea
						id={fieldName}
						value={
							Array.isArray(value)
								? JSON.stringify(value, null, 2)
								: (value as string)
						}
						onChange={(e) => {
							try {
								onChange(JSON.parse(e.target.value));
							} catch {
								onChange(
									e.target.value
										.split(",")
										.map((s) => s.trim()),
								);
							}
						}}
						placeholder={t("tools.enterValues")}
						rows={2}
						className="w-full"
						readOnly={disabled}
					/>
					{fieldSchema.description && (
						<p className="text-muted-foreground text-sm">
							{fieldSchema.description}
						</p>
					)}
				</CollapsibleField>
			);

		case "object": {
			// An object may hold any JSON, nested or not, so it gets the JSON editor
			const obj =
				value && typeof value === "object"
					? (value as Record<string, unknown>)
					: {};
			return (
				<CollapsibleField
					key={fieldName}
					fieldName={displayName}
					required={required}
					badge="object"
				>
					<JSONEditor
						value={obj}
						onChange={onChange}
						disabled={disabled}
					/>
					{fieldSchema.description && (
						<p className="text-muted-foreground text-sm">
							{fieldSchema.description}
						</p>
					)}
				</CollapsibleField>
			);
		}

		default:
			return (
				<div key={fieldName} className="space-y-1">
					<div className="mb-2 flex items-center gap-2">
						<Label htmlFor={fieldName} className="font-semibold">
							{displayName}
							{required && (
								<span className="text-destructive"> *</span>
							)}
						</Label>
						<Badge variant="outline" className="text-xs">
							{fieldSchema.type || "unknown"}
						</Badge>
					</div>
					<Input
						id={fieldName}
						value={value as string}
						onChange={(e) => onChange(e.target.value)}
						placeholder={t("tools.enterField", {
							field: displayName,
						})}
						className="w-full"
					/>
				</div>
			);
	}
};
