import type { ReactNode } from "react";

interface DocPageProps {
	title: string;
	description: string;
	children: ReactNode;
}

/** Shared page shell every doc page (overview + per-component) opens with. */
export const DocPage = ({ title, description, children }: DocPageProps) => {
	return (
		<div className="flex flex-col gap-10 pb-24">
			<div className="flex flex-col gap-2 border-border border-b pb-6">
				<h1 className="font-bold text-3xl text-foreground">{title}</h1>
				<p className="max-w-2xl text-lg text-muted-foreground">
					{description}
				</p>
			</div>
			{children}
		</div>
	);
};
