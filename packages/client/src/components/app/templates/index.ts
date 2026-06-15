import { AskCSVTemplate } from "./ask-csv-template";
import { AskLLMTemplate } from "./ask-llm-template";
import { BlocksGuideTemplate } from "./blocks-guide-template";
import { CreateDiabetesRecordTemplate } from "./create-diabetes-record-template";
import { CustomFrameToVisualizationTemplate } from "./custom-frame-to-visualization-template";
import { DeleteDiabetesRecordTemplate } from "./delete-diabetes-record-template";
import { GmailTemplate } from "./GmailTemplate";
import { LandingPageTemplate } from "./LandingPageTemplate";
import { MultiPageTemplate } from "./MultiPageTemplate";
import { NLPToGridTemplate } from "./NLPToGridTemplate";
import { RowToNotebookTemplate } from "./RowToNotebookTemplate";
import { ReadDiabetesRecordTemplate } from "./read-diabetes-record-template";
import type { Template } from "./templates.types";
import { UpdateDiabetesRecordTemplate } from "./update-diabetes-record-template";
import { VisualizeCSVTemplate } from "./visualize-csv-template";

export const TEMPLATES: Template[] = [
	AskCSVTemplate,
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
	UpdateDiabetesRecordTemplate,
	VisualizeCSVTemplate,
];
export type { Template };
