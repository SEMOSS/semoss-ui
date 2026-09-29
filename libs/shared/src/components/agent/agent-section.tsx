import type { ReactNode } from "react";
import { H4, Muted } from "@semoss/ui/next";

export interface AgentSectionProps {
	/** Section heading. */
	title: string;
	/** One-line summary under the heading. */
	description: string;
	/** Section content. */
	children: ReactNode;
}

/** Heading, summary and content for one section of an agent's definition. */
export const AgentSection = ({
	title,
	description,
	children,
}: AgentSectionProps) => (
	<div className="flex flex-col gap-3">
		<div className="flex flex-col gap-1">
			<H4 className="font-semibold text-lg tracking-tight">{title}</H4>
			<Muted className="text-muted-foreground text-sm leading-6">
				{description}
			</Muted>
		</div>
		{children}
	</div>
);
