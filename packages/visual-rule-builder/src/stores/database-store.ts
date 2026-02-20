import { makeAutoObservable } from "mobx";

export interface Database {
	app_name: string;
	database_id: string;
	database_name?: string;
	database_type?: string;
	database_subtype?: string;
	tag?: string | string[];
	domain?: string;
	description?: string;
	database_date_created?: string;
	database_created_by?: string;
	user_permission?: number;
}

export class DatabaseStore {
	databases: Database[] = [];
	selectedDatabaseId: string | null = null;
	isLoading = false;
	error: string | null = null;

	constructor() {
		makeAutoObservable(this);
	}

	setDatabases(databases: Database[]) {
		this.databases = databases;
	}

	setSelectedDatabaseId(databaseId: string | null) {
		this.selectedDatabaseId = databaseId;
	}

	setLoading(isLoading: boolean) {
		this.isLoading = isLoading;
	}

	setError(error: string | null) {
		this.error = error;
	}

	get selectedDatabase() {
		if (!this.selectedDatabaseId) return null;
		return (
			this.databases.find(
				(db) => db.database_id === this.selectedDatabaseId,
			) || null
		);
	}

	filterByTag(tag: string): Database[] {
		return this.databases.filter((db) => {
			if (Array.isArray(db.tag)) {
				return db.tag.includes(tag);
			}
			return db.tag === tag;
		});
	}

	reset() {
		this.databases = [];
		this.selectedDatabaseId = null;
		this.isLoading = false;
		this.error = null;
	}
}

export const databaseStore = new DatabaseStore();
