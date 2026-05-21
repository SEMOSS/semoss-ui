import type { Control } from "react-hook-form";
import { AppDetailsStep } from "./AppDetailsStep";
import { AppTagsStep } from "./AppTagsStep";

export const AppDetailsAndTagsStep = (props: {
	// biome-ignore lint/suspicious/noExplicitAny: react-hook-form generic
	control: Control<any, any>;
	disabled: boolean;
}) => {
	return (
		<div className="flex flex-col gap-3">
			<AppDetailsStep control={props.control} />
			<AppTagsStep control={props.control} />
		</div>
	);
};
