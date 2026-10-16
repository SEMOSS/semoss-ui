import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import {
	Button,
	Card,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	cn,
	H2,
	P,
	toast,
} from "@semoss/ui/next";
import { ConnectionsView } from "@/features/connectors/components/connections-view";
import { SourcesView } from "@/features/connectors/components/sources-view";
import { importSourceCommand } from "../import-source";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { CollaborationPageHeader } from "./collaboration-page-header";
import { CollaborationSurface } from "./collaboration-surface";

/** Connect once and keep updates flowing; picking items by hand is the exception, so it is folded away. */
export function SourcesAndRules() {
	const { dispatch } = useCollaborationSession();
	const [isPickerOpen, setIsPickerOpen] = useState(false);
	return (
		<CollaborationSurface
			header={
				<CollaborationPageHeader
					title="Connections"
					description="Connect Microsoft 365 once. The assistant then reads new mail, Teams chats and calendar on its own."
				/>
			}
		>
			<div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 md:p-6">
				<ConnectionsView />
				<Collapsible open={isPickerOpen} onOpenChange={setIsPickerOpen}>
					<Card className="gap-0 p-5 shadow-none">
						<CollapsibleTrigger asChild>
							<button
								type="button"
								className="flex w-full items-start gap-3 text-left focus-visible:outline-2 focus-visible:outline-ring"
							>
								<ChevronRight
									aria-hidden="true"
									className={cn(
										"mt-1.5 size-4 shrink-0 text-muted-foreground",
										isPickerOpen && "rotate-90",
									)}
								/>
								<span className="min-w-0">
									<H2 className="font-medium text-xl">
										Add items by hand
									</H2>
									<P className="text-muted-foreground">
										Pick a specific email, Teams chat or
										event to add to Work, or start a new
										draft.
									</P>
								</span>
							</button>
						</CollapsibleTrigger>
						<CollapsibleContent className="pt-5">
							<SourcesView
								showConnect={false}
								onImport={(source) => {
									dispatch(importSourceCommand(source));
									toast.success(
										"Added to connected items in Work.",
									);
								}}
							/>
							<div className="mt-6 flex flex-wrap gap-2 border-t pt-4">
								<Button asChild variant="outline" size="sm">
									<Link to="/onboarding">
										Import mail again
									</Link>
								</Button>
								<Button asChild variant="ghost" size="sm">
									<Link to="/settings/rules">
										Manage rules
									</Link>
								</Button>
							</div>
						</CollapsibleContent>
					</Card>
				</Collapsible>
			</div>
		</CollaborationSurface>
	);
}
