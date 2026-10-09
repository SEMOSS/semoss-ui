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
	Field,
	FieldError,
	FieldLabel,
	FormField,
	Input,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	useFormContext,
} from "@semoss/ui/next";
import type { EmailDraftValues } from "../api/email-draft-values";

interface EmailRecipientFieldProps {
	name: "to" | "cc" | "bcc";
	label: string;
	disabled: boolean;
	required?: boolean;
	/** Optional recipient disclosure actions in the same envelope row. */
	actions?: ReactNode;
}

/** Token-style addressing; every keystroke remains in the retained form value. */
export function EmailRecipientField({
	name,
	label,
	disabled,
	required,
	actions,
}: EmailRecipientFieldProps) {
	const { control } = useFormContext<EmailDraftValues>();
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
				const recipients = field.value
					.split(/[,;\n]/)
					.map((value) => value.trim())
					.filter(Boolean);
				const activeIndex =
					editingIndex !== null && editingIndex < recipients.length
						? editingIndex
						: null;
				const activeValue =
					activeIndex === null ? "" : recipients[activeIndex];
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
								{recipients.map((recipient, index) =>
									index === activeIndex ? null : (
										<span
											key={`${index}:${recipient}`}
											className="inline-flex max-w-full items-center rounded-md bg-muted/50 text-base"
										>
											<Tooltip
												disableHoverableContent={false}
											>
												<TooltipTrigger asChild>
													<Button
														type="button"
														variant="ghost"
														className="h-auto min-h-8 pointer-coarse:min-h-11 min-w-0 shrink whitespace-normal break-all rounded-r-none px-2 py-1 text-left font-normal"
														disabled={disabled}
														aria-label={`Edit ${label} recipient ${recipient}`}
														onClick={() => {
															shouldSelect.current = true;
															setEditingIndex(
																index,
															);
														}}
													>
														<span className="min-w-0 truncate">
															{recipient}
														</span>
													</Button>
												</TooltipTrigger>
												<TooltipContent className="max-w-64 break-all">
													{recipient} · click to edit
												</TooltipContent>
											</Tooltip>
											<Tooltip
												disableHoverableContent={false}
											>
												<TooltipTrigger asChild>
													<Button
														type="button"
														variant="ghost"
														size="icon-sm"
														className="pointer-coarse:size-11 size-8 shrink-0 rounded-l-none"
														disabled={disabled}
														aria-label={`Remove ${recipient} from ${label}`}
														onClick={() => {
															field.onChange(
																recipients
																	.filter(
																		(
																			_,
																			position,
																		) =>
																			position !==
																			index,
																	)
																	.join(", "),
															);
															setEditingIndex(
																activeIndex ===
																	null
																	? null
																	: activeIndex >
																			index
																		? activeIndex -
																			1
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
									),
								)}
								<Input
									id={id}
									name={field.name}
									ref={(element) => {
										field.ref(element);
										input.current = element;
									}}
									value={activeValue}
									placeholder={
										recipients.length
											? "Add another"
											: "Add recipients"
									}
									disabled={disabled}
									aria-required={required}
									aria-invalid={fieldState.invalid}
									aria-describedby={
										fieldState.error
											? `${id}-error`
											: undefined
									}
									autoComplete="off"
									autoCapitalize="none"
									spellCheck={false}
									inputMode="email"
									className="h-9 pointer-coarse:min-h-11 w-24 min-w-20 flex-1 rounded-none border-0 bg-transparent px-2 shadow-none focus-visible:ring-0 dark:bg-transparent"
									onChange={(event) => {
										const text = event.target.value;
										const next = [...recipients];
										const index =
											activeIndex ?? next.length;
										if (text) next[index] = text;
										else next.splice(index, 1);
										field.onChange(next.join(", "));
										setEditingIndex(
											!text || /[,;\n]/.test(text)
												? null
												: index,
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
										if (
											["Enter", ",", ";"].includes(
												event.key,
											)
										) {
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
											setEditingIndex(
												recipients.length - 1,
											);
										}
									}}
								/>
								{actions && (
									<div className="ml-auto flex shrink-0 items-center gap-1">
										{actions}
									</div>
								)}
							</div>
						</div>
						{fieldState.error && (
							<FieldError id={`${id}-error`}>
								{fieldState.error.message}
							</FieldError>
						)}
					</Field>
				);
			}}
		/>
	);
}
