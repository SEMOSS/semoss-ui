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

// Props for the EngineCard component (used in EngineIdsModal)

export type EngineCardProps = {
	name?: string;
	id: string;
	fileList?: string[];
	instanceList?: (number | string)[];
	showFiles?: boolean;
	openFilesId?: string | null;
	setOpenFilesId?: (id: string | null) => void;
	fileListRef?: React.RefObject<HTMLDivElement>;
	showReplacement?: boolean;
	replacementValue?: string;
	onReplacementChange?: (id: string, value: string) => void;
	availableEngines?: {
		data?: Array<{
			database_id?: string;
			app_id?: string;
			database_name?: string;
			app_name?: string;
			database_type?: string;
			app_type?: string;
		}>;
		status?: string;
	};
	showReplacementPlaceholder?: boolean;
	confirmationReplacement?: string;
	confirmation?: boolean;
};
