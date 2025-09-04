import { Stack, styled } from "@semoss/ui";
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
							onAction={() => onUse(t)}
							isLoading={false}
							showSkeleton={false}
						/>
					);
				})}
			</StyledContainer>
		</Stack>
	);
};
