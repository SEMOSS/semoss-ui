import { cn } from "@semoss/ui/next";

interface SectionHeadingProps {
	/** Mono eyebrow label rendered above the title */
	eyebrow?: string;

	/** Section title */
	title: React.ReactNode;

	/** Supporting copy rendered below the title */
	description: string;

	/**
	 * Heading level to render. The hero owns the page `h1`; every other
	 * section is an `h2` so the document outline stays in order.
	 */
	as?: "h1" | "h2";

	className?: string;
}

/**
 * Eyebrow + title + description block shared by every landing section.
 */
export const SectionHeading = ({
	eyebrow,
	title,
	description,
	as: Heading = "h2",
	className,
}: SectionHeadingProps) => (
	<div className={cn("flex flex-col gap-2", className)}>
		{eyebrow ? (
			<p className="font-mono text-muted-foreground text-xs uppercase tracking-widest">
				{eyebrow}
			</p>
		) : null}
		<Heading className="heading-lg text-foreground">{title}</Heading>
		<p className="max-w-prose text-base text-muted-foreground">
			{description}
		</p>
	</div>
);
