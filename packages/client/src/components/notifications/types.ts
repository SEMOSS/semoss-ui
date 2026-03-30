import type { Role } from "@/types";

export type NotificationType =
	| "USER_REQUEST"
	| "REQUEST_APPROVAL"
	| "USER_ADDITION"
	| "PERMISSION_CHANGE"
	| "REQUEST_DENIAL"
	| "SMSS_UPDATE";
export interface NotificationRecord {
	notification_id: string;
	recipient_id?: string;
	notification_title?: string;
	notification_actiontype?: string;
	notification_actiontarget?: string;
	notification_isread?: boolean;
	notification_priority?: "High" | "Medium" | "Low" | string;
	notification_type?: NotificationType | string;
	catalog_name?: string;
	notification_createdby?: string | null;
	notification_createddate?: string;
	notification_source?: string;
	recipient_user_id?: string;
	recipient_user_name?: string;
	user_existingrole?: Role | null;
	user_newrole?: Role;
	catalog_id?: string;
}
