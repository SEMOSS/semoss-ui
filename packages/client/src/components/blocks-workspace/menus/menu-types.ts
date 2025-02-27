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
