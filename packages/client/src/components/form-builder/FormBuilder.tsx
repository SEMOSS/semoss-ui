import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Spinner, toast } from "@semoss/ui/next";
import { uploadImage } from "@/api";
import { useRootStore } from "@/hooks";
import {
	FORM_BUILDER_ACTIONS_STEP,
	FORM_BUILDER_DATABASE_STEP,
	FORM_BUILDER_FIELDS_STEP,
	FORM_BUILDER_NAME_STEP,
	FORM_BUILDER_PREVIEW_STEP,
	FORM_BUILDER_TOTAL_STEPS,
	INITIAL_FORM_BUILDER_STATE,
} from "./form-builder.constants";
import { generateFormAppFiles } from "./form-builder.helpers";
import type { FormBuilderState } from "./form-builder.types";
import { FormBuilderStep } from "./steps/FormBuilderStep";
import { FormBuilderSummary } from "./summary/FormBuilderSummary";

export const FormBuilder = () => {
	const { monolithStore, configStore } = useRootStore();
	const navigate = useNavigate();
	const [state, setState] = useState<FormBuilderState>(
		INITIAL_FORM_BUILDER_STATE,
	);
	const [currentStep, setCurrentStep] = useState(FORM_BUILDER_NAME_STEP);

	const updateState = (updates: Partial<FormBuilderState>) => {
		setState((prev) => ({ ...prev, ...updates }));
	};

	// ----- Step validation -----
	const isStepValid = (step: number): boolean => {
		switch (step) {
			case FORM_BUILDER_NAME_STEP:
				return !!state.appName.trim();
			case FORM_BUILDER_DATABASE_STEP:
				return !!state.databaseId && state.tables.length > 0;
			case FORM_BUILDER_ACTIONS_STEP:
				return state.tables.every((t) => t.operations.length > 0);
			case FORM_BUILDER_FIELDS_STEP:
				return state.tables.every((t) =>
					t.operations.every((op) =>
						t.fields[op]?.some((f) => f.visible),
					),
				);
			case FORM_BUILDER_PREVIEW_STEP:
				return true;
			default:
				return false;
		}
	};

	// ----- Navigation -----
	const goNext = () => {
		if (currentStep < FORM_BUILDER_TOTAL_STEPS) {
			setCurrentStep(currentStep + 1);
		}
	};

	const goBack = () => {
		if (currentStep > FORM_BUILDER_NAME_STEP) {
			setCurrentStep(currentStep - 1);
		}
	};

	// ----- App creation -----
	const createApp = async () => {
		updateState({ isCreating: true });
		try {
			// 1. Create the CODE project
			const createPixel = `CreateProject(project=["${state.appName}"], portal=[true], projectType=["CODE"]);`;
			const createResponse =
				await monolithStore.runQuery<[{ project_id: string }]>(
					createPixel,
				);

			if (createResponse.errors.length > 0) {
				throw new Error(createResponse.errors.join(", "));
			}

			const appId = createResponse.pixelReturn[0].output.project_id;
			if (!appId) throw new Error("Failed to create project");

			// 2. Generate all files
			const files = generateFormAppFiles(state);

			// 3. Save each file to the project
			for (const file of files) {
				const filePath = `version/assets/portals/${file.path}`;
				const encoded = `<encode>${file.content}</encode>`;
				const savePixel = `SaveAsset(fileName=["${filePath}"], content=["${encoded}"], space=["${appId}"]);`;
				const saveResponse = await monolithStore.runQuery(savePixel);

				if (
					saveResponse.pixelReturn[0]?.operationType
						?.toString()
						.includes("ERROR")
				) {
					console.error(
						`Error saving ${file.path}:`,
						saveResponse.pixelReturn[0].output,
					);
				}
			}

			// 4. Commit all files
			const commitPixel = `CommitAsset(filePath=["version/assets/portals/"], comment=["Form Builder: initial scaffold"], space=["${appId}"]);`;
			await monolithStore.runQuery(commitPixel);

			// 5. Set metadata if provided
			if (state.appDescription || state.appTags.length) {
				await monolithStore.runQuery(
					`SetProjectMetadata(project=["${appId}"], meta=[${JSON.stringify(
						{
							tag: state.appTags,
							description: state.appDescription,
						},
					)}])`,
				);
			}

			// 6. Upload image if provided
			if (state.appImage) {
				await uploadImage(
					[state.appImage],
					appId,
					configStore.store.insightID,
				);
			}

			toast("App created successfully! Opening editor...");

			// 7. Navigate to the editor
			navigate(`/app/${appId}/edit`);
		} catch (err) {
			console.error("Form Builder error:", err);
			toast(
				`Error creating app: ${err instanceof Error ? err.message : "Unknown error"}`,
			);
			updateState({ isCreating: false });
		}
	};

	// ----- Button labels -----
	const nextLabel =
		currentStep === FORM_BUILDER_PREVIEW_STEP ? "Create App" : "Next";

	const handleNext = () => {
		if (currentStep === FORM_BUILDER_PREVIEW_STEP) {
			createApp();
		} else {
			goNext();
		}
	};

	return (
		<div className="grid h-full grid-cols-[240px_1fr] gap-6">
			{/* Sidebar */}
			<aside className="rounded-lg border bg-card p-4">
				<FormBuilderSummary
					currentStep={currentStep}
					state={state}
					onStepClick={(step) => {
						if (step <= currentStep) setCurrentStep(step);
					}}
				/>
			</aside>

			{/* Main content */}
			<div className="flex flex-col gap-4">
				<FormBuilderStep
					currentStep={currentStep}
					state={state}
					onUpdate={updateState}
				/>

				{/* Navigation buttons */}
				<div className="flex items-center justify-between">
					<Button
						variant="outline"
						onClick={goBack}
						disabled={
							currentStep === FORM_BUILDER_NAME_STEP ||
							state.isCreating
						}
					>
						Back
					</Button>
					<Button
						onClick={handleNext}
						disabled={!isStepValid(currentStep) || state.isCreating}
					>
						{state.isCreating && (
							<Spinner className="mr-2 size-4" />
						)}
						{nextLabel}
					</Button>
				</div>
			</div>
		</div>
	);
};
