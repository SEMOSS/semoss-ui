import { Stack, styled } from "@semoss/ui";
import { Variable } from "@semoss/renderer";
import type { AppMetadata } from "./app.types";
import { BrowseTemplateTileCard } from "./BrowseTempateTitleCard";
import {
	AskLLMTemplate,
	BlocksGuideTemplate,
	CreateDiabetesRecordTemplate,
	CustomFrameToVisualizationTemplate,
	DeleteDiabetesRecordTemplate,
	LandingPageTemplate,
	MultiPageTemplate,
	NLPToGridTemplate,
	ReadDiabetesRecordTemplate,
	RowToNotebookTemplate,
	type Template,
	UpdateDiabetesRecordTemplate,
	VisualizeCSVTemplate,
} from "./templates";

const DEFAULT_TEMPLATE = [
	LandingPageTemplate,
	RowToNotebookTemplate,
	AskLLMTemplate,
	CustomFrameToVisualizationTemplate,
	VisualizeCSVTemplate,
	NLPToGridTemplate,
	BlocksGuideTemplate,
	MultiPageTemplate,
	CreateDiabetesRecordTemplate,
	ReadDiabetesRecordTemplate,
	UpdateDiabetesRecordTemplate,
	DeleteDiabetesRecordTemplate,
	// AskCSVTemplate,
];

const StyledContainer = styled("div")(({ theme }) => ({
	display: "flex",
	flexDirection: "row",
	flexWrap: "wrap",
	gap: "24px",
}));

interface AppTemplatesProps {
	/** Use a template */
	onUse: (template: Template) => void;

	/**
	 * Pass this if you only want a certain amount,
	 * could be useful for random suggestions
	 */
	randomCount?: number;
}

export const AppTemplates = (props: AppTemplatesProps) => {
	const { randomCount, onUse = () => null } = props;

	const getAppMetadataFromTemplate = (template: Template): AppMetadata => {
		return {
			project_id: template.name,
			project_name: template.name,
			project_type: "BLOCKS",
			project_cost: "",
			project_global: "",
			project_catalog_name: "",
			project_created_by: "SYSTEM",
			project_date_last_edited: "",
			project_created_by_type: "",
			project_date_created: "",
			project_has_portal: false,
			tag: template.tags,
			description: template.description,
		};
	};

	const includeSMSSDriverToTemplateState = (template: Template): Template => {
		if( template.state.queries && !template.state.queries?.["smss_driver"] &&
			template.state.variables && !template.state.variables?.["smss_driver"] &&
			!template.state.variables?.["smss_driver--1"]
		) {
			return {
				...template,
				state: {
					...template.state,
					queries: {
						...template.state.queries,
						"smss_driver": {
							id: "smss_driver",
							cells: [
								{
									id: "1",
									widget: "code",
									parameters: {
										code: "",
										type: "py"
									}
								}
							]
						}
					},
					variables: {
						...template.state.variables,
						"smss_driver": {
							type: "query",
							to: "smss_driver",
							cellId: "1"
						} as Variable,
						"smss_driver--1": {
							type: "cell",
							to: "smss_driver",
							cellId: "1"
						}
					},
				}
			};
		}
		return template;
	}

	return (
		<Stack
			direction={"row"}
			alignItems={"flex-start"}
			alignSelf={"stretch"}
			spacing={3}
		>
			<StyledContainer>
				{DEFAULT_TEMPLATE.map((t, idx) => {
					if (randomCount) {
						if (idx > randomCount) {
							return;
						}
					}
					const app = getAppMetadataFromTemplate(t);
					return (
						<BrowseTemplateTileCard
							key={`default-template-${idx}`}
							app={getAppMetadataFromTemplate(t)}
							systemApp={true}
							appType={app.project_type}
							onAction={() => onUse(includeSMSSDriverToTemplateState(t))}
							isLoading={false}
							showSkeleton={false}
						/>
					);
				})}
			</StyledContainer>
		</Stack>
	);
};
