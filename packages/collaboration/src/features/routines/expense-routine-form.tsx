import { Receipt } from "lucide-react";
import { useId } from "react";
import {
	Card,
	CardContent,
	FieldGroup,
	Form,
	FormInput,
	FormSwitch,
	P,
	Separator,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import { collaborationTabsStyles } from "@/features/collaboration/components/collaboration-tabs.styles";
import { parseAddresses } from "@/features/connectors/api/microsoft";
import {
	EXPENSE_RECIPIENT_LIMIT,
	type ExpenseRoutine,
	type ExpenseRoutineSettings,
	expenseRoutineSettingsSchema,
} from "./expense-routine-schema";
import { RoutineAvailability } from "./routine-availability";
import { RoutineCardHeader } from "./routine-card-header";
import { EXPENSE_RESULT_COPY } from "./routine-copy";
import { RoutineDocuments } from "./routine-documents";
import { RoutineFlowSection } from "./routine-flow-section";
import { RoutineResult } from "./routine-result";
import { RoutineSaveStatus } from "./routine-save-status";
import { useRoutineAutosave } from "./use-routine-autosave";

// the copies are typed as one line of addresses and saved as a list
const formSchema = expenseRoutineSettingsSchema
	.omit({ recipients: true })
	.extend({ recipientsText: z.string() })
	.superRefine(({ recipientsText }, context) => {
		try {
			if (
				parseAddresses(recipientsText).length > EXPENSE_RECIPIENT_LIMIT
			) {
				context.addIssue({
					code: "custom",
					path: ["recipientsText"],
					message: `Copy each review to at most ${EXPENSE_RECIPIENT_LIMIT} addresses.`,
				});
			}
		} catch (error: unknown) {
			context.addIssue({
				code: "custom",
				path: ["recipientsText"],
				message:
					error instanceof Error
						? error.message
						: "Enter email addresses separated by commas.",
			});
		}
	});
type ExpenseFormValues = z.infer<typeof formSchema>;

/** Uses the local zone for first setup; reviews are dated in it. */
function formValues(routine: ExpenseRoutine): ExpenseFormValues {
	return {
		enabled: routine.enabled,
		timezone: routine.configured
			? routine.timezone
			: Intl.DateTimeFormat().resolvedOptions().timeZone,
		recipientsText: routine.recipients.join(", "),
	};
}

interface ExpenseRoutineFormProps {
	/** Validated, persisted settings and current service availability. */
	routine: ExpenseRoutine;
	/** Saves the opt-in; rejected writes leave the draft intact. */
	onSave: (values: ExpenseRoutineSettings) => Promise<ExpenseRoutine>;
}

/** The expense review opt-in, its guideline documents and example threads, and the latest review. */
export function ExpenseRoutineForm({
	routine,
	onSave,
}: ExpenseRoutineFormProps) {
	const id = useId();
	const form = useForm<ExpenseFormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: formValues(routine),
		shouldFocusError: false,
	});
	const { errors, isSubmitting } = form.formState;
	const isAvailable =
		routine.schedulerAvailable &&
		routine.assistantAvailable &&
		routine.mailboxAvailable;

	const { status, handleSubmit, retry } = useRoutineAutosave({
		form,
		onSave: async (values) => {
			if (values.enabled && !isAvailable) {
				throw new Error(
					routine.availabilityMessage ||
						"Connect your inbox and check service availability before enabling this routine.",
				);
			}
			const { recipientsText, ...settings } = values;
			const recipients = parseAddresses(recipientsText);
			const saved = formValues(await onSave({ ...settings, recipients }));
			// a save mid-typing must not strip a trailing comma the owner is about to type after
			return saved.recipientsText === recipients.join(", ")
				? { ...saved, recipientsText }
				: saved;
		},
	});
	const subjects = routine.subjects
		.map((subject) => `"${subject}"`)
		.join(" or ");

	return (
		<div className="flex min-w-0 flex-col gap-3">
			<Card className="gap-0 overflow-hidden py-0 shadow-none">
				<Form
					form={form}
					onSubmit={handleSubmit}
					noValidate
					aria-busy={isSubmitting}
				>
					<RoutineCardHeader
						icon={Receipt}
						title="Expense review"
						description="A suggested decision on each meeting or business approval request that reaches your inbox, checked against your guideline documents."
						routine={routine}
						enabledLabel="On"
						saveStatus={
							<RoutineSaveStatus
								status={status}
								error={errors.root?.server?.message}
								onRetry={retry}
							/>
						}
					/>
					<CardContent className="grid min-w-0 gap-8 py-6 lg:grid-cols-2">
						<FieldGroup className="min-w-0">
							<FormSwitch
								name="enabled"
								label="Enable expense reviews"
								aria-describedby={`${id}-opt-in`}
								description={
									<span
										id={`${id}-opt-in`}
										className="flex flex-col gap-2"
									>
										<span>
											Runs when your inbox syncs an email
											whose subject starts with {subjects}
											. Changes save automatically.
											Reviews are emailed to you and
											copied to anyone you add below.
										</span>
									</span>
								}
							/>
							<FormInput
								name="recipientsText"
								label="Also send to (optional)"
								description={`Up to ${EXPENSE_RECIPIENT_LIMIT} email addresses, separated by commas, that get a copy of each review.`}
								inputMode="email"
								spellCheck={false}
							/>
							<Separator />
							<div className="flex flex-col gap-2">
								<P className="font-medium text-sm">
									How a review works
								</P>
								<ol className="flex list-decimal flex-col gap-1 pl-5 text-muted-foreground text-sm">
									<li>
										The request email is read as it arrived,
										with the earlier messages of its thread.
									</li>
									<li>
										Your assistant checks it against the
										guideline documents you keep here, and
										follows any example email threads you
										add (.eml or .msg) where an approver
										pushed back, set conditions, or
										declined.
									</li>
									<li>
										You get an email with a suggested
										decision that names only what is out of
										compliance, the questions to ask, and
										the request summary. Unless it is a
										plain approval, a reply to the approver
										waits in your Outlook drafts. You still
										respond in MES yourself; nothing is
										approved, and no reply is sent for you.
									</li>
								</ol>
							</div>
						</FieldGroup>
						{/* a grid item, so as tall as the settings column; the open panel fills what the tab list leaves */}
						<Tabs
							defaultValue="result"
							className="min-h-0 min-w-0 gap-3"
						>
							<TabsList className={collaborationTabsStyles.list}>
								<TabsTrigger
									value="result"
									className={collaborationTabsStyles.trigger}
								>
									Latest review
								</TabsTrigger>
								<TabsTrigger
									value="documents"
									className={collaborationTabsStyles.trigger}
								>
									Guidelines & examples
								</TabsTrigger>
							</TabsList>
							<TabsContent
								value="result"
								className="mt-0 flex min-h-0 flex-1 flex-col"
							>
								<RoutineResult
									routine={routine}
									copy={EXPENSE_RESULT_COPY}
									showTitle={false}
								/>
							</TabsContent>
							<TabsContent
								value="documents"
								className="mt-0 flex min-h-0 flex-1 flex-col"
							>
								<RoutineDocuments
									routineId={routine.documentsId}
								/>
							</TabsContent>
						</Tabs>
					</CardContent>
					<RoutineAvailability
						routine={routine}
						isAvailable={isAvailable}
					/>
				</Form>
			</Card>
			<RoutineFlowSection title="Expense review" flow={routine.flow} />
		</div>
	);
}
