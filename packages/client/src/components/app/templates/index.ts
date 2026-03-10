import { AskCSVTemplate } from "./AskCSVTemplate";
import { AskLLMTemplate } from "./AskLLMTemplate";
import { BlocksGuideTemplate } from "./BlocksGuideTemplate";
import { CreateDiabetesRecordTemplate } from "./CreateDiabetesRecordTemplate";
import { CustomFrameToVisualizationTemplate } from "./CustomFrameToVisualizationTemplate";
import { DeleteDiabetesRecordTemplate } from "./DeleteDiabetesRecordTemplate";
import { GmailTemplate } from "./GmailTemplate";
import { LandingPageTemplate } from "./LandingPageTemplate";
import { MultiPageTemplate } from "./MultiPageTemplate";
import { NLPToGridTemplate } from "./NLPToGridTemplate";
import { ReadDiabetesRecordTemplate } from "./ReadDiabetesRecordTemplate";
import { RowToNotebookTemplate } from "./RowToNotebookTemplate";
import type { Template } from "./templates.types";
import { UpdateDiabetesRecordTemplate } from "./UpdateDiabetesRecordTemplate";
import { VisualizeCSVTemplate } from "./VisualizeCSVTemplate";

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
