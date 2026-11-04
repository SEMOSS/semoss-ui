import { useId } from "react";
import { usePixel } from "@semoss/sdk/react";
import { type Engine, EngineSelect, EngineSubtypeIcon } from "@semoss/shared";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Button,
	Field,
	FieldDescription,
	FieldError,
	FieldLabel,
	FieldLegend,
	FieldSet,
	Form,
	FormActions,
	FormField,
	FormInput,
	FormSelect,
	FormSelectItem,
	FormTextarea,
	H4,
	Muted,
	Separator,
	toast,
	useForm,
	zodResolver,
} from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import { createGuardrailEngine } from "@/api/guardrails";
import { EngineFormHeader } from "@/components/import/shared/engine-form-header";
import { useSession } from "@/hooks/use-session";
import { JevPolicyChoicesField } from "./jev-policy-choices-field";
import {
	JEV_JUDGE_SUBTYPE,
	JEV_POLICY_GUARDRAIL_DEFAULTS,
	type JevPolicyGuardrailFormValues,
	jevPolicyGuardrailSchema,
	STRICTNESS_OPTIONS,
	toJevPolicyGuardrailDetails,
} from "./jev-policy-guardrail";

/** Lists the models the user can use; the judge is picked from the Jev ones. */
const MODELS_PIXEL = 'META | MyEngines(engineTypes=["MODEL"], noMeta=[true]);';

/** Props for {@link JevPolicyGuardrailForm}. */
export interface JevPolicyGuardrailFormProps {
	/** The guardrail type's logo, shown beside the form's title. */
	icon?: string;
	/** Called with the new guardrail's id once it is created, or with none on cancel. */
	onSubmit: (id?: string) => void;
}

/**
 * Creates a Jev policy guardrail: a Jev (TypeSafe) model answers a typed yes
 * or no or choice question about the text, and the answer blocks or allows
 * the call. The judge is picked from the Jev models the user can use; a
 * failed create shows its reason above the form's actions.
 */
