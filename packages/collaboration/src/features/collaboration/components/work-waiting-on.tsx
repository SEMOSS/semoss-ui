import { ArrowRight, Users } from "lucide-react";
import { Link } from "react-router";
import { P } from "@semoss/ui/next";
import { BriefPanel } from "@/features/dashboard/brief-panel";
import { PersonAvatar } from "./person-avatar";

/** How many handoffs the card lists; the Waiting view holds the rest. */
const SHOWN = 4;

/** One step somebody else owes on the owner's work. */
export interface WaitingEntry {
	id: string;
	/** Who owes it, given name first; blank when nobody was named. */
	who: string;
	/** The work item it holds up. */
	title: string;
	/** Where that item is worked. */
	to: string;
	/** What they were asked to do. */
	text: string;
}

interface WorkWaitingOnProps {
	/** Every open step someone else owes, in the order of the owner's list. */
	waits: WaitingEntry[];
	/** Shows the owner's items that wait on someone. */
	onViewAll: () => void;
}

/** Who the owner is waiting on: each handoff with the person, the work item and the ask. */
export function WorkWaitingOn({ waits, onViewAll }: WorkWaitingOnProps) {
	return (
		<BriefPanel title="Waiting on" count={waits.length}>
			<P className="text-muted-foreground text-sm">
				{waits.length
					? "The handoffs behind your work."
					: "Nobody owes you a step right now."}
			</P>
			{waits.length ? (
				<ul className="divide-y divide-border">
					{waits.slice(0, SHOWN).map((wait) => (
						<li
							key={wait.id}
							className="space-y-2 py-4 first:pt-0 last:pb-0"
						>
							<div className="flex items-center gap-3">
								{wait.who ? (
									<PersonAvatar
										name={wait.who}
										className="size-8"
									/>
								) : (
									<span
										aria-hidden="true"
										className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
									>
										<Users className="size-4" />
									</span>
								)}
								<span className="min-w-0 truncate font-medium">
									{wait.who || "Someone"}
								</span>
							</div>
							<Link
								to={wait.to}
								className="wrap-anywhere block rounded-sm py-0.5 text-sm hover:underline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
							>
								{wait.title}
							</Link>
							<P className="wrap-anywhere text-muted-foreground text-sm">
								{wait.text}
							</P>
						</li>
					))}
				</ul>
			) : null}
			{waits.length ? (
				<button
					type="button"
					onClick={onViewAll}
					className="group flex min-h-6 items-center gap-1 self-start rounded-sm font-medium text-primary text-sm hover:underline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 dark:text-foreground"
				>
					View waiting items
					<ArrowRight
						aria-hidden="true"
						className="size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
					/>
				</button>
			) : null}
		</BriefPanel>
	);
}
