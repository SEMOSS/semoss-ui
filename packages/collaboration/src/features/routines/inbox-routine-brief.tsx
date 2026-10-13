import DOMPurify from "dompurify";
import { FileText } from "lucide-react";
import { useId } from "react";
import { Link } from "react-router";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Badge,
	Button,
	H2,
	Markdown,
	P,
	Small,
	Spinner,
} from "@semoss/ui/next";
import { roomPath } from "@/lib/workspace-paths";
import type { InboxRoutine } from "./inbox-routine-schema";

/** Displays the saved result, distinguishing first run, progress, and failures. */
export function InboxRoutineBrief({ routine }: { routine: InboxRoutine }) {
	const headingId = useId();
	const run = routine.lastRun;
	return (
		<section
			aria-labelledby={headingId}
			className="flex min-w-0 flex-col gap-4 pb-4"
		>
			<div className="flex flex-wrap items-center justify-between gap-3">
				<H2 id={headingId} className="text-xl">
					Latest brief
				</H2>
				{run?.finishedAt && (
					<Small className="text-muted-foreground">
						{new Intl.DateTimeFormat(undefined, {
							dateStyle: "medium",
							timeStyle: "short",
							timeZone: routine.timezone,
						}).format(new Date(run.finishedAt))}{" "}
						· {routine.timezone.replaceAll("_", " ")}
					</Small>
				)}
			</div>
			{!run ? (
				<div className="flex items-start gap-3 rounded-xl border border-dashed p-6">
					<FileText
						className="mt-0.5 size-5 shrink-0 text-muted-foreground"
						aria-hidden="true"
					/>
					<div className="flex flex-col gap-1">
						<P className="font-medium text-sm">
							Your first brief will appear here
						</P>
						<P className="text-muted-foreground text-sm">
							{routine.enabled
								? "Your routine is scheduled. Come back after its first run to catch up on your inbox."
								: "Enable the routine and save a schedule. Each run will bring your latest inbox summary to this page."}
						</P>
					</div>
				</div>
			) : run.status === "failed" ? (
				<Alert variant="destructive">
					<AlertTitle>
						The last brief could not be completed
					</AlertTitle>
					<AlertDescription>
						{run.error ||
							"Check your inbox connection and assistant configuration before the next scheduled run."}
						<div className="flex flex-wrap gap-2">
							<Button asChild variant="outline" size="sm">
								<Link to="/brain/sources">
									Manage inbox connection
								</Link>
							</Button>
							{run.roomId && (
								<Button asChild variant="outline" size="sm">
									<Link to={roomPath(run.roomId)}>
										Open session
									</Link>
								</Button>
							)}
						</div>
					</AlertDescription>
				</Alert>
			) : run.status === "running" ? (
				<div className="flex items-center gap-3 rounded-xl border p-6">
					<Spinner />
					<output className="text-sm">
						Your inbox brief is being prepared. Reopen Routines in a
						moment to read it.
					</output>
				</div>
			) : (
				<article className="flex min-w-0 flex-col gap-4 rounded-xl border bg-card p-6">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<Badge variant="secondary">Completed</Badge>
						{run.roomId && (
							<Button asChild variant="ghost" size="sm">
								<Link to={roomPath(run.roomId)}>
									Open session
								</Link>
							</Button>
						)}
					</div>
					{run.summary ? (
						<Markdown
							className="min-w-0 break-words"
							components={{ img: () => null }}
						>
							{DOMPurify.sanitize(run.summary, {
								ALLOWED_TAGS: [],
								ALLOWED_ATTR: [],
							})}
						</Markdown>
					) : (
						<P className="text-muted-foreground text-sm">
							The run finished without a summary. Open its session
							for details.
						</P>
					)}
				</article>
			)}
		</section>
	);
}
