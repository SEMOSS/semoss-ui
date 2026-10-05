import {
	Button,
	Form,
	FormInput,
	FormSelect,
	Muted,
	SelectItem,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import {
	comparisonUsageFilters,
	previousUsageFilters,
	usageWindowDays,
} from "@/api/enterprise-usage-requests";
import type { UsageBenchmark as Benchmark, UsageFilters } from "./usage.types";

interface UsageBenchmarkProps {
	/** Applied benchmark and current report scope. */
	value: Benchmark;
	filters: UsageFilters;
	/** Applies the selected benchmark without changing the current report dates. */
	onApply: (benchmark: Benchmark) => void;
}

/** Names the baseline and exposes exact dates before applying a comparison. */
export function UsageBenchmark({
	value,
	filters,
	onApply,
}: UsageBenchmarkProps) {
	const defaults = previousUsageFilters(filters);
	const schema = z
		.object({
			mode: z.enum(["previous-period", "previous-year", "custom"]),
			from: z.string(),
			to: z.string(),
		})
		.superRefine((candidate, context) => {
			try {
				comparisonUsageFilters(filters, candidate);
			} catch (error) {
				context.addIssue({
					code: "custom",
					path: ["to"],
					message: getErrorMessage(error, "Check Comparison Dates"),
				});
			}
		});
	const form = useForm<Benchmark>({
		resolver: zodResolver(schema),
		values: {
			...value,
			from: value.from || defaults.from,
			to: value.to || defaults.to,
		},
	});
	const isCustom = form.watch("mode") === "custom";
	const applied = comparisonUsageFilters(filters, value);
	return (
		<section
			className="space-y-2 rounded-md border bg-muted/30 p-3"
			aria-label="Comparison Benchmark"
		>
			<Form
				form={form}
				onSubmit={onApply}
				className="flex flex-wrap items-end gap-2"
				noValidate
			>
				<FormSelect
					name="mode"
					label="Compare Against"
					className="w-full sm:w-64"
				>
					<SelectItem value="previous-period">
						Previous Period (Same Length)
					</SelectItem>
					<SelectItem value="previous-year">
						Same Period Last Year
					</SelectItem>
					<SelectItem value="custom">Custom Date Range</SelectItem>
				</FormSelect>
				{isCustom && (
					<>
						<FormInput
							name="from"
							label="Comparison Start"
							type="date"
							required
							className="w-full sm:w-44"
						/>
						<FormInput
							name="to"
							label="Comparison End"
							type="date"
							required
							className="w-full sm:w-44"
						/>
					</>
				)}
				<Button type="submit" variant="outline" size="sm">
					Apply Comparison
				</Button>
			</Form>
			<Muted className="text-xs">
				Current: {filters.from} - {filters.to} (
				{usageWindowDays(filters)} Days) | Benchmark: {applied.from} -{" "}
				{applied.to} ({usageWindowDays(applied)} Days, Inclusive).{" "}
				{value.mode === "previous-period"
					? "The Immediately Preceding Window With The Same Number Of Days."
					: "The Selected Calendar Window With The Same User, App, And Engine Filters."}{" "}
				{usageWindowDays(filters) !== usageWindowDays(applied)
					? "Unequal Lengths: Request, Token, And Event Changes Compare Daily Averages. Distinct Counts Are Shown Without Percentage Changes. Charts Align At Day 1 And Show Both Full Periods; Gaps Mark Days Outside A Period."
					: "Charts Align Each Period's First Day And Show Both Full Periods."}
			</Muted>
		</section>
	);
}
