import { Progress } from "@semoss/ui/next";

export const PromptBuilderSummaryProgress = (props: { progress: number }) => {
	return (
		<div className="flex items-center gap-2">
			<Progress value={props.progress} className="flex-1" />
			<span className="whitespace-nowrap text-muted-foreground text-sm">
				{Math.round(props.progress)}%
			</span>
		</div>
	);
};
