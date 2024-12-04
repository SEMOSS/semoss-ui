import { IJsonModel } from 'flexlayout-react';

export interface WorkspaceOptions {
    version: string;
    drawer: {
        isOpen: boolean;
    };
    layout: {
        selected: string;
        available: Record<
            string,
            {
                /** id of the layout */
                id: string;

                /** name of the layout */
                name: string;

                /** Data associated with the layout */
                data: IJsonModel;
            }
        >;
    };
}
