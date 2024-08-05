import { SerializedState } from '@/stores';

export type Template = {
    /** Name of the template */
    name: string;

    /** Description associated with the template */
    description: string;

    /** State associated with the template */
    state: SerializedState;

    /** Image for the template */
    image: string;

    /** Author for the template */
    author: string;

    /** Date updated template */
    lastUpdatedDate: string;

    /** Tags associated with the template */
    tags: string[];
};
