import { useEffect, useState } from "react";
import { cn } from "@semoss/ui";

/**
 * Copied verbatim from playground's LOADING_MESSAGES
 * (packages/playground/src/constants.ts) so the default look/behavior
 * matches exactly — see docs/chat-components/PLAN.md's design-approach
 * decision. Short generic UI copy, not app logic, so duplicating it here
 * rather than depending on playground's own (unexported) constants file
 * is the right amount of coupling.
 */
const LOADING_MESSAGES = [
	"Thinking through it...",
	"Working on that...",
	"Processing your request...",
	"Checking the details...",
	"Gathering context...",
	"Making progress...",
	"Preparing the result...",
	"Finalizing...",
	"Almost done...",
	"One moment...",
	"Still working...",
];

const ROTATE_INTERVAL_MS = 2000;

export interface TypingIndicatorProps {
	className?: string;
}

/**
 * Matches response-message-thinking.tsx's loading treatment — rotating
 * status text with a pulse animation, not bouncing dots.
 */
export function TypingIndicator({ className }: TypingIndicatorProps) {
	const [index, setIndex] = useState(0);

	useEffect(() => {
		const interval = setInterval(() => {
			setIndex((current) => (current + 1) % LOADING_MESSAGES.length);
		}, ROTATE_INTERVAL_MS);
		return () => clearInterval(interval);
	}, []);

	const message = LOADING_MESSAGES[index];

	return (
		<output
			data-slot="typing-indicator"
			aria-label={message}
			className={cn(
				"mr-auto animate-pulse text-muted-foreground text-sm",
				className,
			)}
		>
			{message}
		</output>
	);
}
