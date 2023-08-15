export interface App {
    project_id: string;
    project_name: string;
    project_type: string;
    project_cost: string;
    project_global: string;
    project_catalog_name: string;
    project_created_by: string;
    project_created_by_type: string;
    project_date_created: string;
    project_has_portal?: boolean;
    project_portal_name?: string;
    project_portal_published_date?: string;
    project_published_user?: string;
    project_published_user_type?: string;
    project_reactors_compiled_date?: string;
    project_reactors_compiled_user?: string;
    project_reactors_compiled_user_type?: string;
    project_favorite?: string;
    user_permission?: string;
    group_permission?: string;
    tag?: string | string[];
    description?: string;
}

/**
 * All of the Iframe Messages
 */
export type IframeMessage = IframeStartMessage | IframeEndMessage;

/**
 * Start message sent from the child iframe to execute a pixel
 */
export interface IframeStartMessage {
    message: 'semoss-run-pixel--start';
    data: {
        key: string;
        insightId: string;
        pixel: string;
    };
}

/**
 * End message sent to the child iframe from executing a pixel
 */
export interface IframeEndMessage {
    message: 'semoss-run-pixel--end';
    data: {
        key: string;
        insightId: string;
        response: {
            insightID: string;
            errors: unknown;
            pixelReturn: {
                isMeta: boolean;
                operationType: string[];
                output: unknown;
                pixelExpression: string;
                pixelId: string;
            }[];
        };
    };
}
