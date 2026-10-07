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
	type AuditTrailFilters,
	EMPTY_AUDIT_FILTERS,
} from "@/api/audit-trails";

const schema = z.object({
	actorId: z.string(),
	action: z.string(),
	targetId: z.string(),
	status: z.string(),
});

interface AuditTrailsFiltersProps {
	/** Applies exact-match filters and returns to the first page. */
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
			onSubmit={onApply}
			className="flex flex-col gap-4"
			aria-label="Audit trails filters"
		>
			<div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<FormInput
					name="actorId"
					label="Actor user ID"
					placeholder="Exact user ID"
				/>
				<FormInput
					name="action"
					label="Action"
					placeholder="For example, LOGIN"
				/>
				<FormInput
					name="targetId"
					label="Target ID"
					placeholder="Exact resource ID"
				/>
				<FormSelect
					name="status"
					label="Status"
					placeholder="All statuses"
				>
					<SelectItem value="all">All statuses</SelectItem>
					<SelectItem value="SUCCESS">Success</SelectItem>
					<SelectItem value="FAILURE">Failure</SelectItem>
					<SelectItem value="ERROR">Error</SelectItem>
				</FormSelect>
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
