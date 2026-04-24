import type { Control } from "react-hook-form";

export type AppFormStep = {
	name: string;
	icon: React.ReactElement;
	title: string;
	component: React.FunctionComponent<{
		// biome-ignore lint/suspicious/noExplicitAny: react-hook-form generic
		control: Control<any, any>;
		disabled: boolean;
	}>;
	requiredFields: string[];
};
