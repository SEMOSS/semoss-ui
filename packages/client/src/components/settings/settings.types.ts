import type { ModelUsageLimit } from "@semoss/sdk";

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
	/**
	 * The person's default for all models: their limit wherever nothing more
	 * specific applies, Unlimited to exempt them from the platform default, or
	 * null for no limit defined
	 */
	model_usage_limit?: ModelUsageLimit | null;
}

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
