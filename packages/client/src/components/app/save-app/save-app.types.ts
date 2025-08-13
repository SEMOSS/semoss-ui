import type { Control } from "react-hook-form";

export type AppFormStep = {
	name: string;
	icon: React.ReactElement;
	title: string;
	component: React.FunctionComponent<{
		control: Control<any, any>;
		disabled: boolean;
	}>;
	requiredFields: string[];
};

export interface EngineIdsModalProps {
	open: boolean;
	successIds: string[];
	failedIds: string[];
	onClose: () => void;
	onEngineReplacement?: (replacements: Record<string, string>) => void;
	appId: string;
	isUploadProjectApp: boolean;
	engineInfo: Record<
		string,
		{ name: string; files: string[]; instances: (string | number)[] }
	>;
}

export interface ReplaceEnginesOutput {
	success?: Record<string, { engineName: string; files: string[] }>;
	failed?: Record<string, { engineName: string; files: string[] }>;
	error?: string;
}
