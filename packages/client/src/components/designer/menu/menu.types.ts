import { BlockJSON } from '@/stores';

export interface DesignerMenuItem {
    /** Section that the item belongs to */
    section:
        | 'Element'
        | 'Query'
        | 'Input'
        | 'Layout'
        | 'Progress'
        | 'Text'
        | 'Compare LLMs'
        | 'Mermaid'
        | 'Area Chart'
        | 'Bar Chart'
        | 'General'
        | 'Line Chart'
        | 'Pie Chart'
        | 'Scatter Plot'
        | 'Theme';

    /** Name of the item to show in the tooltip */
    name: string;

    /** Image of the item */
    image: string;

    /** JSON of the block */
    json: BlockJSON;
}
