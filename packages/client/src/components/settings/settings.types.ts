export type SETTINGS_ROLE = 'Author' | 'Editor' | 'Read-Only';

export type SETTINGS_PROVISIONED_USER = {
    id: string;
    name: string;
    type: string;
    email: string;
    permission: string;
    permission_granted_by: string;
    permission_granted_by_type: string;
    date_added: string;
};

export type SETTINGS_PENDING_USER = {
    ID: string;
    NAME: string;
    EMAIL: string;
    PERMISSION: string;
    // Requester Info
    REQUEST_TIMESTAMP: string;
    REQUEST_TYPE: string;
    REQUEST_USERID: string;
};
