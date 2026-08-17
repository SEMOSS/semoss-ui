import { useEffect, useRef, useState } from "react";
import { runPixel } from "@semoss/sdk";
import { Button, toast } from "@semoss/ui/next";
import type {
	AutomationNodeForType,
	AutomationNodeType,
	GeneratedSetupSnapshot,
	GeneratedStepConfig,
	GeneratedStepMetadata,
	NodeConfigByType,
} from "../../../domain/automation.types";
import {
	getGeneratedSetupFingerprint,
	getGeneratedSetupSnapshot,
	isGeneratedSetupStale,
	validateNodeSetup,
} from "../../../domain/automation-utils";

type GeneratableNodeType = Exclude<AutomationNodeType, "trigger">;

interface GeneratePythonStepProps<T extends GeneratableNodeType> {
	projectId: string;
	step: AutomationNodeForType<T>;
	onChange: (config: NodeConfigByType[T]) => void;
}

interface GenerateAutomationStepResult {
	stepRef: string;
	generatedStep: GeneratedStepMetadata;
}

interface PreviewAutomationStepUpdateResult {
	stepRef: string;
	currentSource: string;
	currentSourceHash: string;
	proposedSource: string;
	proposedSourceHash: string;
	setupHash: string;
	templateVersion: string;
	changed: boolean;
}

interface SourceReview extends PreviewAutomationStepUpdateResult {
	setupFingerprint: string;
	sourceWasModified: boolean;
}

function encodeBase64(value: string): string {
	return btoa(
		encodeURIComponent(value).replace(/%([0-9A-F]{2})/gi, (_, hex) =>
			String.fromCharCode(Number.parseInt(hex, 16)),
		),
	);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function readBackendMessage(output: unknown): string | null {
	if (typeof output === "string") return output;
	if (!isRecord(output)) return null;
	if (typeof output.error === "string") return output.error;
	if (typeof output.message === "string") return output.message;
	return null;
}

function readText(output: Record<string, unknown>, key: string): string {
	const value = output[key];
	if (typeof value !== "string" || !value.trim()) {
		throw new Error(`The generated step response did not include ${key}.`);
	}
	return value;
}

function readGeneratedStep(
	output: unknown,
	fallbackStepRef?: string,
): GenerateAutomationStepResult {
	if (!isRecord(output)) {
		throw new Error(
			readBackendMessage(output) ??
				"The generated step response was invalid.",
		);
	}

	const responseStepRef =
		typeof output.stepRef === "string" ? output.stepRef.trim() : "";
	const stepRef = responseStepRef || fallbackStepRef?.trim() || "";
	if (!stepRef) {
		throw new Error(
			readBackendMessage(output) ??
				"The generated step response did not include a file path.",
		);
	}

	const generatedStep: GeneratedStepMetadata = {};
	if (typeof output.source === "string") {
		generatedStep.source = output.source;
	}
	if (typeof output.actionId === "string") {
		generatedStep.actionId = output.actionId;
	}
	if (typeof output.description === "string") {
		generatedStep.description = output.description;
	}
	if (typeof output.usage === "string") {
		generatedStep.usage = output.usage;
	}
	if (typeof output.sourceHash === "string") {
		generatedStep.sourceHash = output.sourceHash;
	}
	if (typeof output.setupHash === "string") {
		generatedStep.setupHash = output.setupHash;
	}
	if (typeof output.templateVersion === "string") {
		generatedStep.templateVersion = output.templateVersion;
	}

	return { stepRef, generatedStep };
}

function readPreview(
	output: unknown,
	fallbackStepRef: string,
): PreviewAutomationStepUpdateResult {
	if (!isRecord(output)) {
		throw new Error(
			readBackendMessage(output) ??
				"The update preview response was invalid.",
		);
	}

	const stepRef =
		(typeof output.stepRef === "string" && output.stepRef.trim()) ||
		fallbackStepRef.trim();
	if (!stepRef) {
		throw new Error("The update preview did not include a file path.");
	}
	if (typeof output.changed !== "boolean") {
		throw new Error(
			"The update preview did not indicate whether source changed.",
		);
	}

	return {
		stepRef,
		currentSource: readText(output, "currentSource"),
		currentSourceHash: readText(output, "currentSourceHash"),
		proposedSource: readText(output, "proposedSource"),
		proposedSourceHash: readText(output, "proposedSourceHash"),
		setupHash: readText(output, "setupHash"),
		templateVersion: readText(output, "templateVersion"),
		changed: output.changed,
	};
}

function inferInputMappings(
	config: GeneratedStepConfig,
): Record<string, string> {
	const inferredInputs: Record<string, string> = {};

	for (const [key, value] of Object.entries(config)) {
		if (
			key !== "inputs" &&
			key !== "stepRef" &&
			key !== "generatedStep" &&
			typeof value === "string" &&
			/\$\{[^}]+\}/.test(value)
		) {
			inferredInputs[key] = value;
		}
	}

	return inferredInputs;
}

