export type Prompt = {
	id: string;
	title: string;
	context?: string;
	intent?: string;
	version?: number;
	createdBy?: string;
	dateCreated?: string | Date | undefined;
	global?: boolean;
	tags?: string[];
	metaKeys?: Record<string, string[]>;
};
