export type SETTINGS_ROLE = 'Author' | 'Editor' | 'Read-Only';

export type SETTINGS_MEMBER = {
    id: string;
    name: string;
    type: string;
    email: string;
    permission: string;
    permission_granted_by: string;
    permission_granted_by_type: string;
    date_added: string;
};
