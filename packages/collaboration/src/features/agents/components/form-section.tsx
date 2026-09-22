import type { ReactNode } from "react";

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
			<h2 className="font-semibold text-base">{title}</h2>
			{description && (
				<p className="mt-1.5 text-muted-foreground text-sm">
					{description}
				</p>
			)}
			<div className="mt-6">{children}</div>
		</section>
	);
}
