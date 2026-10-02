import { useId } from "react";
import {
	Button,
	Field,
	FieldLabel,
	Form,
	FormField,
	FormInput,
	Muted,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import {
	defaultUsageFilters,
	validateUsageFilters,
} from "@/api/enterprise-usage-requests";
import type { UsageFilters as Filters } from "./usage.types";
import { UsageEntityPicker } from "./usage-entity-picker";

const schema = z
	.object({
		range: z.enum(["7", "30", "90", "custom"]),
		from: z.string(),
		to: z.string(),
		user: z.string(),
		app: z.string(),
		engine: z.string(),
	})
	.superRefine((value, context) => {
		try {
			validateUsageFilters(value);
		} catch (error) {
			context.addIssue({
				code: "custom",
				path: ["to"],
				message: getErrorMessage(error, "Check Your Filters."),
			});
		}
	});

interface UsageFiltersProps {
	/** The applied report scope before any chart selection. */
	filters: Filters;
	/** Commits the date and entity filter draft together. */
	onApply: (filters: Filters) => void;
}

/** Preset or custom dates and searchable entities share one explicit apply action. */
export function UsageFilters({ filters, onApply }: UsageFiltersProps) {
	const rangeId = useId();
	const range =
		(["7", "30", "90"] as const).find((value) => {
			const dates = defaultUsageFilters(Number(value));
			return dates.from === filters.from && dates.to === filters.to;
		}) ?? "custom";
	const form = useForm<Filters & { range: "7" | "30" | "90" | "custom" }>({
		resolver: zodResolver(schema),
		values: { ...filters, range },
	});
	const draft = form.watch();
	const hasChanges = (["from", "to", "user", "app", "engine"] as const).some(
		(key) => draft[key] !== filters[key],
	);
	return (
		<Form
			form={form}
			onSubmit={({ range: _range, ...next }) => onApply(next)}
			className="space-y-2"
			noValidate
		>
			<div className="grid min-w-0 gap-2 sm:grid-cols-2 xl:grid-cols-4">
				<FormField
					control={form.control}
					name="range"
					render={({ field }) => (
						<Field>
							<FieldLabel htmlFor={rangeId}>
								Date Range
							</FieldLabel>
							<Select
								value={field.value}
								onValueChange={(value) => {
									field.onChange(value);
									if (value !== "custom") {
										const dates = defaultUsageFilters(
											Number(value),
										);
										form.setValue("from", dates.from, {
											shouldDirty: true,
										});
										form.setValue("to", dates.to, {
											shouldDirty: true,
										});
									}
								}}
							>
								<SelectTrigger
									id={rangeId}
									ref={field.ref}
									onBlur={field.onBlur}
									className="w-full"
								>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="7">
										Last 7 Days
									</SelectItem>
									<SelectItem value="30">
										Last 30 Days
									</SelectItem>
									<SelectItem value="90">
										Last 90 Days
									</SelectItem>
									<SelectItem value="custom">
										Custom
									</SelectItem>
								</SelectContent>
							</Select>
						</Field>
					)}
				/>
				<UsageEntityPicker dimension="user" />
				<UsageEntityPicker dimension="app" />
				<UsageEntityPicker dimension="engine" />
			</div>
			{draft.range === "custom" ? (
				<div className="grid gap-2 sm:grid-cols-2">
					<FormInput
						name="from"
						label="Start Date"
						type="date"
						required
					/>
					<FormInput
						name="to"
						label="End Date (Inclusive)"
						type="date"
						required
					/>
				</div>
			) : (
				<Muted className="block text-xs">
					Selected Dates: {draft.from} - {draft.to}
				</Muted>
			)}
			<div className="flex flex-wrap items-center gap-2">
				<Button
					type="submit"
					variant={hasChanges ? "default" : "outline"}
					disabled={!hasChanges}
				>
					Apply Filters
				</Button>
				<Button
					type="button"
					variant="ghost"
					onClick={() => {
						const next = defaultUsageFilters();
						form.reset({ ...next, range: "30" });
						onApply(next);
					}}
				>
					Reset Filters
				</Button>
				<output className="text-primary text-xs">
					{hasChanges ? "Unapplied Changes" : ""}
				</output>
			</div>
		</Form>
	);
}
