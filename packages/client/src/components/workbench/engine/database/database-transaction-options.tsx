import { useId } from "react";
import {
	Field,
	FieldError,
	FieldLabel,
	FormField,
	Input,
	ToggleGroup,
	ToggleGroupItem,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	useFormContext,
} from "@semoss/ui/next";
import type { DatabaseRunOptionsInput } from "./database-run-options";

/** The two ways a SQL script can commit, each named so the control says which is on. */
const COMMIT_MODES = [
	{
		value: "EACH",
		label: "Each statement",
		hint: "Each statement commits on its own as it runs.",
	},
	{
		value: "ONE",
		label: "One transaction",
		hint: "All statements commit together, or none do.",
	},
] as const;

/**
 * The chosen commit mode in the primary color, hovered or not, so it stands out
 * from the other segment. It is styled by aria-checked, which the toggle group
 * sets on the chosen segment, since the tooltip around each segment replaces
 * the segment's data-state, and with it the toggle's own chosen style.
 */
const CHOSEN_MODE_CLASSES =
	"aria-checked:border-primary aria-checked:bg-primary aria-checked:text-primary-foreground aria-checked:hover:bg-primary/90 aria-checked:hover:text-primary-foreground";

/** Props for {@link DatabaseTransactionOptions}. */
export interface DatabaseTransactionOptionsProps {
	/** Whether the options are locked, as they are while the script runs. */
	disabled?: boolean;
}

/**
 * A SQL query panel's commit control, sized for the editor's toolbar: Each
 * statement or One transaction, and in one transaction a timeout for the whole
 * script. Renders inside the panel's run options form, whose fields it reads.
 */
export const DatabaseTransactionOptions = ({
	disabled = false,
}: DatabaseTransactionOptionsProps) => {
	const { control, watch } = useFormContext<DatabaseRunOptionsInput>();
	const isOneTransaction = watch("isOneTransaction");
	const id = useId();
	const commitLabelId = `${id}-commit`;
	const timeoutId = `${id}-timeout`;
	const timeoutErrorId = `${id}-timeout-error`;

	return (
		<div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
			<div className="flex items-center gap-2">
				<span
					id={commitLabelId}
					className="text-muted-foreground text-sm"
				>
					Commit
				</span>
				<FormField
					control={control}
					name="isOneTransaction"
					render={({ field }) => (
						<ToggleGroup
							type="single"
							variant="outline"
							size="sm"
							value={field.value ? "ONE" : "EACH"}
							onValueChange={(value) => {
								// a single toggle group sends "" when the chosen item is
								// pressed again; one mode is always chosen
								if (value) {
									field.onChange(value === "ONE");
								}
							}}
							disabled={disabled}
							aria-labelledby={commitLabelId}
							data-testid="query-commit-mode"
						>
							{COMMIT_MODES.map((mode) => (
								<Tooltip
									key={mode.value}
									disableHoverableContent={false}
								>
									<TooltipTrigger asChild>
										<ToggleGroupItem
											value={mode.value}
											className={CHOSEN_MODE_CLASSES}
										>
											{mode.label}
										</ToggleGroupItem>
									</TooltipTrigger>
									<TooltipContent>{mode.hint}</TooltipContent>
								</Tooltip>
							))}
						</ToggleGroup>
					)}
				/>
			</div>
			{isOneTransaction && (
				<FormField
					control={control}
					name="timeout"
					render={({ field, fieldState }) => (
						<Field
							orientation="horizontal"
							data-invalid={!!fieldState.error}
							className="w-auto gap-2"
						>
							<FieldLabel
								htmlFor={timeoutId}
								className="font-normal text-muted-foreground"
							>
								Timeout (sec)
							</FieldLabel>
							<Input
								{...field}
								id={timeoutId}
								placeholder="No limit"
								inputMode="numeric"
								autoComplete="off"
								disabled={disabled}
								aria-invalid={!!fieldState.error}
								aria-describedby={
									fieldState.error
										? timeoutErrorId
										: undefined
								}
								className="h-8 w-24"
								data-testid="query-transaction-timeout-input"
							/>
							<FieldError id={timeoutErrorId} className="text-xs">
								{fieldState.error?.message}
							</FieldError>
						</Field>
					)}
				/>
			)}
		</div>
	);
};