export const JevPolicyGuardrailForm = ({
	icon,
	onSubmit,
}: JevPolicyGuardrailFormProps) => {
	const insightID = useSession((state) => state.insightID);
	const form = useForm<JevPolicyGuardrailFormValues>({
		resolver: zodResolver(jevPolicyGuardrailSchema),
		defaultValues: JEV_POLICY_GUARDRAIL_DEFAULTS,
	});
	const { errors, isSubmitting } = form.formState;
	const questionType = form.watch("QUESTION_TYPE");

	const models = usePixel<Engine[]>(MODELS_PIXEL, { data: [] }, insightID);
	const areModelsLoading =
		models.status === "INITIAL" || models.status === "LOADING";
	const judgeModels = (Array.isArray(models.data) ? models.data : []).filter(
		(engine) =>
			typeof engine?.engine_id === "string" &&
			engine.engine_subtype?.toUpperCase() === JEV_JUDGE_SUBTYPE,
	);
	const hasNoJudgeModels =
		models.status === "SUCCESS" && judgeModels.length === 0;
	const judgeId = useId();
	const judgeEngineId = form.watch("MODEL_ENGINE_ID");
	const judge = judgeModels.find(
		(engine) => engine.engine_id === judgeEngineId,
	);

	const handleSubmit = async (
		values: JevPolicyGuardrailFormValues,
	): Promise<void> => {
		let engineId: string;
		try {
			engineId = await createGuardrailEngine(
				insightID,
				values.MODEL_NAME,
				toJevPolicyGuardrailDetails(values),
			);
		} catch (error: unknown) {
			form.setError("root.server", {
				type: "server",
				message: getErrorMessage(
					error,
					"Unable to create the Jev policy guardrail",
				),
			});
			return;
		}
		toast.success("Successfully added Jev policy guardrail to catalog");
		onSubmit(engineId);
	};

	return (
		<Form
			form={form}
			onSubmit={handleSubmit}
			noValidate
			aria-busy={isSubmitting}
			className="my-4"
			data-testid="jev-policy-guardrail-form"
		>
			<EngineFormHeader
				testIdPrefix="jev-policy-guardrail"
				icon={icon}
				title="Jev Policy"
				description="Have a Jev model by TypeSafe answer a typed question about prompts, responses, or function data, and block or allow the call by its answer."
			/>

			<div className="mt-4 mb-8">
				<div className="flex flex-col gap-4">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
						<div className="flex flex-1 flex-col gap-1">
							<H4 className="font-semibold text-base tracking-tight">
								General
							</H4>
							<Muted className="text-muted-foreground text-sm leading-6">
								Basic information used to identify the guardrail
								in the catalog.
							</Muted>
						</div>
						<div className="flex flex-2 flex-col gap-2">
							<FormInput
								name="MODEL_NAME"
								label="Catalog Name"
								description="Name used to identify this guardrail in the catalog."
								disabled={isSubmitting}
								autoFocus
								data-testid="jev-policy-guardrail-name"
							/>
						</div>
					</div>

					<Separator />

					<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
						<div className="flex flex-1 flex-col gap-1">
							<H4 className="font-semibold text-base tracking-tight">
								Settings
							</H4>
							<Muted className="text-muted-foreground text-sm leading-6">
								Choose the Jev model that judges, the question
								it answers, and how its answer decides the call.
							</Muted>
						</div>
						<div className="flex flex-2 flex-col gap-6">
							<FieldSet>
								<FieldLegend>Judge</FieldLegend>
								{/* always there, so the loading message is announced */}
								<output className="block text-muted-foreground text-sm empty:hidden">
									{areModelsLoading
										? "Loading the Jev models..."
										: ""}
								</output>
								{models.status === "ERROR" && (
									<Alert variant="destructive">
										<AlertTitle>
											Jev Models Not Listed
										</AlertTitle>
										<AlertDescription>
											The models you can use could not be
											read.
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={models.refresh}
											>
												Try Again
											</Button>
										</AlertDescription>
									</Alert>
								)}
								<FormField
									control={form.control}
									name="MODEL_ENGINE_ID"
									render={({ field, fieldState }) => (
										<Field
											data-invalid={!!fieldState.error}
										>
											<FieldLabel htmlFor={judgeId}>
												Jev Model
											</FieldLabel>
											<EngineSelect
												ref={field.ref}
												id={judgeId}
												className="bg-background"
												name={
													areModelsLoading
														? "Loading the Jev models..."
														: judge
															? judge.engine_display_name ||
																judge.engine_name
															: "Select a Jev Model"
												}
												value={field.value}
												onChange={(engine) =>
													field.onChange(
														engine.engine_id,
													)
												}
												engines={judgeModels}
												showEngineId
												triggerIcon={
													judge ? (
														<EngineSubtypeIcon
															engineType={
																judge.engine_type
															}
															engineSubtype={
																judge.engine_subtype
															}
															alt=""
															className="size-5 shrink-0 object-contain"
														/>
													) : undefined
												}
												popoverContentProps={{
													align: "start",
												}}
												disabled={
													isSubmitting ||
													areModelsLoading
												}
												aria-invalid={
													!!fieldState.error
												}
												aria-describedby={
													fieldState.error?.message
														? `${judgeId}-description ${judgeId}-error`
														: `${judgeId}-description`
												}
											/>
											<FieldDescription
												id={`${judgeId}-description`}
											>
												{hasNoJudgeModels
													? "No Jev models are available to you. Add a Jev model to the catalog, or ask for access to one."
													: "The model that answers the policy question. Each user of the guardrail needs view access to it, and its own pipeline must not use this guardrail."}
											</FieldDescription>
											{fieldState.error?.message && (
												<FieldError
													id={`${judgeId}-error`}
												>
													{fieldState.error.message}
												</FieldError>
											)}
										</Field>
									)}
								/>
							</FieldSet>

							<Separator />

							<FieldSet>
								<FieldLegend>Policy</FieldLegend>
								<FormSelect
									name="QUESTION_TYPE"
									label="Question Type"
									description="A yes or no question gets the judge's yes or no; a choice question has the judge pick one of the choices you list."
									disabled={isSubmitting}
								>
									<FormSelectItem value="NOUL">
										Yes or No
									</FormSelectItem>
									<FormSelectItem value="CHOICE">
										Choice
									</FormSelectItem>
								</FormSelect>
								<FormTextarea
									name="QUESTION_INSTRUCTIONS"
									label="Policy Question"
									description={
										questionType === "CHOICE"
											? "What the judge decides about the text, such as: Does this answer share only approved figures?"
											: "A yes or no question about the text, such as: Is this request within the approved scope, monthly reporting questions only?"
									}
									rows={3}
									disabled={isSubmitting}
								/>
								{questionType === "CHOICE" ? (
									<JevPolicyChoicesField
										disabled={isSubmitting}
									/>
								) : (
									<FormSelect
										name="VIOLATION_DIRECTION"
										label="Block When the Answer Is"
										description="Choose No when the question asks whether the text is allowed, and Yes when it asks whether the text breaks the policy."
										disabled={isSubmitting}
									>
										<FormSelectItem value="YES">
											Yes
										</FormSelectItem>
										<FormSelectItem value="NO">
											No
										</FormSelectItem>
									</FormSelect>
								)}
							</FieldSet>

							<Separator />

							<FieldSet>
								<FieldLegend>Decision</FieldLegend>
								<div className="grid gap-4 md:grid-cols-2">
									{questionType === "CHOICE" ? (
										<>
											<FormInput
												name="CONFIDENCE_PERCENT"
												type="number"
												min={0}
												max={100}
												step={5}
												label="Confidence Needed (%)"
												description="How sure the judge must be of its choice for the choice to decide the call."
												disabled={isSubmitting}
											/>
											<FormSelect
												name="STRICTNESS"
												label="Strictness"
												description="Decides a choice the judge is less sure of. Strict suits sends and other changes that cannot be undone; lenient suits checks where blocking real users costs more."
												disabled={isSubmitting}
											>
												{STRICTNESS_OPTIONS.map(
													(option) => (
														<FormSelectItem
															key={option.value}
															value={option.value}
														>
															{option.label}
														</FormSelectItem>
													),
												)}
											</FormSelect>
										</>
									) : (
										<FormInput
											name="VIOLATION_CHANCE_PERCENT"
											type="number"
											min={1}
											max={100}
											step={5}
											label="Block at a Violation Chance of (%)"
											description="The judge gives the chance that the text breaks the policy, and the call is blocked once it reaches this. Lower is stricter: at 20 a call is blocked unless the judge is clearly sure it is allowed; at 80 only clear violations are blocked."
											disabled={isSubmitting}
										/>
									)}
									<FormSelect
										name="JUDGE_ERROR_VERDICT"
										label="When the Judge Fails"
										description="Applies when the judge is missing, times out, or gives no usable answer. Block is recommended for sends and other changes that cannot be undone."
										disabled={isSubmitting}
									>
										<FormSelectItem value="BLOCK">
											Block the Call
										</FormSelectItem>
										<FormSelectItem value="PASS">
											Allow the Call
										</FormSelectItem>
									</FormSelect>
									<FormInput
										name="TIMEOUT_SECONDS"
										type="number"
										min={0}
										step={1}
										label="Judge Timeout in Seconds"
										description="Leave empty to use the model's own timeout. A timeout counts as a judge error."
										disabled={isSubmitting}
									/>
								</div>
								<FormTextarea
									name="BLOCKED_MESSAGE"
									label="Blocked Message"
									description="Optional. Sent back in place of a blocked request when an input pipeline responds with the guardrail's message. An output pipeline blocks a response but cannot replace it."
									rows={3}
									disabled={isSubmitting}
								/>
							</FieldSet>
						</div>
					</div>

					<Separator />
				</div>

				{errors.root?.server?.message && (
					<Alert variant="destructive" className="mt-4">
						<AlertDescription>
							{errors.root.server.message}
						</AlertDescription>
					</Alert>
				)}
				<FormActions
					className="mt-4"
					isSubmitting={isSubmitting}
					onCancel={() => onSubmit()}
					submitLabel="Create Guardrail"
				/>
			</div>
		</Form>
	);
};
