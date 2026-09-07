import { cn, Spinner } from "@semoss/ui/next";

export interface WorkbenchAccessLoadingProps {
	className?: string;
	label?: string;
}

/** Blocking or overlaid spinner for a panel waiting on resource access. */
export const WorkbenchAccessLoading: React.FC<WorkbenchAccessLoadingProps> = ({
	className,
	label = "Loading resource access",
}) => (
	<output
		aria-label={label}
		className={cn(
			"flex items-center justify-center bg-background",
			className,
		)}
	>
		<Spinner />
	</output>
);
