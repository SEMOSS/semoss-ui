import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { FlexLayout } from "@semoss/shared";
import { Button, Card, toast } from "@semoss/ui/next";
import {
	INSIGHT_BUILDER_APP_STEP,
	INSIGHT_BUILDER_COMPONENT_STEP,
	INSIGHT_BUILDER_LAYOUT_STEP,
	INSIGHT_BUILDER_QUERY_STEP,
	INSIGHT_BUILDER_SETTINGS_STEP,
} from "../insight.constants";
import type {
	BuilderValue,
	FilterParameter,
	InsightBuilder as InsightBuilderType,
	SavedComponent,
	SavedQuery,
} from "../insight.types";
import { InsightBuilderStep } from "./step/InsightBuilderStep";
import { InsightBuilderSummary } from "./summary/InsightBuilderSummary";

const initialBuilder: InsightBuilderType = {
	queries: {
		step: INSIGHT_BUILDER_QUERY_STEP,
		value: [],
		required: true,
		display: "Queries",
	},
	components: {
		step: INSIGHT_BUILDER_COMPONENT_STEP,
		value: undefined,
		required: false,
		display: "Components",
	},
	app: {
		step: INSIGHT_BUILDER_APP_STEP,
		value: undefined,
		required: false,
		display: "App",
	},
};

interface InsightBuilderProps {
	initialQueries?: SavedQuery[];
	initialComponents?: SavedComponent[];
	initialParameters?: FilterParameter[];
	initialLayout?: FlexLayout.IJsonModel | null;
	editMode?: boolean;
	appMetadata?: {
		existingAppId?: string;
		appName?: string;
		appDescription?: string;
		appTags?: string[];
	};
}

