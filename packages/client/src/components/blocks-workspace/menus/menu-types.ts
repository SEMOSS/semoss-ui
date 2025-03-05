import { BlockJSON } from '@semoss/renderer';

export interface DesignerMenuItem {
    /** Section that the item belongs to */
    section:
        | 'Element'
        | 'Query'
        | 'Input'
        | 'Layout'
        | 'Progress'
        | 'Text'
        | 'General'
        // | 'Line Chart'
        // | 'Pie Chart'
        // | 'Scatter Plot'
        // | 'Theme'
        | 'Bar E Chart'
        | 'Echart Pie Chart'
        | 'Scatter Plots E Charts'
        | 'Data Charts'
        | 'Mermaid Charts'
        | 'Miscellaneous';

    /** Name of the item to show in the tooltip */
    name: string;

    /** helper text to show for block */
    helperText: string;

    /** JSON of the block */
    json: BlockJSON;

    /**
     * Image of block
     */
    activeImage?: string;

    /**
     *  Hover Image of block
     */
    hoverImage?: string;
}
