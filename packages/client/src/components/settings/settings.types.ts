export type SETTINGS_ROLE = "Author" | "Editor" | "Read-Only";

/**
 * A platform member as returned by getAllUsers / consumed by the member
 * management UI (members tab). Shared across the member list, access panel,
 * and add/edit overlay.
 */
export interface SETTINGS_MEMBER {
	id: string;
	type: string;
	name?: string;
	admin?: boolean;
	publisher?: boolean;
	exporter?: boolean;
	locked?: boolean;
	email?: string;
	username?: string;
	phone?: string;
	phoneextension?: string;
	countrycode?: string;
	model_usage_restriction?: string;
	model_usage_frequency?: string;
	model_max_tokens?: number;
	model_max_response_time?: number;
	unit?: string;
}

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
