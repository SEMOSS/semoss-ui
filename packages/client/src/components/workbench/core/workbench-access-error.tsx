import { Button, cn, Muted } from "@semoss/ui/next";

export interface WorkbenchAccessErrorProps {
	message: string;
	/** Omit to show the message with no retry action. */
	onRetry?: () => void;
	className?: string;
	testId?: string;
}

/** Blocking or overlaid failure state for a panel that could not resolve resource access. */
export const WorkbenchAccessError: React.FC<WorkbenchAccessErrorProps> = ({
	message,
	onRetry,
	className,
	testId,
}) => (
	<div
		role="alert"
		className={cn(
			"flex flex-col items-center justify-center gap-4 bg-background p-4",
			className,
		)}
	>
		<Muted className="text-destructive" data-testid={testId}>
			{message}
		</Muted>
		{onRetry ? (
			<Button type="button" onClick={onRetry}>
				Retry
			</Button>
		) : null}
	</div>
);