export const InsightBuilder = (props: InsightBuilderProps = {}) => {
	const {
		initialQueries = [],
		initialComponents = [],
		initialParameters = [],
		initialLayout = null,
		editMode = false,
		appMetadata = {},
	} = props;
	const navigate = useNavigate();
	const [builder, setBuilder] = useState<InsightBuilderType>(initialBuilder);
	const [currentBuilderStep, changeBuilderStep] = useState<number>(1);
	const [queryToEdit, setQueryToEdit] = useState<SavedQuery | null>(null);
	const [editingQueryId, setEditingQueryId] = useState<string | null>(null);
	const [editingComponentId, setEditingComponentId] = useState<string | null>(
		null,
	);
	const [savedComponents, setSavedComponents] = useState<SavedComponent[]>(
		[],
	);
	const [componentToEdit, setComponentToEdit] =
		useState<SavedComponent | null>(null);
	const [savedParameters, setSavedParameters] = useState<FilterParameter[]>(
		[],
	);
	const [parameterToEdit, setParameterToEdit] =
		useState<FilterParameter | null>(null);
	const [selectedLLM, setSelectedLLM] = useState<string>("");
	const [showComponentBuilder, setShowComponentBuilder] =
		useState<boolean>(false);
	const [customLayout, setCustomLayout] =
		useState<FlexLayout.IJsonModel | null>(initialLayout);
	const [isLayoutValid, setIsLayoutValid] = useState<boolean>(false);
	const hasInitialized = useRef(false);

	// Sync editingComponentId with componentToEdit
	useEffect(() => {
		setEditingComponentId(componentToEdit?.id || null);
	}, [componentToEdit]);

	// Clear componentToEdit when component builder is closed
	useEffect(() => {
		if (!showComponentBuilder) {
			setComponentToEdit(null);
		}
	}, [showComponentBuilder]);

	// Initialize with existing data in edit mode
	useEffect(() => {
		// Only initialize once when entering edit mode with data
		if (
			editMode &&
			!hasInitialized.current &&
			(initialQueries.length > 0 ||
				initialComponents.length > 0 ||
				initialParameters.length > 0)
		) {
			setBuilder((state) => ({
				...state,
				queries: {
					...state.queries,
					value: initialQueries,
				},
			}));
			setSavedComponents(initialComponents);
			setSavedParameters(initialParameters);
			hasInitialized.current = true;

			// Initialize layout validity in edit mode
			if (initialLayout && initialComponents.length > 0) {
				const allComponentIds = new Set(
					initialComponents.map((c) => c.blockId || c.id),
				);
				const assignedIds = new Set<string>();

				// Recursively find all components assigned in the layout
				const findComponents = (obj: unknown): void => {
					if (!obj || typeof obj !== "object") return;

					const node = obj as {
						type?: string;
						component?: string;
						config?: {
							componentTabs?: Array<{ id?: string }>;
						};
						children?: unknown[];
						layout?: unknown;
					};

					// Check if this is a sheet with componentTabs
					if (
						node.type === "tab" &&
						node.component === "sheet-container" &&
						node.config?.componentTabs
					) {
						for (const tab of node.config.componentTabs) {
							if (tab.id) {
								assignedIds.add(tab.id);
							}
						}
					}

					// Recursively search children and layout
					if (node.children && Array.isArray(node.children)) {
						for (const child of node.children) {
							findComponents(child);
						}
					}
					if (node.layout) {
						findComponents(node.layout);
					}
				};

				findComponents(initialLayout);

				// Layout is valid if all components are assigned
				const allAssigned = Array.from(allComponentIds).every((id) =>
					assignedIds.has(id),
				);
				setIsLayoutValid(allAssigned);
			}
		}
	}, [
		editMode,
		initialQueries,
		initialComponents,
		initialParameters,
		initialLayout,
	]);

	const setBuilderValue = (builderStepKey: string, value: BuilderValue) => {
		setBuilder((state) => ({
			...state,
			[builderStepKey]: {
				...state[builderStepKey as keyof InsightBuilderType],
				value: value,
			},
		}));
	};

	const isBuilderStepComplete = (step: number) => {
		if (editMode) {
			switch (step) {
				case INSIGHT_BUILDER_QUERY_STEP:
					// Step 1 is complete if there are saved queries
					return (
						Array.isArray(builder.queries.value) &&
						builder.queries.value.length > 0
					);
				case INSIGHT_BUILDER_COMPONENT_STEP:
					// Step 2 is complete if there are saved components
					return savedComponents.length > 0;
				case INSIGHT_BUILDER_LAYOUT_STEP:
					// Step 3 is always complete when all components are in a sheet.
					return isLayoutValid;
				case INSIGHT_BUILDER_APP_STEP:
					// Step 4 is complete if app has a title
					return Boolean(
						appMetadata?.appName &&
							appMetadata?.appName.trim() !== "",
					);
				case INSIGHT_BUILDER_SETTINGS_STEP:
					// Step 5 is not complete in edit mode.
					return true;
				default:
					return false;
			}
		}
		switch (step) {
			case INSIGHT_BUILDER_QUERY_STEP:
				return (
					Array.isArray(builder.queries.value) &&
					builder.queries.value.length > 0
				);
			case INSIGHT_BUILDER_COMPONENT_STEP:
				return savedComponents.length > 0;
			case INSIGHT_BUILDER_LAYOUT_STEP:
				return isLayoutValid;
			case INSIGHT_BUILDER_APP_STEP:
				return false;
			default:
				return false;
		}
	};

	const nextButtonText =
		currentBuilderStep === INSIGHT_BUILDER_QUERY_STEP
			? editMode
				? "Next: Update Components"
				: "Next: Build Components"
			: currentBuilderStep === INSIGHT_BUILDER_COMPONENT_STEP
				? editMode
					? "Next: Update Layout"
					: "Next: Customize Layout"
				: currentBuilderStep === INSIGHT_BUILDER_LAYOUT_STEP
					? editMode
						? "Next: Update App"
						: "Next: Create App"
					: currentBuilderStep === INSIGHT_BUILDER_APP_STEP
						? editMode
							? "Next: Update Settings"
							: "Create App"
						: editMode
							? "Update App"
							: "Create App";

	const nextButtonAction = () => {
		// In edit mode, max step is 5 (Settings), otherwise max is 4 (App)
		const maxStep = editMode
			? INSIGHT_BUILDER_SETTINGS_STEP
			: INSIGHT_BUILDER_APP_STEP;
		if (currentBuilderStep < maxStep) {
			changeBuilderStep(currentBuilderStep + 1);
		} else {
			// Final step - create the app
			console.log("Creating app with builder:", builder);
		}
	};

	const backButtonAction = () => {
		changeBuilderStep(currentBuilderStep - 1);
	};

	// Get list of orphaned component IDs (components using deleted queries)
	const getOrphanedComponents = (): string[] => {
		const queryIds = new Set(
			((builder.queries.value as SavedQuery[]) || []).map((q) => q.id),
		);
		return savedComponents
			.filter((component) => {
				// HTML and filter blocks don't require queries
				if (
					component.componentType === "html-block" ||
					component.componentType === "visualization-filter-block"
				) {
					return false;
				}
				return !queryIds.has(component.queryId);
			})
			.map((component) => component.id);
	};

	const orphanedComponentIds = getOrphanedComponents();
	const hasOrphanedComponents = orphanedComponentIds.length > 0;

	return (
		<div className="flex h-full flex-col gap-3">
			<div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-12">
				<div className="sm:col-span-3">
					<Card className="my-1 h-full p-2">
						<InsightBuilderSummary
							currentBuilderStep={currentBuilderStep}
							isBuilderStepComplete={isBuilderStepComplete}
							changeBuilderStep={changeBuilderStep}
							editMode={editMode}
							savedQueries={
								(builder.queries.value as SavedQuery[]) || []
							}
							onDeleteQuery={(id: string) => {
								const currentQueries =
									(builder.queries.value as SavedQuery[]) ||
									[];
								const updatedQueries = currentQueries.filter(
									(q) => q.id !== id,
								);
								setBuilderValue("queries", updatedQueries);
							}}
							onEditQuery={(query: SavedQuery) => {
								setQueryToEdit(query);
							}}
							editingQueryId={editingQueryId}
							editingComponentId={editingComponentId}
							savedComponents={savedComponents}
							orphanedComponentIds={orphanedComponentIds}
							onAddComponent={() => {
								setShowComponentBuilder(true);
								setComponentToEdit(null);
							}}
							onEditComponent={(component: SavedComponent) => {
								setComponentToEdit(component);
								setShowComponentBuilder(true);
							}}
							onDeleteComponent={(id: string) => {
								setSavedComponents((prev) =>
									prev.filter((c) => c.id !== id),
								);
							}}
						/>
					</Card>
				</div>
				<div className="sm:col-span-9">
					<InsightBuilderStep
						builder={builder}
						currentBuilderStep={currentBuilderStep}
						setBuilderValue={setBuilderValue}
						onEditQuery={setQueryToEdit}
						queryToEdit={queryToEdit}
						onEditingQueryIdChange={setEditingQueryId}
						selectedLLM={selectedLLM}
						onLLMChange={setSelectedLLM}
						showComponentBuilder={showComponentBuilder}
						onShowComponentBuilderChange={setShowComponentBuilder}
						componentToEdit={componentToEdit}
						onComponentSave={(component: SavedComponent) => {
							const existingIndex = savedComponents.findIndex(
								(c) => c.id === component.id,
							);
							if (existingIndex >= 0) {
								const updated = [...savedComponents];
								updated[existingIndex] = component;
								setSavedComponents(updated);
							} else {
								setSavedComponents([
									...savedComponents,
									component,
								]);
							}
							setShowComponentBuilder(false);
							setComponentToEdit(null);
						}}
						savedComponents={savedComponents}
						savedParameters={savedParameters}
						parameterToEdit={parameterToEdit}
						onParameterSave={(param: FilterParameter) => {
							const existingIndex = savedParameters.findIndex(
								(p) => p.id === param.id,
							);
							if (existingIndex >= 0) {
								const updated = [...savedParameters];
								updated[existingIndex] = param;
								setSavedParameters(updated);
							} else {
								setSavedParameters([...savedParameters, param]);
							}
							setParameterToEdit(null);
						}}
						onEditParameter={setParameterToEdit}
						onDeleteParameter={(id: string) => {
							setSavedParameters((prev) =>
								prev.filter((p) => p.id !== id),
							);
						}}
						customLayout={customLayout}
						onLayoutChange={(layout, isValid) => {
							setCustomLayout(layout);
							setIsLayoutValid(isValid || false);
						}}
						editMode={editMode}
						appMetadata={appMetadata}
						onAppCreated={(createdAppId: string) => {
							toast.success(
								editMode
									? "App updated successfully! Redirecting..."
									: "App created successfully! Redirecting...",
							);
							// Navigate to the newly created/updated app
							navigate(`/app/${createdAppId}/view`);
						}}
					/>
				</div>
			</div>
			<div className="mt-4 mr-1 flex justify-end gap-1">
				{!editMode && (
					<Button
						variant="ghost"
						onClick={() => navigate(`/app/new`)}
					>
						Cancel
					</Button>
				)}
				{editMode && (
					<Button
						variant="ghost"
						onClick={() =>
							navigate(`/app/${appMetadata?.existingAppId}/view`)
						}
					>
						Cancel
					</Button>
				)}
				{currentBuilderStep !== INSIGHT_BUILDER_QUERY_STEP && (
					<Button variant="ghost" onClick={backButtonAction}>
						Back
					</Button>
				)}
				{((editMode &&
					currentBuilderStep !== INSIGHT_BUILDER_SETTINGS_STEP) ||
					(!editMode &&
						currentBuilderStep !== INSIGHT_BUILDER_APP_STEP)) && (
					<Button
						disabled={
							!isBuilderStepComplete(currentBuilderStep) ||
							(currentBuilderStep ===
								INSIGHT_BUILDER_COMPONENT_STEP &&
								hasOrphanedComponents)
						}
						onClick={nextButtonAction}
					>
						{nextButtonText}
					</Button>
				)}
			</div>
		</div>
	);
};
