import { AlertTriangle, Info, X } from "lucide-react";
import {
	Badge,
	Button,
	Checkbox,
	cn,
	FieldDescription,
	FieldLegend,
	FieldSet,
	FormField,
	FormInput,
	FormRadioGroup,
	Label,
	Muted,
	RadioGroupItem,
	useFormContext,
} from "@semoss/ui/next";
import type {
	GuardrailConfigFormValue,
	GuardrailConfigIssue,
} from "./engine-guardrail-settings.constants";
import { GuardrailDurationField } from "./guardrail-duration-field";
import {
	describeGuardrailHitLimit,
	type GuardrailHitLimitCheck,
	type GuardrailHitLimitFormValue,
	type GuardrailHitLimitScope,
} from "./guardrail-hit-limit";

export interface GuardrailHitLimitFieldProps {
	/** The limit being edited */
	value: GuardrailHitLimitFormValue;

	/** The limit's place in the list, from 0 */
	index: number;

	/** The checks the limit can count */
	checks: GuardrailHitLimitCheck[];

	/** Problems with this limit, to show */
	issues: GuardrailConfigIssue[];

	/** Removes the limit */
	onRemove: () => void;

	/** Whether the fields accept edits */
	disabled?: boolean;

	/** Prefix for the limit's element ids */
	idPrefix: string;

	/** Prefix for the limit's test ids */
	testIdPrefix: string;

	/** React Hook Form path of the limit, such as hitLimits.0 */
	namePrefix: `hitLimits.${number}`;
}

const SCOPE_OPTIONS: Array<{
	value: GuardrailHitLimitScope;
	label: string;
	description: string;
}> = [
	{
		value: "ROOM",
		label: "Close the room",
		description:
			"Counts the room's hits. The hit that reaches the limit closes the room.",
	},
	{
		value: "USER",
		label: "Lock the user out",
		description:
			"Counts the user's hits on this engine in a rolling window. The hit that reaches the limit locks them out of it and closes the room.",
	},
];

/**
 * Editor for one hit limit: the checks whose hits count, how many hits reach
 * it, and whether reaching it closes the room or locks the user out.
 */
