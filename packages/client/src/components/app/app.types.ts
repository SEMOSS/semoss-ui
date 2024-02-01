/**
 * Metadata associated with the app
 */
export interface AppMetadata {
    project_id: string;
    project_name: string;
    project_type: 'BLOCKS' | 'CODE' | 'INSIGHT' | '';
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
    user_permission?: number;
    group_permission?: string;
    tag?: string | string[];
    description?: string;
}