function withInputMappings<T extends GeneratedStepConfig>(
	config: T,
): T & { inputs: Record<string, string> } {
	return {
		...config,
		inputs: {
			...config.inputs,
			...inferInputMappings(config),
		},
	};
}

function getGenerationConfig(config: GeneratedStepConfig): GeneratedStepConfig {
	const configWithInputs = withInputMappings(config);
	const {
		stepRef: _stepRef,
		generatedStep: _generatedStep,
		...setup
	} = configWithInputs;
	return setup;
}

function generateStepPixel(
	reactor:
		| "GenerateAutomationStep"
		| "PreviewAutomationStepUpdate"
		| "ApplyAutomationStepUpdate",
	projectId: string,
	nodeId: string,
	nodeType: AutomationNodeType,
	config: GeneratedStepConfig,
	expectedSourceHash?: string,
): string {
	const parameters = [
		`project=["${projectId}"]`,
		`nodeId=["${nodeId}"]`,
		`nodeType=["${nodeType}"]`,
		`config=["${encodeBase64(JSON.stringify(config))}"]`,
	];
	if (expectedSourceHash) {
		parameters.push(`expectedSourceHash=["${expectedSourceHash}"]`);
	}
	return `${reactor}(${parameters.join(", ")});`;
}

function getPixelOutput(result: Awaited<ReturnType<typeof runPixel>>): unknown {
	const pixelReturns = result.pixelReturn ?? [];
	return pixelReturns[pixelReturns.length - 1]?.output;
}

function isSourceChangedError(error: unknown): boolean {
	if (!(error instanceof Error)) return false;
	return /source.*changed|source hash|expected.*hash|hash.*match/i.test(
		error.message,
	);
}

