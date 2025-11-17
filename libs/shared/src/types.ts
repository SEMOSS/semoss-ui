export interface Engine {
	app_id: string;
	app_name: string;
	app_type: "MODEL" | "STORAGE" | "DATABASE" | "FUNCTION" | "VECTOR";
	description?: string;
}
