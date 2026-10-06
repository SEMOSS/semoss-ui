import { useId } from "react";
import { Card, H2, H3, P } from "@semoss/ui/next";
import { ResetMyData } from "@/features/collaboration/components/reset-my-data";

/** Separates the existing confirmed data reset from routine preferences. */
export function DataSettings() {
	const titleId = useId();
	return (
		<section className="min-w-0" aria-labelledby={titleId}>
			<Card className="gap-5 p-5 shadow-none">
				<header className="space-y-2 border-b pb-4">
					<H2 id={titleId} className="font-medium text-xl">
						Data
					</H2>
					<P className="text-base text-muted-foreground">
						Manage your Collaboration data.
					</P>
				</header>
				<div className="space-y-4">
					<H3 className="font-medium text-base">
						Reset your workspace
					</H3>
					<P className="text-base text-muted-foreground">
						Delete your profile, people, topics, threads, rules, and
						work items, then start onboarding again. Your Microsoft
						sign-in stays. This cannot be undone.
					</P>
					<ResetMyData />
				</div>
			</Card>
		</section>
	);
}
