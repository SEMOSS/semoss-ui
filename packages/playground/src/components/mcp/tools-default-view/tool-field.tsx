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
import { capitalizeWords } from "@/utility";
import { JSONEditor } from "./json-editor";

export interface ToolFieldProps<T = unknown> {
	/** The name of the field */
	fieldName: string;
	/** JSON schema definition for the field */
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
	/** Whether this field is required */
	required?: boolean;
	/** Whether the field is disabled */
	disabled?: boolean;
	/** Current value of the field */
	value: T;
	/** Callback fired when the field value changes */
	onChange: (value: T) => void;
}

/**
 * A dynamic form field component that renders different input types based on JSON schema
 *
 * @component
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
	const displayName = capitalizeWords(fieldName);

	switch (fieldSchema.type) {
		case "string":
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
										{capitalizeWords(option)}
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
			if (fieldSchema.maxLength && fieldSchema.maxLength > 100) {
				return (
					<div key={fieldName} className="space-y-1">
						<div className="mb-2 flex items-center gap-2">
							<Label
								htmlFor={fieldName}
								className="font-semibold"
							>
								{displayName}
								{required && (
									// Default: render text input for strings
									<span className="text-destructive"> *</span>
								)}
							</Label>
							<Badge variant="outline" className="text-xs">
								{fieldSchema.type}
							</Badge>
						</div>
						<Textarea
							id={fieldName}
							value={value as string}
							onChange={(e) => onChange(e.target.value)}
							placeholder={t("tools.enterField", {
								field: displayName,
							})}
							rows={4}
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
						value={value as string}
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
				<div key={fieldName} className="flex items-center space-x-2">
					<Checkbox
						id={fieldName}
						checked={(value as boolean) || false}
						onCheckedChange={(checked) => onChange(checked)}
						disabled={disabled}
					/>
					<div className="space-y-1">
						<div className="flex items-center gap-2">
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
						{fieldSchema.description && (
							<p className="text-muted-foreground text-sm">
								{fieldSchema.description}
							</p>
						)}
					</div>
				</div>
			);

		case "array":
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
				</div>
			);

		case "object": {
			// treat object as arbitrary JSON (may be nested) — use JSONEditor for full flexibility
			const obj =
				value && typeof value === "object"
					? (value as Record<string, unknown>)
					: {};
			return (
				<div key={fieldName} className="space-y-2">
					<div className="mb-2 flex items-center gap-2">
						<Label htmlFor={fieldName} className="font-semibold">
							{displayName}
							{required && (
								<span className="text-destructive"> *</span>
							)}
						</Label>
						<Badge variant="outline" className="text-xs">
							object
						</Badge>
					</div>
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
				</div>
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
