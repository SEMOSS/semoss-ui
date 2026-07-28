import type { ReactNode } from "react";
import { H4, Muted, Separator } from "@semoss/ui/next";

export interface AgentFormSectionProps {
	title: string;
	description: string;
	children: ReactNode;
	/**
	 * "stacked" (default): header above the field(s), full width - matches the
	 * agent edit tab's single-column form.
	 * "columns": header in a left column, field(s) in a right column, with a
	 * trailing separator baked in - matches the create-agent page's layout.
	 */
	layout?: "stacked" | "columns";
}

export const AgentFormSection = ({
	title,
	description,
	children,
	layout = "stacked",
}: AgentFormSectionProps) => {
	if (layout === "columns") {
		return (
			<div className="mb-4 flex flex-col gap-4">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
					<div className="flex flex-1 flex-col gap-1">
						<H4 className="font-semibold text-base tracking-tight">
							{title}
						</H4>
						<Muted className="text-muted-foreground text-sm leading-6">
							{description}
						</Muted>
					</div>
					<div className="flex flex-2 flex-col gap-3">{children}</div>
				</div>
				<Separator />
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-3">
			<div>
				<H4 className="font-semibold text-base tracking-tight">
					{title}
				</H4>
				<Muted className="text-muted-foreground text-sm leading-6">
					{description}
				</Muted>
			</div>
			{children}
		</div>
	);
};
