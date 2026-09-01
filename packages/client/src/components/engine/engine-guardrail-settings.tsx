import { AlertTriangle, Copy, Plus, Save, Trash2, Undo2 } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { Role } from "@semoss/sdk";
import { usePixel } from "@semoss/sdk/react";
import {
	Badge,
	Button,
	Card,
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Field,
	FieldLabel,
	Form,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Spinner,
	Tabs,
	TabsList,
	TabsTrigger,
	toast,
	useForm,
	zodResolver,
} from "@semoss/ui/next";
import { useRootStore } from "@/hooks";
import {
	collectGuardrailConfigIssues,
	createGuardrailPipeline,
	extractGuardrailEngineDetails,
	extractGuardrailFileStatus,
	extractInterceptableMethods,
	extractResultArgumentName,
	type GetModelGuardrailConfigResponse,
	GUARDRAIL_ALL_METHODS,
	type GuardrailConfigFormValue,
	type GuardrailConfigIssue,
	type GuardrailPhase,
	guardrailConfigFromResponse,
	guardrailConfigSchema,
	guardrailConfigToJson,
	validateGuardrailConfig,
} from "./engine-guardrail-settings.constants";
import { GuardrailConfigStatus } from "./guardrail-config-status";
import { GuardrailIssueList } from "./guardrail-issue-list";
import {
	GuardrailPipelineField,
	type GuardrailRevealTarget,
} from "./guardrail-pipeline-field";

export interface EngineGuardrailSettingsProps {
	/** Id of the model engine */
	engineId: string;

	/** User's permission for the engine */
	permission: Role;

	/** Called after the guardrail configuration is saved */
	onUpdated?: () => void;
}

type GuardrailEditorMode = "form" | "json";

/**
 * Model guardrail editor. One rule is edited at a time, chosen from a selector
 * above the editor so the full width goes to the rule's checks.
 */