export function GeneratePythonStep<T extends GeneratableNodeType>({
	projectId,
	step,
	onChange,
}: GeneratePythonStepProps<T>) {
	const [review, setReview] = useState<SourceReview | null>(null);
	const [reviewError, setReviewError] = useState<string | null>(null);
	const [previewing, setPreviewing] = useState(false);
	const [applying, setApplying] = useState(false);
	const initialGenerationRequestedRef = useRef(false);
	const latestConfigRef = useRef(step.config);
	const latestSetupFingerprintRef = useRef("");
	const mountedRef = useRef(true);
	const setupSnapshot = getGeneratedSetupSnapshot(step.config);
	const setupFingerprint = getGeneratedSetupFingerprint(setupSnapshot);
	const setupErrors = validateNodeSetup(step);
	const canGenerate = Boolean(projectId) && setupErrors.length === 0;
	const isStale = isGeneratedSetupStale(step.config);

	useEffect(() => {
		mountedRef.current = true;
		return () => {
			mountedRef.current = false;
		};
	}, []);

	useEffect(() => {
		latestConfigRef.current = step.config;
		latestSetupFingerprintRef.current = setupFingerprint;
		if (review && review.setupFingerprint !== setupFingerprint) {
			setReview(null);
		}
	}, [review, setupFingerprint, step.config]);

	useEffect(() => {
		if (
			!canGenerate ||
			step.config.stepRef?.trim() ||
			initialGenerationRequestedRef.current
		) {
			return;
		}

		const generationConfig = getGenerationConfig(step.config);
		const generatedSetup: GeneratedSetupSnapshot =
			getGeneratedSetupSnapshot(generationConfig);
		const timer = window.setTimeout(() => {
			initialGenerationRequestedRef.current = true;
			void runPixel(
				generateStepPixel(
					"GenerateAutomationStep",
					projectId,
					step.id,
					step.type,
					generationConfig,
				),
			)
				.then((result) => {
					const generated = readGeneratedStep(getPixelOutput(result));
					const currentConfig = withInputMappings(
						latestConfigRef.current,
					);
					onChange({
						...currentConfig,
						stepRef: generated.stepRef,
						generatedStep: {
							...currentConfig.generatedStep,
							...generated.generatedStep,
							generatedSetup,
						},
					});
				})
				.catch((generationError) => {
					initialGenerationRequestedRef.current = false;
					if (!mountedRef.current) return;
					const message =
						generationError instanceof Error
							? generationError.message
							: "An unexpected error occurred.";
					toast.error(`Unable to prepare this action: ${message}`);
				});
		}, 500);

		return () => window.clearTimeout(timer);
	}, [canGenerate, onChange, projectId, step.config, step.id, step.type]);

	const handlePreview = async () => {
		if (
			previewing ||
			applying ||
			!projectId ||
			!isStale ||
			!step.config.stepRef?.trim()
		) {
			return;
		}

		const previewConfig = getGenerationConfig(step.config);
		const previewFingerprint = getGeneratedSetupFingerprint(
			getGeneratedSetupSnapshot(previewConfig),
		);
		setPreviewing(true);
		setReviewError(null);
		try {
			const result = await runPixel(
				generateStepPixel(
					"PreviewAutomationStepUpdate",
					projectId,
					step.id,
					step.type,
					previewConfig,
				),
			);
			if (
				!mountedRef.current ||
				latestSetupFingerprintRef.current !== previewFingerprint
			) {
				return;
			}
			const preview = readPreview(
				getPixelOutput(result),
				step.config.stepRef,
			);
			onChange(withInputMappings(latestConfigRef.current));
			setReview({
				...preview,
				setupFingerprint: previewFingerprint,
				sourceWasModified:
					Boolean(step.config.generatedStep?.sourceHash) &&
					step.config.generatedStep?.sourceHash !==
						preview.currentSourceHash,
			});
		} catch (previewError) {
			const message =
				previewError instanceof Error
					? previewError.message
					: "An unexpected error occurred.";
			setReviewError(`Unable to preview the update: ${message}`);
		} finally {
			if (mountedRef.current) setPreviewing(false);
		}
	};

	const handleApply = async () => {
		if (
			applying ||
			!review ||
			review.setupFingerprint !== setupFingerprint
		) {
			return;
		}

		const applyConfig = getGenerationConfig(step.config);
		const generatedSetup = getGeneratedSetupSnapshot(applyConfig);
		setApplying(true);
		setReviewError(null);
		try {
			const result = await runPixel(
				generateStepPixel(
					"ApplyAutomationStepUpdate",
					projectId,
					step.id,
					step.type,
					applyConfig,
					review.currentSourceHash,
				),
			);
			const applied = readGeneratedStep(
				getPixelOutput(result),
				review.stepRef,
			);
			const currentConfig = withInputMappings(latestConfigRef.current);
			onChange({
				...currentConfig,
				stepRef: applied.stepRef,
				generatedStep: {
					...currentConfig.generatedStep,
					...applied.generatedStep,
					generatedSetup,
				},
			});
			if (mountedRef.current) {
				setReview(null);
				toast.success("Generated Python updated");
			}
		} catch (applyError) {
			if (isSourceChangedError(applyError)) {
				setReview(null);
				setReviewError(
					"The generated source changed. Review the latest update before applying.",
				);
				return;
			}
			const message =
				applyError instanceof Error
					? applyError.message
					: "An unexpected error occurred.";
			setReviewError(`Unable to apply the update: ${message}`);
		} finally {
			if (mountedRef.current) setApplying(false);
		}
	};

	if (!isStale) return null;

	return (
		<div
			className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3"
			data-testid="generate-python-step-review-update"
		>
			{review ? (
				<div className="space-y-3">
					<div className="flex items-center justify-between gap-3">
						<div>
							<p className="font-medium text-sm">
								Review generated Python update
							</p>
							<p className="text-muted-foreground text-xs">
								{review.changed
									? "Your setup changes will update the generated source."
									: "The proposed source is unchanged, but applying records this setup."}
							</p>
						</div>
						<Button
							size="sm"
							variant="ghost"
							onClick={() => {
								setReview(null);
								setReviewError(null);
							}}
							disabled={applying}
						>
							Cancel
						</Button>
					</div>
					<div className="grid gap-3 lg:grid-cols-2">
						<div className="min-w-0">
							<p className="mb-1 font-medium text-muted-foreground text-xs">
								Current source
							</p>
							<pre className="max-h-64 overflow-auto whitespace-pre-wrap break-all rounded border bg-background p-2 font-mono text-[11px]">
								{review.currentSource}
							</pre>
						</div>
						<div className="min-w-0">
							<p className="mb-1 font-medium text-muted-foreground text-xs">
								Proposed source
							</p>
							<pre className="max-h-64 overflow-auto whitespace-pre-wrap break-all rounded border bg-background p-2 font-mono text-[11px]">
								{review.proposedSource}
							</pre>
						</div>
					</div>
					{review.sourceWasModified && (
						<p className="rounded border border-amber-500/40 bg-amber-500/10 p-2 text-amber-800 text-xs dark:text-amber-200">
							This Python file was changed after it was generated.
							Applying this update will replace those manual edits.
						</p>
					)}
					{reviewError && (
						<p className="text-destructive text-xs">
							{reviewError}
						</p>
					)}
					<div className="flex justify-end">
						<Button
							size="sm"
							variant={
								review.sourceWasModified
									? "destructive"
									: "default"
							}
							onClick={() => void handleApply()}
							disabled={applying}
						>
							{applying
								? "Applying…"
								: review.sourceWasModified
									? "Replace edited source"
									: "Apply update"}
						</Button>
					</div>
				</div>
			) : (
				<div className="flex items-center justify-between gap-3">
					<div>
						<p className="font-medium text-sm">
							Setup changed — Review update
						</p>
						{reviewError && (
							<p className="mt-1 text-destructive text-xs">
								{reviewError}
							</p>
						)}
					</div>
					<Button
						size="sm"
						onClick={() => void handlePreview()}
						disabled={previewing || !projectId}
					>
						{previewing ? "Preparing…" : "Review update"}
					</Button>
				</div>
			)}
		</div>
	);
}
