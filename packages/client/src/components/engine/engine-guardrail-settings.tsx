import { ChevronsUpDown, Plus } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { Role } from "@semoss/sdk";
import { usePixel } from "@semoss/sdk/react";
import {
	Button,
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	Spinner,
	toast,
} from "@semoss/ui/next";
import { useRootStore } from "@/hooks";
import {
	createGuardrailPipeline,
	extractGuardrailEngineNames,
	findMaskMultiValueConflicts,
	type GetModelGuardrailConfigResponse,
	type GuardrailConfigFormValue,
	guardrailConfigFromResponse,
	guardrailConfigToJson,
	validateGuardrailConfig,
} from "./engine-guardrail-settings.constants";
import { GuardrailPipelineField } from "./guardrail-pipeline-field";
import type { GuardrailEngineOption } from "./guardrail-reactor-entry-field";

export interface EngineGuardrailSettingsProps {
	/** Id of the model engine */
	engineId: string;

	/** User's permission for the engine */
	permission: Role;

	/** Called after the guardrail configuration is saved */
	onUpdated?: () => void;
}

/**
 * Settings card for a model engine's guardrails: loads the pipeline
 * configuration via GetModelGuardrailConfig, edits it with a structured
 * per-method pipeline editor, and saves through UpdateModelGuardrailConfig,
 * which validates and applies the change to the running engine immediately.
 */
