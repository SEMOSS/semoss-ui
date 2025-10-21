import type { Variable } from "@semoss/renderer";
import { Stack, styled } from "@semoss/ui";
import type { AppMetadata } from "./app.types";
import { BrowseTemplateTileCard } from "./BrowseTempateTitleCard";
import {
	AskLLMTemplate,
	BlocksGuideTemplate,
	CreateDiabetesRecordTemplate,
	CustomFrameToVisualizationTemplate,
	DeleteDiabetesRecordTemplate,
	GmailTemplate,
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
	GmailTemplate,
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

	const includeMCPDriverToTemplateState = (template: Template): Template => {
		if (
			template.state.queries &&
			!template.state.queries?.["mcp_driver"] &&
			template.state.variables &&
			!template.state.variables?.["mcp_driver"] &&
			!template.state.variables?.["mcp_driver--1"]
		) {
			return {
				...template,
				state: {
					...template.state,
					queries: {
						...template.state.queries,
						mcp_driver: {
							id: "mcp_driver",
							cells: [
								{
									id: "1",
									widget: "code",
									parameters: {
										code: "",
										type: "py",
									},
								},
							],
						},
					},
					variables: {
						...template.state.variables,
						mcp_driver: {
							type: "query",
							to: "mcp_driver",
							cellId: "1",
						} as Variable,
						"mcp_driver--1": {
							type: "cell",
							to: "mcp_driver",
							cellId: "1",
						},
					},
				},
			};
		}
		return template;
	};

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
							key={`default-template-${app.project_name}`}
							app={getAppMetadataFromTemplate(t)}
							onAction={() =>
								onUse(includeMCPDriverToTemplateState(t))
							}
						/>
					);
				})}
			</StyledContainer>
		</Stack>
	);
};
