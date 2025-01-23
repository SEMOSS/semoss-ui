import { BlockJSON } from "../../store";

export interface DesignerMenuItem {
    /** Section that the item belongs to */
    section:
        | "Element"
        | "Query"
        | "Input"
        | "Layout"
        | "Progress"
        | "Text"
        | "Compare LLMs"
        | "Mermaid"
        | "Area Chart"
        | "Bar Chart"
        | "General"
        | "Line Chart"
        | "Pie Chart"
        | "Scatter Plot"
        | "Theme";

    /** Name of the item to show in the tooltip */
    name: string;

    /** JSON of the block */
    json: BlockJSON;

    /** Optional image that represents block */
    image?: string;
}
