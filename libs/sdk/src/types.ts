/**
 * Script object
 */
export type Script = {
	/** Content of the script */
	script: string;

	/** Alias to load the script as */
	alias: string;
};

export type Role =
	| "OWNER"
	| "EDIT"
	| "VIEWER"
	| "READ_ONLY"
	| "DISCOVERABLE"
	| "EDITOR";

export interface ColumnInterface {
	column: string;
	type: string;
}

export interface TableInterface {
	table: string;
	columns: ColumnInterface[];
}