export const EngineGuardrailSettings = ({
	engineId,
	permission,
	onUpdated,
}: EngineGuardrailSettingsProps) => {
	const { configStore } = useRootStore();
	const fieldId = useId();
	const isEditable = permission === "OWNER" || permission === "EDIT";

	const getConfig = usePixel<GetModelGuardrailConfigResponse>(
		engineId ? `GetModelGuardrailConfig(engine=["${engineId}"]);` : "",
	);
	const guardrailEngines = usePixel<GuardrailEngineOption[]>(
		`MyEngines(engineTypes=["GUARDRAIL"]);`,
	);

	const [isSaving, setIsSaving] = useState(false);
	const [form, setForm] = useState<GuardrailConfigFormValue | null>(null);
	const [initialForm, setInitialForm] =
		useState<GuardrailConfigFormValue | null>(null);

	const isDirty = JSON.stringify(form) !== JSON.stringify(initialForm);

	// Read through a ref so the resync effect below can check for unsaved work
	// without re-running on every keystroke.
	const isDirtyRef = useRef(isDirty);
	isDirtyRef.current = isDirty;

	useEffect(() => {
		if (getConfig.status !== "SUCCESS") {
			return;
		}

		// A refetch must not overwrite in-progress edits.
		if (isDirtyRef.current) {
			return;
		}

		const nextForm = guardrailConfigFromResponse(getConfig.data);
		setForm(nextForm);
		setInitialForm(nextForm);
	}, [getConfig.status, getConfig.data]);

	const engineOptions = guardrailEngines.data ?? [];
	const enginesLoading = guardrailEngines.status === "LOADING";
	const engineNameFallbacks = extractGuardrailEngineNames(getConfig.data);
	const parseError = getConfig.data?.parseError ?? null;
	const maskConflicts = form ? findMaskMultiValueConflicts(form) : [];

	// pretty-printed pipeline.json for the read-only viewer; tracks the form
	// so it matches the stored file when pristine and the pending save when
	// dirty
	const configJsonPreview = form
		? JSON.stringify(JSON.parse(guardrailConfigToJson(form)), null, 2)
		: "";

	const updateForm = (next: GuardrailConfigFormValue) => setForm(next);

	const handleDiscard = () => {
		setForm(initialForm);
	};

	const handleSave = async () => {
		if (!form) {
			return;
		}
		const validation = validateGuardrailConfig(form);
		if (validation !== true) {
			toast.error(validation);
			return;
		}

		setIsSaving(true);
		try {
			const response = await configStore.runPixel(
				`UpdateModelGuardrailConfig(engine=["${engineId}"], map=[${guardrailConfigToJson(form)}]);`,
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

			setInitialForm(form);
			toast.success("Guardrail configuration updated");
			getConfig.refresh();
			onUpdated?.();
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Unable to update the guardrail configuration.",
			);
		} finally {
			setIsSaving(false);
		}
	};

	const addPipeline = () => {
		if (!form) {
			return;
		}
		// default new pipelines to the next method not already taken; the
		// first one covers every method
		const method = form.pipelines.some(
			(pipeline) => pipeline.method.trim() === "*",
		)
			? ""
			: "*";
		updateForm({
			...form,
			pipelines: [...form.pipelines, createGuardrailPipeline(method)],
		});
	};

	if (getConfig.status === "ERROR") {
		return (
			<p className="text-destructive text-sm">
				{getConfig.error?.message ||
					"Unable to load the guardrail configuration."}
			</p>
		);
	}

	if (getConfig.status !== "SUCCESS" || form === null) {
		return (
			<div className="flex min-h-64 items-center justify-center">
				<Spinner />
			</div>
		);
	}

	return (
		<Card>
			<CardHeader className="border-b">
				<CardTitle>Guardrails</CardTitle>
				<CardDescription>
					Guardrail engines that screen this model's requests and
					responses. Changes apply to the running engine immediately.
				</CardDescription>
				{isEditable && isDirty && (
					<CardAction className="flex gap-2 self-center">
						<Button
							variant="outline"
							size="sm"
							onClick={handleDiscard}
							disabled={isSaving}
							data-testid="engine-guardrail-settings--cancel-btn"
						>
							Discard
						</Button>
						<Button
							size="sm"
							onClick={handleSave}
							disabled={isSaving}
							data-testid="engine-guardrail-settings--save-btn"
						>
							{isSaving ? <Spinner className="size-4" /> : "Save"}
						</Button>
					</CardAction>
				)}
			</CardHeader>
			<CardContent className="space-y-4">
				{parseError && (
					<div
						className="rounded-md border border-destructive p-3 text-sm"
						data-testid="engine-guardrail-settings--parse-error"
					>
						<p className="font-medium text-destructive">
							The stored guardrail configuration could not be
							parsed: {parseError}
						</p>
						<p className="mt-1 text-muted-foreground text-xs">
							Saving will replace the stored file with the
							configuration built here.
						</p>
					</div>
				)}

				{maskConflicts.length > 0 && (
					<p
						className="text-destructive text-sm"
						data-testid="engine-guardrail-settings--mask-conflict-warning"
					>
						A guardrail masks a parameter that is not mapped to
						exactly one argument - the runtime would block instead
						of masking. Fix the parameter mapping before saving.
					</p>
				)}

				{form.pipelines.length === 0 ? (
					<div
						className="flex flex-col items-center gap-3 rounded-md border border-dashed p-8 text-center"
						data-testid="engine-guardrail-settings--empty-state"
					>
						<p className="font-medium text-sm">
							No guardrails are attached to this model yet.
						</p>
						<p className="text-muted-foreground text-xs">
							Attach guardrail engines to screen requests and
							responses for this model.
						</p>
						{isEditable && (
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={addPipeline}
								data-testid="engine-guardrail-settings--add-pipeline-btn"
							>
								<Plus className="h-4 w-4" />
								Add Pipeline
							</Button>
						)}
					</div>
				) : (
					<>
						{form.pipelines.map((pipeline, index) => (
							<GuardrailPipelineField
								key={pipeline.id}
								value={pipeline}
								onChange={(next) =>
									updateForm({
										...form,
										pipelines: form.pipelines.map(
											(other) =>
												other.id === pipeline.id
													? next
													: other,
										),
									})
								}
								onRemove={() =>
									updateForm({
										...form,
										pipelines: form.pipelines.filter(
											(other) => other.id !== pipeline.id,
										),
									})
								}
								engineOptions={engineOptions}
								enginesLoading={enginesLoading}
								engineNameFallbacks={engineNameFallbacks}
								disabled={!isEditable || isSaving}
								idPrefix={`${fieldId}-pipeline-${index}`}
								testIdPrefix={`engine-guardrail-settings--pipeline-${index}`}
							/>
						))}
						{isEditable && (
							<Button
								type="button"
								variant="outline"
								size="sm"
								className="w-fit"
								onClick={addPipeline}
								disabled={isSaving}
								data-testid="engine-guardrail-settings--add-pipeline-btn"
							>
								<Plus className="h-4 w-4" />
								Add Pipeline
							</Button>
						)}
					</>
				)}

				<Collapsible>
					<CollapsibleTrigger asChild>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="w-fit px-2"
							data-testid="engine-guardrail-settings--view-json-btn"
						>
							<ChevronsUpDown className="h-4 w-4" />
							View configuration JSON
						</Button>
					</CollapsibleTrigger>
					<CollapsibleContent className="space-y-1 pt-2">
						{isDirty && (
							<p className="text-muted-foreground text-xs">
								This preview includes unsaved changes.
							</p>
						)}
						<pre
							className="max-h-96 select-text overflow-auto rounded-md bg-muted p-3 font-mono text-xs"
							data-testid="engine-guardrail-settings--config-json"
						>
							{configJsonPreview}
						</pre>
						<p className="text-muted-foreground text-xs">
							The pipeline.json stored with the engine. Read-only
							- edit through the form above.
						</p>
					</CollapsibleContent>
				</Collapsible>
			</CardContent>
		</Card>
	);
};
