import { cn } from "@semoss/ui/next";
import { formatMessageTime } from "../utils/message-metadata";

/** Metadata reserves its space and appears when the response is being explored. */
export function MessageTimestamp({
	createdAt,
	className,
}: {
	createdAt?: string;
	className?: string;
}) {
	const time = formatMessageTime(createdAt);
	if (!time) return null;
	return (
		<time
			dateTime={createdAt}
			title={formatMessageTime(createdAt, true)}
			className={cn(
				"shrink-0 text-muted-foreground text-xs opacity-0 transition-opacity duration-150 ease-out group-focus-within/message:opacity-100 group-focus-within/message:duration-0 group-hover/message:opacity-100 group-has-[[aria-haspopup=menu][data-state=open]]/message:opacity-100 motion-reduce:transition-none",
				className,
			)}
		>
			{time}
		</time>
	);
}
