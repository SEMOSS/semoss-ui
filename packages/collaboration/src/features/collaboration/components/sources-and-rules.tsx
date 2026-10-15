import { Link } from "react-router";
import { Button, P, toast } from "@semoss/ui/next";
import { SourcesView } from "@/features/connectors/components/sources-view";
import { importSourceCommand } from "../import-source";
import { WorkRefreshStatus } from "../live/work-refresh-status";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { CollaborationPageHeader } from "./collaboration-page-header";
import { CollaborationSurface } from "./collaboration-surface";
import { Section } from "./section";

/** Source data enters the session only through an explicit provider selection. */
export function SourcesAndRules() {
	const { dispatch } = useCollaborationSession();
	return (
		<CollaborationSurface
			header={
				<CollaborationPageHeader
					title="Sources"
					description="Load selected email, Teams conversations, and calendar events from your connected account."
				/>
			}
			aside={
				<Section title="Connected context" variant="card">
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
					<Button asChild variant="outline">
						<Link to="/onboarding">Import mail again</Link>
					</Button>
					<Button asChild variant="outline">
						<Link to="/settings/rules">Manage rules</Link>
					</Button>
				</Section>
			}
			asideTitle="Source information"
		>
			<div className="space-y-6 p-4 md:p-6">
				<WorkRefreshStatus />
				<SourcesView
					onImport={(source) => {
						dispatch(importSourceCommand(source));
						toast.success("Added to connected items in Work.");
					}}
				/>
			</div>
		</CollaborationSurface>
	);
}
