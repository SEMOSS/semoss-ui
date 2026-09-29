import { cn, Small } from "@semoss/ui/next";

/** Props for {@link TeamworkTextBlock}. */
export interface TeamworkTextBlockProps {
	/** What the text is, such as "New contents". */
	label: string;
	/** The text, shown as is. */
	children: string;
	/** Let the block grow taller, for a sidebar tab with room to spare. */
	isTall?: boolean;
}

/**
 * A labelled block of preformatted text, such as a file's new contents or a
 * tool's result. Long text scrolls inside the block.
 */
export const TeamworkTextBlock = ({
	label,
	children,
	isTall = false,
}: TeamworkTextBlockProps) => (
	<div className="flex min-w-0 flex-col gap-1">
		<Small className="text-muted-foreground">{label}</Small>
		<pre
			className={cn(
				"overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-muted/50 p-2 font-mono text-xs",
				isTall ? "max-h-96" : "max-h-48",
			)}
		>
			{children}
		</pre>
	</div>
);
