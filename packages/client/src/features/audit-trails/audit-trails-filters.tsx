import {
	Button,
	Form,
	FormInput,
	FormSelect,
	SelectItem,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import {
	AUDIT_CATEGORIES,
	AUDIT_FILTER_ALL,
	AUDIT_SEVERITIES,
	AUDIT_STATUSES,
	type AuditTrailFilters,
	EMPTY_AUDIT_FILTERS,
	normalizeAuditFilters,
} from "@/api/audit-trails";

const date = z
	.string()
	.refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value), {
		message: "Use a valid date",
	});

const schema = z
	.object({
		eventType: z.string(),
		category: z.string(),
		status: z.string(),
		severity: z.string(),
		actorId: z.string(),
		subjectId: z.string(),
		targetType: z.string(),
		targetId: z.string(),
		projectId: z.string(),
		engineId: z.string(),
		insightId: z.string(),
		from: date,
		to: date,
	})
	.refine(
		(values) => !values.from || !values.to || values.from <= values.to,
		{
			message: "The end date must be on or after the start date",
			path: ["to"],
		},
	);

const ALL = AUDIT_FILTER_ALL;

const TEXT_FILTERS: {
	name: keyof AuditTrailFilters;
	label: string;
	placeholder: string;
}[] = [
	{
		name: "eventType",
		label: "Event type",
		placeholder: "For example, LOGIN",
	},
	{ name: "actorId", label: "Actor user ID", placeholder: "Exact user ID" },
	{
		name: "subjectId",
		label: "Affected user ID",
		placeholder: "Grantee, edited user, or requester",
	},
	{
		name: "targetType",
		label: "Target type",
		placeholder: "For example, PROJECT",
	},
	{ name: "targetId", label: "Target ID", placeholder: "Exact resource ID" },
	{ name: "projectId", label: "Project ID", placeholder: "Exact project ID" },
	{ name: "engineId", label: "Engine ID", placeholder: "Exact engine ID" },
	{ name: "insightId", label: "Insight ID", placeholder: "Exact insight ID" },
];

interface AuditTrailsFiltersProps {
	/** Applies the filters and returns to the first page. */
	onApply: (filters: AuditTrailFilters) => void;
}

/** Keep filter drafts separate from the filters used by the current query. */
export const AuditTrailsFilters = ({ onApply }: AuditTrailsFiltersProps) => {
	const form = useForm<AuditTrailFilters>({
		resolver: zodResolver(schema),
		defaultValues: EMPTY_AUDIT_FILTERS,
	});
	const handleClear = () => {
		form.reset(EMPTY_AUDIT_FILTERS);
		onApply(EMPTY_AUDIT_FILTERS);
	};
	return (
		<Form
			form={form}
			onSubmit={(values) => onApply(normalizeAuditFilters(values))}
			className="flex flex-col gap-4"
			aria-label="Audit trails filters"
		>
			<div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<FormSelect
					name="category"
					label="Category"
					placeholder="All categories"
				>
					<SelectItem value={ALL}>All categories</SelectItem>
					{AUDIT_CATEGORIES.map((category) => (
						<SelectItem key={category} value={category}>
							{category}
						</SelectItem>
					))}
				</FormSelect>
				<FormSelect
					name="status"
					label="Status"
					placeholder="All statuses"
				>
					<SelectItem value={ALL}>All statuses</SelectItem>
					{AUDIT_STATUSES.map((status) => (
						<SelectItem key={status} value={status}>
							{status.charAt(0) + status.slice(1).toLowerCase()}
						</SelectItem>
					))}
				</FormSelect>
				<FormSelect
					name="severity"
					label="Severity"
					placeholder="All severities"
				>
					<SelectItem value={ALL}>All severities</SelectItem>
					{AUDIT_SEVERITIES.map((severity) => (
						<SelectItem key={severity} value={severity}>
							{severity.charAt(0) +
								severity.slice(1).toLowerCase()}
						</SelectItem>
					))}
				</FormSelect>
				{TEXT_FILTERS.map((filter) => (
					<FormInput
						key={filter.name}
						name={filter.name}
						label={filter.label}
						placeholder={filter.placeholder}
					/>
				))}
				<FormInput name="from" label="From (UTC)" type="date" />
				<FormInput name="to" label="To (UTC, inclusive)" type="date" />
			</div>
			<div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
				<Button type="button" variant="outline" onClick={handleClear}>
					Clear filters
				</Button>
				<Button type="submit">Apply filters</Button>
			</div>
		</Form>
	);
};
