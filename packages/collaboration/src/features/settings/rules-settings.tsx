import { useId } from "react";
import { Link } from "react-router";
import { Button, Card, H2, P } from "@semoss/ui/next";
import { RulesEditor } from "@/features/collaboration/components/rules-editor";

/** Keeps assistant context policy separate from source reading and importing. */
export function RulesSettings() {
	const titleId = useId();
	return (
		<section className="min-w-0" aria-labelledby={titleId}>
			<Card className="gap-5 p-5 shadow-none">
				<header className="space-y-2 border-b pb-4">
					<H2 id={titleId} className="font-medium text-xl">
						Rules
					</H2>
					<P className="text-base text-muted-foreground">
						Manage exclusions from future assistant context and your
						filing preferences.
					</P>
				</header>
				<RulesEditor />
				<Button asChild variant="outline" className="self-start">
					<Link to="/brain/sources">Open sources</Link>
				</Button>
			</Card>
		</section>
	);
}
