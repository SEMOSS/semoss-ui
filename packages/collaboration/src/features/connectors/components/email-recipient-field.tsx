import { X } from "lucide-react";
import {
	type ReactNode,
	useId,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import {
	Button,
	cn,
	Field,
	FieldDescription,
	FieldError,
	FieldLabel,
	FormField,
	Input,
	InputGroup,
	InputGroupInput,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	useFormContext,
	z,
} from "@semoss/ui/next";

// the same check parseAddresses applies when the form validates
const emailAddress = z.email();

interface EmailRecipientFieldProps {
	/** A form field holding the recipients as one comma-separated string. */
	name: string;
	label: string;
	disabled?: boolean;
	required?: boolean;
	/**
	 * `envelope` puts the label beside the chips in an email's address row;
	 * `field` is a settings field, labeled above its box like the other inputs.
	 */
	layout?: "envelope" | "field";
	/** Hint under a `field` layout's box. */
	description?: ReactNode;
	/** Optional recipient disclosure actions in the same envelope row. */
	actions?: ReactNode;
}

/** Token-style addressing; every keystroke remains in the retained form value. */
export function EmailRecipientField({
	name,
	label,
	disabled = false,
	required,
	layout = "envelope",
	description,
	actions,
}: EmailRecipientFieldProps) {
	const { control } = useFormContext();
	const isField = layout === "field";
	// the field layout's box shows its focus ring and error border through its control slot
	const TextInput = isField ? InputGroupInput : Input;
	const id = useId();
	// Only the active token's index is local; recipient text always belongs to RHF.
	const [editingIndex, setEditingIndex] = useState<number | null>(null);
	const input = useRef<HTMLInputElement | null>(null);
	const shouldSelect = useRef(false);
	useLayoutEffect(() => {
		if (editingIndex !== null && shouldSelect.current) {
			input.current?.focus();
			input.current?.select();
			shouldSelect.current = false;
		}
	}, [editingIndex]);
	return (
		<FormField
			control={control}
			name={name}
			render={({ field, fieldState }) => {
				const recipients = (
					typeof field.value === "string" ? field.value : ""
				)
					.split(/[,;\n]/)
					.map((value) => value.trim())
					.filter(Boolean);
				const activeIndex =
					editingIndex !== null && editingIndex < recipients.length
						? editingIndex
						: null;
				const activeValue =
					activeIndex === null ? "" : recipients[activeIndex];
				const chips = recipients.map((recipient, index) => {
					if (index === activeIndex) return null;
					const isAddress = emailAddress.safeParse(recipient).success;
					// a settings field holds one list; an envelope names its row, since To, Cc and Bcc sit together
					const editName = isField
						? `Edit ${recipient}`
						: `Edit ${label} recipient ${recipient}`;
					return (
						<span
							key={`${index}:${recipient}`}
							// its own color, so an invalid field turns only the wrong chip red
							className={cn(
								"inline-flex max-w-full items-center rounded-md border bg-muted/50 text-base text-foreground",
								!isAddress &&
									"border-destructive/40 bg-destructive/10 text-destructive",
							)}
						>
							<Tooltip disableHoverableContent={false}>
								<TooltipTrigger asChild>
									<Button
										type="button"
										variant="ghost"
										className={cn(
											"h-auto min-h-8 pointer-coarse:min-h-11 min-w-0 shrink whitespace-normal break-all rounded-r-none px-2 py-1 text-left font-normal",
											isField && "min-h-7",
										)}
										disabled={disabled}
										aria-label={
											isAddress
												? editName
												: `${editName}, not an email address`
										}
										onClick={() => {
											shouldSelect.current = true;
											setEditingIndex(index);
										}}
									>
										<span className="min-w-0 truncate">
											{recipient}
										</span>
									</Button>
								</TooltipTrigger>
								<TooltipContent className="max-w-64 break-all">
									{recipient} ·{" "}
									{isAddress
										? "click to edit"
										: "not an email address, click to edit"}
								</TooltipContent>
							</Tooltip>
							<Tooltip disableHoverableContent={false}>
								<TooltipTrigger asChild>
									<Button
										type="button"
										variant="ghost"
										size="icon-sm"
										className={cn(
											"pointer-coarse:size-11 size-8 shrink-0 rounded-l-none",
											isField && "size-7",
										)}
										disabled={disabled}
										aria-label={
											isField
												? `Remove ${recipient}`
												: `Remove ${recipient} from ${label}`
										}
										onClick={() => {
											field.onChange(
												recipients
													.filter(
														(_, position) =>
															position !== index,
													)
													.join(", "),
											);
											setEditingIndex(
												activeIndex === null
													? null
													: activeIndex > index
														? activeIndex - 1
														: activeIndex,
											);
											input.current?.focus();
										}}
									>
										<X
											className="size-3"
											aria-hidden="true"
										/>
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									Remove recipient
								</TooltipContent>
							</Tooltip>
						</span>
					);
				});
				const textInput = (
					<TextInput
						id={id}
						name={field.name}
						ref={(element) => {
							field.ref(element);
							input.current = element;
						}}
						value={activeValue}
						placeholder={
							recipients.length ? "Add another" : "Add recipients"
						}
						disabled={disabled}
						aria-required={required}
						aria-invalid={fieldState.invalid}
						aria-describedby={
							[
								isField && description
									? `${id}-description`
									: undefined,
								fieldState.error ? `${id}-error` : undefined,
							]
								.filter(Boolean)
								.join(" ") || undefined
						}
						autoComplete="off"
						autoCapitalize="none"
						spellCheck={false}
						inputMode="email"
						className={cn(
							"h-9 pointer-coarse:min-h-11 w-24 min-w-20 flex-1 rounded-none border-0 bg-transparent px-2 shadow-none focus-visible:ring-0 dark:bg-transparent",
							isField && "h-7",
						)}
						onChange={(event) => {
							const text = event.target.value;
							const next = [...recipients];
							const index = activeIndex ?? next.length;
							if (text) next[index] = text;
							else next.splice(index, 1);
							field.onChange(next.join(", "));
							setEditingIndex(
								!text || /[,;\n]/.test(text) ? null : index,
							);
						}}
						onBlur={() => {
							setEditingIndex(null);
							field.onBlur();
						}}
						onKeyDown={(event) => {
							if (
								event.nativeEvent.isComposing ||
								event.ctrlKey ||
								event.metaKey ||
								event.altKey
							)
								return;
							if (["Enter", ",", ";"].includes(event.key)) {
								event.preventDefault();
								event.stopPropagation();
								setEditingIndex(null);
							} else if (
								event.key === "Backspace" &&
								!activeValue &&
								recipients.length
							) {
								event.preventDefault();
								shouldSelect.current = true;
								setEditingIndex(recipients.length - 1);
							}
						}}
					/>
				);
				const error = fieldState.error && (
					<FieldError id={`${id}-error`}>
						{fieldState.error.message}
					</FieldError>
				);
				if (isField) {
					return (
						<Field data-invalid={fieldState.invalid}>
							<FieldLabel id={`${id}-label`} htmlFor={id}>
								{label}
							</FieldLabel>
							{/* sized like the form's other inputs while it holds one row of chips */}
							<InputGroup
								aria-labelledby={`${id}-label`}
								className="h-auto min-h-9 flex-wrap gap-1 p-0.5"
							>
								{chips}
								{textInput}
							</InputGroup>
							{description && (
								<FieldDescription id={`${id}-description`}>
									{description}
								</FieldDescription>
							)}
							{error}
						</Field>
					);
				}
				return (
					<Field
						data-invalid={fieldState.invalid}
						className="gap-1 border-border/60 border-b py-1"
					>
						<div className="flex min-w-0 items-start gap-2">
							<FieldLabel
								htmlFor={id}
								className="w-14 shrink-0 pt-2 font-normal text-base text-muted-foreground"
							>
								{label}
							</FieldLabel>
							<div className="flex min-w-0 flex-1 flex-wrap items-center gap-1 rounded-md focus-within:ring-2 focus-within:ring-ring/50">
								{chips}
								{textInput}
								{actions && (
									<div className="ml-auto flex shrink-0 items-center gap-1">
										{actions}
									</div>
								)}
							</div>
						</div>
						{error}
					</Field>
				);
			}}
		/>
	);
}
