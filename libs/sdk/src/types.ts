/**
 * Script object
 */
export type Script = {
	/** Content of the script */
	script: string;

	/** Alias to load the script as */
	alias: string;
};

export type Role = "OWNER" | "EDIT" | "READ_ONLY" | "DISCOVERABLE";

/**
 * User details with permission information
 */
export interface User {
	date_added?: string;
	name: string;
	permission: Role;
	id: string;
	type?: string;
	email?: string;
}

export interface PostUser {
	userid: string;
	permission: Role;
}

export interface UserAccessRequest {
	requestid: string;
	userid: string;
	permission: Role;
	/** Resource type — only read by the backend when access-request notifications are enabled. */
	type?: string;
}

export interface ColumnInterface {
	column: string;
	type: string;
}

export interface TableInterface {
	table: string;
	columns: ColumnInterface[];
}

export interface MCPToolRequest {
	type: "MCP";
	message: string;
	id: string;
	name: string;
	parameters: Record<string, unknown>;
	roomId: string;
	original_name: string;
	tool_response?: string;
	executedParameters?: Record<string, unknown>;
	_meta?: Record<string, unknown>;
}

export interface MCPToolResponse {
	type: "MCP";
	message: string;
	id: string;
	name: string;
	response: string;
	roomId: string;
	tool_status?: "success" | "error" | "cancelled" | "paused";
	executedParameters?: Record<string, unknown>;
}
