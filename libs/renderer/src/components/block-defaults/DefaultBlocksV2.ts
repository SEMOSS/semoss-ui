import { Registry } from "../../../store";
import { ButtonBlockV2, ButtonBlockDefV2 } from "./button-block/ButtonBlockV2";
import { TextBlockV2, TextBlockDefV2 } from "./text-block/TextBlockV2";
import { InputBlockV2, InputBlockDefV2 } from "./input-block/InputBlockV2";
import { CardBlockV2, CardBlockDefV2 } from "./card-block/CardBlockV2";

// Import existing components that don't need Material UI
import { GridBlock, GridBlockDef } from "./grid-block";
import { PageBlock, PageBlockDef } from "./page-block";
import { ContainerBlock, ContainerBlockDef } from "./container-block";
import { DividerBlock, DividerBlockDef } from "./divider-block";
import { ImageBlock, ImageBlockDef } from "./image-block";
import { IframeBlock, IframeBlockDef } from "./iframe-block";
import { HTMLBlock, HTMLBlockDef } from "./html-block";
import { MarkdownBlock, MarkdownBlockDef } from "./markdown-block";
import { MermaidBlock, MermaidBlockDef } from "./mermaid-block";
import { AudioBlock, AudioBlockDef } from "./audio-block";
import { AudioInputBlock, AudioInputBlockDef } from "./audio-input-block";
import { PDFViewerBlock, PDFViewerBlockDef } from "./pdfViewer-block";
import { LogsBlock, LogsBlockDef } from "./logs-block";
import { LLMComparisonBlock, LLMComparisonBlockDef } from "./llm-comparison-block";

// Define the block definitions type for v2
export type DefaultBlockDefinitionsV2 = {
    button: ButtonBlockDefV2;
    text: TextBlockDefV2;
    input: InputBlockDefV2;
    card: CardBlockDefV2;
    grid: GridBlockDef;
    page: PageBlockDef;
    container: ContainerBlockDef;
    divider: DividerBlockDef;
    image: ImageBlockDef;
    iframe: IframeBlockDef;
    html: HTMLBlockDef;
    markdown: MarkdownBlockDef;
    mermaid: MermaidBlockDef;
    audio: AudioBlockDef;
    audioInput: AudioInputBlockDef;
    pdfViewer: PDFViewerBlockDef;
    logs: LogsBlockDef;
    llmComparison: LLMComparisonBlockDef;
};

// Create the v2 registry
export const DefaultBlocksV2: Registry<DefaultBlockDefinitionsV2> = {
    button: ButtonBlockV2,
    text: TextBlockV2,
    input: InputBlockV2,
    card: CardBlockV2,
    grid: GridBlock,
    page: PageBlock,
    container: ContainerBlock,
    divider: DividerBlock,
    image: ImageBlock,
    iframe: IframeBlock,
    html: HTMLBlock,
    markdown: MarkdownBlock,
    mermaid: MermaidBlock,
    audio: AudioBlock,
    audioInput: AudioInputBlock,
    pdfViewer: PDFViewerBlock,
    logs: LogsBlock,
    llmComparison: LLMComparisonBlock,
}; 