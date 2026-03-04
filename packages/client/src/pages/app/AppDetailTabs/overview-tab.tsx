import type { HTMLAttributes } from "react";
import { H4, Markdown, P } from "@semoss/ui/next";

interface OverviewProps {
	appInfo: {
		markdown?: string;
	};
}

export const Overview = ({ appInfo }: OverviewProps) => {
	const markdownComponents = {
		p: ({ children, ...props }: HTMLAttributes<HTMLParagraphElement>) => (
			<P {...props}>{children}</P>
		),
	};

	return (
		<div className="relative z-0">
			<section className="mb-1 border-border border-b pb-2 last:mb-0 last:border-b-0">
				<H4 className="mb-2">Details</H4>
				{appInfo?.markdown ? (
					<div className="overflow-scroll">
						<Markdown components={markdownComponents}>
							{appInfo?.markdown}
						</Markdown>
					</div>
				) : (
					<div className="text-muted-foreground">
						No Markdown available
					</div>
				)}
			</section>
		</div>
	);
};