export const GuardrailHitLimitField = ({
	value,
	index,
	checks,
	issues,
	onRemove,
	disabled,
	idPrefix,
	testIdPrefix,
	namePrefix,
}: GuardrailHitLimitFieldProps) => {
	const { control } = useFormContext<GuardrailConfigFormValue>();
	const name = `Hit Limit ${index + 1}`;
	const summary = describeGuardrailHitLimit(value);

	return (
		<div
			className="space-y-4 rounded-lg border p-4"
			data-testid={testIdPrefix}
		>
			<div className="flex items-center justify-between gap-2">
				<span className="flex flex-wrap items-center gap-2 font-medium text-sm">
					{name}
					<Badge variant="secondary">
						{value.scope === "USER"
							? "Locks the user out"
							: "Closes the room"}
					</Badge>
				</span>
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					aria-label={`Remove ${name.toLowerCase()}`}
					onClick={onRemove}
					disabled={disabled}
					data-testid={`${testIdPrefix}-remove`}
				>
					<X className="size-4" aria-hidden />
				</Button>
			</div>

			{issues.length > 0 && (
				<ul
					className="space-y-1"
					data-testid={`${testIdPrefix}-errors`}
				>
					{issues.map((issue) => (
						<li
							key={issue.message}
							className="flex items-start gap-2 text-destructive text-xs"
						>
							<AlertTriangle
								className="mt-0.5 size-3.5 shrink-0"
								aria-hidden
							/>
							<span>{issue.message}</span>
						</li>
					))}
				</ul>
			)}

			<FormField
				control={control}
				name={`${namePrefix}.checks`}
				render={({ field }) => (
					<FieldSet>
						<FieldLegend variant="label" className="mb-1">
							Counts the hits of
						</FieldLegend>
						<FieldDescription>
							Hits of other checks are ignored, so leave out a
							check, such as a masking one, whose hits should not
							count.
						</FieldDescription>
						{checks.length === 0 ? (
							<Muted>Add a check to a rule first.</Muted>
						) : (
							<div className="grid gap-2">
								{checks.map((check, checkIndex) => {
									const checkboxId = `${idPrefix}-check-${checkIndex}`;
									return (
										<div
											key={check.checkId}
											className="flex items-start gap-3"
										>
											<Checkbox
												id={checkboxId}
												checked={field.value.includes(
													check.checkId,
												)}
												onCheckedChange={(checked) =>
													field.onChange(
														checked === true
															? [
																	...field.value,
																	check.checkId,
																]
															: field.value.filter(
																	(checkId) =>
																		checkId !==
																		check.checkId,
																),
													)
												}
												disabled={disabled}
												className="mt-0.5"
												data-testid={`${testIdPrefix}-check-${checkIndex}`}
											/>
											<Label
												htmlFor={checkboxId}
												className="flex flex-col items-start gap-0.5 font-normal"
											>
												<span className="font-medium text-sm">
													{check.name}
												</span>
												<span className="text-muted-foreground text-xs">
													{check.detail}
												</span>
											</Label>
										</div>
									);
								})}
							</div>
						)}
					</FieldSet>
				)}
			/>

			<FormRadioGroup
				name={`${namePrefix}.scope`}
				label="When the limit is reached"
				className="gap-3"
				disabled={disabled}
			>
				<div className="grid gap-3 sm:grid-cols-2">
					{SCOPE_OPTIONS.map((option) => {
						const optionId = `${idPrefix}-scope-${option.value}`;
						return (
							<Label
								key={option.value}
								htmlFor={optionId}
								className="flex cursor-pointer items-start gap-3 rounded-md border p-3 has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5"
							>
								<RadioGroupItem
									id={optionId}
									value={option.value}
									className="mt-0.5"
								/>
								<span className="space-y-1">
									<span className="block font-medium text-sm">
										{option.label}
									</span>
									<span className="block font-normal text-muted-foreground text-xs">
										{option.description}
									</span>
								</span>
							</Label>
						);
					})}
				</div>
			</FormRadioGroup>

			<div
				className={cn(
					"grid gap-3",
					value.scope === "USER" ? "lg:grid-cols-3" : "sm:max-w-xs",
				)}
			>
				<FormInput
					name={`${namePrefix}.hits`}
					label="Hits that reach the limit"
					description={
						value.scope === "USER"
							? "The user's hits of the checks above, on this engine."
							: "The room's hits of the checks above."
					}
					type="number"
					min={1}
					step={1}
					inputMode="numeric"
					disabled={disabled}
					className="gap-2 rounded-md border p-3"
					data-testid={`${testIdPrefix}-hits`}
				/>
				{value.scope === "USER" && (
					<>
						<GuardrailDurationField
							legend="Count hits from the last"
							description="Older hits, and hits from before the user's latest lock, do not count."
							amountLabel="Window length"
							unitLabel="Window unit"
							amountName={`${namePrefix}.windowAmount`}
							unitName={`${namePrefix}.windowUnit`}
							disabled={disabled}
							testIdPrefix={`${testIdPrefix}-window`}
						/>
						<GuardrailDurationField
							legend="Lock the user out for"
							description="An editor of this engine can unlock them sooner."
							amountLabel="Lock length"
							unitLabel="Lock unit"
							amountName={`${namePrefix}.lockAmount`}
							unitName={`${namePrefix}.lockUnit`}
							disabled={disabled}
							testIdPrefix={`${testIdPrefix}-lock`}
						/>
					</>
				)}
			</div>

			{summary && (
				<p
					className="flex items-start gap-2 text-muted-foreground text-sm"
					data-testid={`${testIdPrefix}-summary`}
				>
					<Info className="mt-0.5 size-4 shrink-0" aria-hidden />
					<span>{summary}</span>
				</p>
			)}

			<FormInput
				name={`${namePrefix}.message`}
				label="Message"
				placeholder={
					value.scope === "USER"
						? "You can't use this engine until the lock ends."
						: "This room was closed by a guardrail. Please open a new room."
				}
				description="Optional. What the refused call returns; leave it blank for the default, which for a lock says when it ends."
				disabled={disabled}
			/>
		</div>
	);
};
