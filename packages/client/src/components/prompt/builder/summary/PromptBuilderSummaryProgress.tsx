import { Progress } from "@semoss/ui/next";

export const PromptBuilderSummaryProgress = (props: { progress: number }) => {
	return (
		<div className="flex items-center">
			<div className="mr-2 w-full">
				<Progress value={props.progress} className="h-2" />
			</div>
			<span className="text-sm">{`${Math.round(props.progress)}%`}</span>
		</div>
	);
};
