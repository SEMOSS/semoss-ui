import type { ReactNode } from "react";
import { H3, P } from "@semoss/ui/next";

export function FormSection({
	title,
	description,
	children,
}: {
	title: string;
	description?: string;
	children: ReactNode;
}) {
	return (
		<section className="border-b pb-7 last:border-0">
			<H3 className="font-semibold text-base">{title}</H3>
			{description && (
				<P className="mt-1.5 text-muted-foreground text-sm">
					{description}
				</P>
			)}
			<div className="mt-6">{children}</div>
		</section>
	);
}