export const EngineGuardrailSettings = ({
	engineId,
	permission,
	onUpdated,
}: EngineGuardrailSettingsProps) => {
	const { configStore } = useRootStore();
	const fieldId = useId();
	const ruleSelectId = useId();
	const isEditable = permission === "OWNER" || permission === "EDIT";

	const getConfig = usePixel<GetModelGuardrailConfigResponse>(
		engineId ? `GetModelGuardrailConfig(engine=["${engineId}"]);` : "",
	);

	const form = useForm<GuardrailConfigFormValue>({
		resolver: zodResolver(guardrailConfigSchema),
		defaultValues: { pipelines: [] },
	});
	const [mode, setMode] = useState<GuardrailEditorMode>("form");
	const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(
		null,
	);
	const [revealTarget, setRevealTarget] =
		useState<GuardrailRevealTarget | null>(null);
	// held here so selecting another rule keeps the reader on the same side of
	// the call instead of snapping back to the request checks
	const [activePhase, setActivePhase] = useState<GuardrailPhase>("input");
	const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
	const hasChosenPhaseRef = useRef(false);
	// names for engines picked during this session, so a check keeps showing the
	// engine's name before the configuration is reloaded
	const [pickedEngineNames, setPickedEngineNames] = useState<
		Record<string, string>
	>({});
	const pipelines = form.watch("pipelines");
	const isDirty = form.formState.isDirty;
	const isSubmitting = form.formState.isSubmitting;
	const hasUnsavedChangesRef = useRef(false);
	hasUnsavedChangesRef.current = isDirty || isSubmitting;

	useEffect(() => {
		if (getConfig.status !== "SUCCESS" || hasUnsavedChangesRef.current) {
			return;
		}

		const nextForm = guardrailConfigFromResponse(getConfig.data);
		form.reset(nextForm);
		setSelectedPipelineId((current) =>
			nextForm.pipelines.some((pipeline) => pipeline.id === current)
				? current
				: nextForm.pipelines[0]?.id || null,
		);

		// Open on the phase the first rule actually screens. Only on the first
		// load, so a refetch after saving does not move the tab the reader
		// chose, and so switching rules leaves it alone.
		if (!hasChosenPhaseRef.current) {
			hasChosenPhaseRef.current = true;
			const first = nextForm.pipelines[0];
			if (first && first.input.length === 0 && first.output.length > 0) {
				setActivePhase("output");
			}
		}
	}, [getConfig.status, getConfig.data, form]);

	// unsaved rules are held only in this form, so leaving the page drops them
	useEffect(() => {
		if (!isDirty) {
			return;
		}
		const warnBeforeUnload = (event: BeforeUnloadEvent) => {
			event.preventDefault();
		};
		window.addEventListener("beforeunload", warnBeforeUnload);
		return () =>
			window.removeEventListener("beforeunload", warnBeforeUnload);
	}, [isDirty]);

	const selectedPipeline =
		pipelines.find((pipeline) => pipeline.id === selectedPipelineId) ||
		pipelines[0] ||
		null;
	const selectedIndex = selectedPipeline
		? pipelines.findIndex((pipeline) => pipeline.id === selectedPipeline.id)
		: -1;
	const engineDetails = extractGuardrailEngineDetails(getConfig.data);
	const interceptableMethods = extractInterceptableMethods(getConfig.data);
	const resultArgumentName = extractResultArgumentName(getConfig.data);
	const fileStatus = extractGuardrailFileStatus(getConfig.data);
	const issues = collectGuardrailConfigIssues(
		{ pipelines },
		{ methods: interceptableMethods, resultArgumentName },
	);
	const errorPipelineIds = new Set(
		issues
			.filter((issue) => issue.severity === "error" && issue.pipelineId)
			.map((issue) => issue.pipelineId as string),
	);
	const savedPipelines = form.formState.defaultValues?.pipelines ?? [];
	const dirtyPipelineIds = new Set(
		pipelines
			.filter((pipeline) => {
				const saved = savedPipelines.find(
					(candidate) => candidate.id === pipeline.id,
				);
				return (
					!saved || JSON.stringify(saved) !== JSON.stringify(pipeline)
				);
			})
			.map((pipeline) => pipeline.id),
	);
	const totalChecks = pipelines.reduce(
		(total, pipeline) =>
			total + pipeline.input.length + pipeline.output.length,
		0,
	);
	const configJson = useMemo(
		() =>
			mode === "json"
				? JSON.stringify(
						JSON.parse(guardrailConfigToJson({ pipelines })),
						null,
						2,
					)
				: "",
		[mode, pipelines],
	);

	const updatePipelines = (next: GuardrailConfigFormValue["pipelines"]) => {
		form.setValue("pipelines", next, {
			shouldDirty: true,
			shouldTouch: true,
		});
	};

	const addPipeline = () => {
		// start the rule on a call no other rule covers, so it does not open
		// already reporting a duplicate
		const claimed = new Set(
			pipelines.map((pipeline) => pipeline.method.trim()),
		);
		const method = !claimed.has(GUARDRAIL_ALL_METHODS)
			? GUARDRAIL_ALL_METHODS
			: (interceptableMethods.find(
					(candidate) => !claimed.has(candidate.name),
				)?.name ?? "");
		const pipeline = createGuardrailPipeline(method);
		updatePipelines([...pipelines, pipeline]);
		setSelectedPipelineId(pipeline.id);
		setMode("form");
	};

	const removePipeline = (pipelineId: string) => {
		const index = pipelines.findIndex(
			(pipeline) => pipeline.id === pipelineId,
		);
		const next = pipelines.filter((pipeline) => pipeline.id !== pipelineId);
		updatePipelines(next);
		if (selectedPipelineId === pipelineId) {
			setSelectedPipelineId(
				next[Math.min(Math.max(index, 0), next.length - 1)]?.id || null,
			);
		}
	};

	const pipelineToRemove = pipelines.find(
		(pipeline) => pipeline.id === confirmRemoveId,
	);
	const removalCheckCount = pipelineToRemove
		? pipelineToRemove.input.length + pipelineToRemove.output.length
		: 0;
	const removalMethod = pipelineToRemove?.method.trim();
	const removalSummary =
		removalCheckCount === 0
			? "The rule has no checks and will be removed from the configuration."
			: `Its ${removalCheckCount} ${removalCheckCount === 1 ? "check stops" : "checks stop"} screening ${removalMethod === GUARDRAIL_ALL_METHODS ? "every call" : removalMethod || "this call"}. The change applies once the configuration is saved.`;

	const revealIssue = (issue: GuardrailConfigIssue) => {
		if (!issue.pipelineId) {
			return;
		}
		setMode("form");
		setSelectedPipelineId(issue.pipelineId);
		setRevealTarget(issue.entryId ? { entryId: issue.entryId } : null);
	};

	const handleDiscard = () => {
		const defaults = form.formState.defaultValues?.pipelines ?? [];
		form.reset();
		setSelectedPipelineId((current) =>
			defaults.some((pipeline) => pipeline.id === current)
				? current
				: defaults[0]?.id || null,
		);
	};

	const copyConfigJson = async () => {
		try {
			await navigator.clipboard.writeText(configJson);
			toast.success("Copied the guardrail configuration");
		} catch {
			toast.error("Unable to copy the guardrail configuration");
		}
	};

	const handleSubmit = async (values: GuardrailConfigFormValue) => {
		try {
			const response = await configStore.runPixel(
				`UpdateModelGuardrailConfig(engine=["${engineId}"], map=[${guardrailConfigToJson(values)}]);`,
			);
			const result = response.pixelReturn?.[0];
			if (
				response.errors.length > 0 ||
				String(result?.operationType || "").includes("ERROR")
			) {
				throw new Error(
					response.errors.join("") ||
						String(
							result?.output ||
								"Unable to update the guardrail configuration.",
						),
				);
			}

			form.reset(values);
			toast.success("Guardrail configuration updated");
			getConfig.refresh();
			onUpdated?.();
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Unable to update the guardrail configuration.",
			);
		}
	};

	const handleInvalid = () => {
		const validation = validateGuardrailConfig(form.getValues());
		toast.error(
			validation === true
				? "Review the guardrail configuration before saving."
				: validation,
		);
	};

	if (getConfig.status === "ERROR") {
		return (
			<p className="text-destructive text-sm">
				{getConfig.error?.message ||
					"Unable to load the guardrail configuration."}
			</p>
		);
	}

	if (getConfig.status !== "SUCCESS") {
		return (
			<div className="flex min-h-64 items-center justify-center">
				<Spinner />
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<GuardrailConfigStatus
				status={fileStatus}
				ruleCount={pipelines.length}
				isEditable={isEditable}
			/>

			<GuardrailIssueList issues={issues} onSelect={revealIssue} />

			<Card className="gap-0 py-0">
				<Form
					form={form}
					onSubmit={handleSubmit}
					onError={handleInvalid}
					className="flex flex-col"
				>
					<div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
						<div className="min-w-0 space-y-1">
							<div className="flex flex-wrap items-center gap-2">
								<h2 className="font-semibold text-base">
									Guardrails
								</h2>
								<Badge variant="outline">
									{pipelines.length}{" "}
									{pipelines.length === 1 ? "rule" : "rules"}
								</Badge>
								<Badge variant="outline">
									{totalChecks}{" "}
									{totalChecks === 1 ? "check" : "checks"}
								</Badge>
								{isDirty && (
									<Badge variant="secondary">
										Unsaved changes
									</Badge>
								)}
							</div>
							<p className="text-muted-foreground text-sm">
								Screen model requests and responses. Saved
								changes apply to the running engine immediately.
							</p>
						</div>

						<div className="flex flex-wrap items-center gap-2">
							<Tabs
								value={mode}
								onValueChange={(value) =>
									setMode(value as GuardrailEditorMode)
								}
							>
								<TabsList>
									<TabsTrigger value="form">Form</TabsTrigger>
									<TabsTrigger value="json">JSON</TabsTrigger>
								</TabsList>
							</Tabs>
							{isEditable && (
								<>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={handleDiscard}
										disabled={!isDirty || isSubmitting}
										data-testid="engine-guardrail-settings--cancel-btn"
									>
										<Undo2 className="size-4" aria-hidden />
										Discard
									</Button>
									<Button
										type="submit"
										size="sm"
										disabled={!isDirty || isSubmitting}
										data-testid="engine-guardrail-settings--save-btn"
									>
										{isSubmitting ? (
											<Spinner className="size-4" />
										) : (
											<Save
												className="size-4"
												aria-hidden
											/>
										)}
										Save
									</Button>
								</>
							)}
						</div>
					</div>

					{mode === "json" ? (
						<div className="space-y-2 p-4">
							<div className="flex flex-wrap items-center justify-between gap-2">
								<p className="text-muted-foreground text-xs">
									{isDirty
										? "Read-only preview of the pipeline.json that will be saved, including unsaved changes."
										: "Read-only preview of the pipeline.json that will be saved."}
								</p>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={copyConfigJson}
									data-testid="engine-guardrail-settings--copy-json"
								>
									<Copy className="size-4" aria-hidden />
									Copy
								</Button>
							</div>
							<pre
								className="max-h-[60vh] select-text overflow-auto rounded-md bg-muted p-4 font-mono text-xs"
								data-testid="engine-guardrail-settings--config-json"
							>
								{configJson}
							</pre>
						</div>
					) : (
						<div className="space-y-4 p-4">
							<div className="flex flex-wrap items-end gap-2">
								<Field className="min-w-56 flex-1">
									<FieldLabel htmlFor={ruleSelectId}>
										Rule
									</FieldLabel>
									<Select
										value={selectedPipeline?.id ?? ""}
										onValueChange={(id) => {
											// Radix mirrors this select into a hidden native
											// select for the surrounding form, which reports an
											// empty value while the option list is unmounted. No
											// rule has an empty id, so that is never a choice.
											if (!id) {
												return;
											}
											setSelectedPipelineId(id);
											setRevealTarget(null);
										}}
										disabled={pipelines.length === 0}
									>
										<SelectTrigger
											id={ruleSelectId}
											className="w-full"
											data-testid="engine-guardrail-settings--rule-select"
										>
											<SelectValue placeholder="No rules configured" />
										</SelectTrigger>
										<SelectContent>
											{pipelines.map((pipeline) => {
												const method =
													pipeline.method.trim();
												return (
													<SelectItem
														key={pipeline.id}
														value={pipeline.id}
													>
														<span className="flex w-full min-w-0 items-center gap-2">
															{errorPipelineIds.has(
																pipeline.id,
															) && (
																<AlertTriangle className="size-3.5 shrink-0 text-destructive" />
															)}
															<span className="truncate font-mono">
																{method ||
																	"no call selected"}
															</span>
															<span className="ms-auto shrink-0 text-muted-foreground text-xs">
																{
																	pipeline
																		.input
																		.length
																}{" "}
																request,{" "}
																{
																	pipeline
																		.output
																		.length
																}{" "}
																response
																{dirtyPipelineIds.has(
																	pipeline.id,
																)
																	? " - edited"
																	: ""}
															</span>
														</span>
													</SelectItem>
												);
											})}
										</SelectContent>
									</Select>
								</Field>
								{isEditable && (
									<>
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={addPipeline}
											data-testid="engine-guardrail-settings--add-pipeline-btn"
										>
											<Plus
												className="size-4"
												aria-hidden
											/>
											Add Rule
										</Button>
										{selectedPipeline && (
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={() =>
													setConfirmRemoveId(
														selectedPipeline.id,
													)
												}
												disabled={isSubmitting}
												data-testid="engine-guardrail-settings--remove-pipeline-btn"
											>
												<Trash2
													className="size-4"
													aria-hidden
												/>
												Remove Rule
											</Button>
										)}
									</>
								)}
							</div>

							{selectedPipeline && selectedIndex >= 0 ? (
								<GuardrailPipelineField
									key={selectedPipeline.id}
									value={selectedPipeline}
									activePhase={activePhase}
									onPhaseChange={setActivePhase}
									engineDetails={engineDetails}
									engineNames={pickedEngineNames}
									onEngineResolved={(id, name) =>
										setPickedEngineNames((current) =>
											current[id] === name
												? current
												: { ...current, [id]: name },
										)
									}
									methods={interceptableMethods}
									takenMethods={pipelines
										.filter(
											(pipeline) =>
												pipeline.id !==
												selectedPipeline.id,
										)
										.map((pipeline) => pipeline.method)}
									resultArgumentName={resultArgumentName}
									issues={issues.filter(
										(issue) =>
											issue.pipelineId ===
											selectedPipeline.id,
									)}
									revealTarget={revealTarget}
									disabled={!isEditable || isSubmitting}
									idPrefix={`${fieldId}-pipeline-${selectedIndex}`}
									testIdPrefix={`engine-guardrail-settings--pipeline-${selectedIndex}`}
									namePrefix={`pipelines.${selectedIndex}`}
								/>
							) : (
								<div
									className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-md border border-dashed p-6 text-center"
									data-testid="engine-guardrail-settings--empty-state"
								>
									<p className="font-medium text-sm">
										No guardrail rules yet
									</p>
									<p className="text-muted-foreground text-xs">
										Add a rule to screen requests,
										responses, or both.
									</p>
									{isEditable && (
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={addPipeline}
										>
											<Plus
												className="size-4"
												aria-hidden
											/>
											Add Rule
										</Button>
									)}
								</div>
							)}
						</div>
					)}
				</Form>
			</Card>

			<Dialog
				open={!!confirmRemoveId}
				onOpenChange={(open) => !open && setConfirmRemoveId(null)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Remove this rule?</DialogTitle>
						<DialogDescription>{removalSummary}</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<DialogClose asChild>
							<Button type="button" variant="outline">
								Cancel
							</Button>
						</DialogClose>
						<Button
							type="button"
							variant="destructive"
							onClick={() => {
								if (confirmRemoveId) {
									removePipeline(confirmRemoveId);
								}
								setConfirmRemoveId(null);
							}}
							data-testid="engine-guardrail-settings--remove-pipeline-confirm"
						>
							<Trash2 className="size-4" aria-hidden />
							Remove Rule
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
};
