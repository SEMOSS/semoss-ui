import { BlockJSON } from '@/stores';

export interface DesignerMenuItem {
    /** Id of the item */
    ID: string;

    /** Name of the item to show in the tooltip */
    NAME: string;

    /** JSON of the block */
    BLOCK_JSON: BlockJSON;

    /** Image of the item */
    IMAGE?: string;

    /** Image to display when hovering */
    HOVER_IMAGE?: string;

    /** Text to display on hover */
    HOVER_TEXT?: string;

    /** Section that the item belongs to */
    SECTION?: string;
}
