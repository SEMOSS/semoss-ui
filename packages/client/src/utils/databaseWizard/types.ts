export type DatabaseSummary = {
	database_id: string;
	database_name: string;
	database_type?: string;
	created_at?: string;
};

export type WizardStep = "select" | "actions" | "create-nl" | "csv" | "manage";

export type WizardStatus = {
	isOpen: boolean;
	isLoading: boolean;
	step: WizardStep;
	errors: string | null;
};
