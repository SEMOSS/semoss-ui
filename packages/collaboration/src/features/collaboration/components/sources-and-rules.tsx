import { Link } from "react-router";
import { Button, H1, P, toast } from "@semoss/ui/next";
import { SourcesView } from "@/features/connectors/components/sources-view";
import { importSourceCommand } from "../import-source";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { CollaborationSurface } from "./collaboration-surface";
import { RulesEditor } from "./rules-editor";
import { Section } from "./section";

/** Source data enters the session only through an explicit provider selection. */
export function SourcesAndRules() {
	const { dispatch } = useCollaborationSession();
	return (
		<CollaborationSurface
			aside={
				<Section title="Connected context">
					<P className="text-muted-foreground">
						Only selected source items are added to Work. Reading
						and drafting are separate actions.
					</P>
					<P className="text-muted-foreground">
						Brain edits and loaded source content stay in this
						session. Assistant conversations and Outlook drafts have
						their own storage.
					</P>
					<Button asChild variant="outline">
						<Link to="/work">Go to Work</Link>
					</Button>
				</Section>
			}
			asideTitle="Source information"
		>
			<div className="space-y-6 p-4 md:p-6">
				<header className="space-y-2">
					<H1 className="font-semibold text-xl">Sources and rules</H1>
					<P className="text-muted-foreground">
						Load selected email, Teams conversations, and calendar
						events from your connected account.
					</P>
				</header>
				<SourcesView
					onImport={(source) => {
						dispatch(importSourceCommand(source));
						toast.success("Added to connected items in Work.");
					}}
				/>
				<RulesEditor />
			</div>
		</CollaborationSurface>
	);
}
