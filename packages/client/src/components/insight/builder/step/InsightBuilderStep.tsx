import type { FlexLayout } from "@semoss/shared";
import {
	INSIGHT_BUILDER_APP_STEP,
	INSIGHT_BUILDER_COMPONENT_STEP,
	INSIGHT_BUILDER_LAYOUT_STEP,
	INSIGHT_BUILDER_QUERY_STEP,
	INSIGHT_BUILDER_SETTINGS_STEP,
} from "../../insight.constants";
import type {
	BuilderValue,
	FilterParameter,
	InsightBuilder,
	SavedComponent,
	SavedQuery,
} from "../../insight.types";
import { AppSettingBuilderStep } from "./AppSettingBuilderStep";
import { ComponentBuilderStep } from "./ComponentBuilderStep";
import { CreateAppStep } from "./CreateAppStep";
import { LayoutBuilderStep } from "./LayoutBuilderStep";
import { QueryBuilderStep } from "./QueryBuilderStep";

interface InsightBuilderStepProps {
	currentBuilderStep: number;
	builder: InsightBuilder;
	setBuilderValue: (key: string, value: BuilderValue) => void;
	onEditQuery: (query: SavedQuery | null) => void;
	queryToEdit: SavedQuery | null;
	onEditingQueryIdChange: (id: string | null) => void;
	selectedLLM: string;
	onLLMChange: (llm: string) => void;
	showComponentBuilder: boolean;
	onShowComponentBuilderChange: (show: boolean) => void;
	componentToEdit: SavedComponent | null;
	onComponentSave: (component: SavedComponent) => void;
	savedComponents: SavedComponent[];
	savedParameters: FilterParameter[];
	parameterToEdit: FilterParameter | null;
	onParameterSave: (param: FilterParameter) => void;
	onEditParameter: (param: FilterParameter | null) => void;
	onDeleteParameter: (id: string) => void;
	customLayout: FlexLayout.IJsonModel | null;
	onLayoutChange: (layout: FlexLayout.IJsonModel, isValid: boolean) => void;
	onAppCreated?: (appId: string) => void;
	editMode?: boolean;
	appMetadata?: {
		existingAppId?: string;
		appName?: string;
		appDescription?: string;
		appTags?: string[];
	};
}

export const InsightBuilderStep = (props: InsightBuilderStepProps) => {
	const {
		currentBuilderStep,
		builder,
		setBuilderValue,
		onEditQuery,
		queryToEdit,
		onEditingQueryIdChange,
		selectedLLM,
		onLLMChange,
		showComponentBuilder,
		onShowComponentBuilderChange,
		componentToEdit,
		onComponentSave,
		savedComponents,
		savedParameters,
		parameterToEdit,
		onParameterSave,
		onEditParameter,
		onDeleteParameter,
		customLayout,
		onLayoutChange,
		onAppCreated,
		editMode = false,
		appMetadata = {},
	} = props;

	const handleSaveQuery = (query: SavedQuery) => {
		const currentQueries = (builder.queries.value as SavedQuery[]) || [];
		const existingIndex = currentQueries.findIndex(
			(q) => q.id === query.id,
		);

		let updatedQueries: SavedQuery[];
		if (existingIndex >= 0) {
			// Update existing query
			updatedQueries = [...currentQueries];
			updatedQueries[existingIndex] = query;
		} else {
			// Add new query
			updatedQueries = [...currentQueries, query];
		}

		setBuilderValue("queries", updatedQueries);
	};

	const handleDeleteQuery = (id: string) => {
		const currentQueries = (builder.queries.value as SavedQuery[]) || [];
		const updatedQueries = currentQueries.filter((q) => q.id !== id);
		setBuilderValue("queries", updatedQueries);
	};

	const renderStep = () => {
		switch (currentBuilderStep) {
			case INSIGHT_BUILDER_QUERY_STEP:
				return (
					<QueryBuilderStep
						savedQueries={
							(builder.queries.value as SavedQuery[]) || []
						}
						onSaveQuery={handleSaveQuery}
						onDeleteQuery={handleDeleteQuery}
						onEditQuery={onEditQuery}
						queryToEdit={queryToEdit}
						onEditingQueryIdChange={onEditingQueryIdChange}
						selectedLLM={selectedLLM}
						onLLMChange={onLLMChange}
						savedParameters={savedParameters}
						parameterToEdit={parameterToEdit}
						onParameterSave={onParameterSave}
						onEditParameter={onEditParameter}
						onDeleteParameter={onDeleteParameter}
					/>
				);
			case INSIGHT_BUILDER_COMPONENT_STEP:
				return (
					<ComponentBuilderStep
						savedQueries={
							(builder.queries.value as SavedQuery[]) || []
						}
						savedComponents={savedComponents}
						showBuilder={showComponentBuilder}
						onShowBuilderChange={onShowComponentBuilderChange}
						componentToEdit={componentToEdit}
						onComponentSave={onComponentSave}
						savedParameters={savedParameters}
					/>
				);
			case INSIGHT_BUILDER_LAYOUT_STEP:
				return (
					<LayoutBuilderStep
						savedComponents={savedComponents}
						savedQueries={
							(builder.queries.value as SavedQuery[]) || []
						}
						existingLayout={customLayout}
						onLayoutChange={onLayoutChange}
					/>
				);
			case INSIGHT_BUILDER_APP_STEP:
				return (
					<CreateAppStep
						savedQueries={
							(builder.queries.value as SavedQuery[]) || []
						}
						savedComponents={savedComponents}
						savedParameters={savedParameters}
						customLayout={customLayout}
						onAppCreated={onAppCreated}
						editMode={editMode}
						appMetadata={appMetadata}
					/>
				);
			case INSIGHT_BUILDER_SETTINGS_STEP:
				// Only available in edit mode
				if (!editMode) return null;

				return <AppSettingBuilderStep appMetadata={appMetadata} />;
			default:
				return null;
		}
	};

	return <div className="h-full">{renderStep()}</div>;
};
