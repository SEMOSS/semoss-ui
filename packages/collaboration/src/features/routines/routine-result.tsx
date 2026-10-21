import DOMPurify from "dompurify";
import { Eye, FileText } from "lucide-react";
import { useId } from "react";
import { Link } from "react-router";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Badge,
	Button,
	cn,
	H3,
	Markdown,
	P,
	ScrollArea,
	Small,
	Spinner,
} from "@semoss/ui/next";
import { EmailBody } from "@/features/email/email-body";
import { MESSAGE_PROSE_CLASS_NAME } from "@/features/messages/components/message-prose.styles";
import { roomPath } from "@/lib/workspace-paths";
import { RoutineChatButton } from "./routine-chat-button";
import type { RoutineId, RoutineStatus } from "./routine-schema";

/** The words a routine's result view uses for its own output. */
export interface RoutineResultCopy {
	/** Section heading, such as "Latest brief". */
	title: string;
	/** Heading before the first run. */
	emptyTitle: string;
	/** Hint before the first run of an enabled routine. */
	scheduledHint: string;
	/** Hint before the first run of a routine that is off. */
	disabledHint: string;
	/** Status while a run is in progress. */
	running: string;
	/** Heading of a failed run. */
	failed: string;
}

interface RoutineResultProps {
	/** Saved state and the latest durable run. */
	routine: Pick<RoutineStatus, "enabled" | "timezone" | "lastRun"> & {
		id: RoutineId;
	};
	/** The routine's own wording. */
	copy: RoutineResultCopy;
	/** Link the run's room; only an owner's own routine runs in a Collaboration routine room. */
	canOpenRun?: boolean;
}

/** Opens the run's own room, where its steps show, live while it runs. */
function OpenRunButton({ roomId, live }: { roomId: string; live?: boolean }) {
	return (
		<Button type="button" asChild variant="outline" size="sm">
			<Link to={roomPath(roomId)}>
				<Eye aria-hidden="true" data-icon="inline-start" />
				{live ? "Watch it run" : "Open run"}
			</Link>
		</Button>
	);
}

/** Displays the saved result, distinguishing first run, progress, and failures. */
export function RoutineResult({
	routine,
	copy,
	canOpenRun = false,
}: RoutineResultProps) {
	const headingId = useId();
	const run = routine.lastRun;
	const html = run?.html?.trim();
	const runRoomId = canOpenRun ? run?.roomId : null;
	return (
		<section
			aria-labelledby={headingId}
			className="flex min-w-0 flex-col gap-3"
		>
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div className="flex min-w-0 flex-col gap-1">
					<div className="flex flex-wrap items-center gap-2">
						<H3 id={headingId} className="font-medium text-base">
							{copy.title}
						</H3>
						{run?.status === "completed" && (
							<Badge variant="secondary">Completed</Badge>
						)}
					</div>
					{run?.finishedAt && (
						<Small className="font-normal text-muted-foreground">
							{new Intl.DateTimeFormat(undefined, {
								dateStyle: "medium",
								timeStyle: "short",
								timeZone: routine.timezone,
							}).format(new Date(run.finishedAt))}{" "}
							· {routine.timezone.replaceAll("_", " ")}
						</Small>
					)}
				</div>
				<div className="flex flex-wrap gap-2">
					{runRoomId && run?.status !== "running" && (
						<OpenRunButton roomId={runRoomId} />
					)}
					{run?.status === "completed" && run.summary?.trim() && (
						<RoutineChatButton
							key={`${routine.id}:${run.startedAt}`}
							routineId={routine.id}
							startedAt={run.startedAt}
						/>
					)}
				</div>
			</div>
			<ScrollArea
				scrollOrientation="both"
				className="h-128 min-w-0 rounded-lg border focus-within:ring-2 focus-within:ring-ring"
			>
				<article
					// biome-ignore lint/a11y/noNoninteractiveTabindex: Focusing the content lets keyboard users scroll its containing viewport.
					tabIndex={0}
					aria-label={`${copy.title} content`}
					className="min-w-0 outline-none"
				>
					{!run ? (
						<div className="flex items-start gap-3 p-6">
							<FileText
								className="mt-0.5 size-5 shrink-0 text-muted-foreground"
								aria-hidden="true"
							/>
							<div className="flex flex-col gap-1">
								<P className="font-medium text-sm">
									{copy.emptyTitle}
								</P>
								<P className="text-muted-foreground text-sm">
									{routine.enabled
										? copy.scheduledHint
										: copy.disabledHint}
								</P>
							</div>
						</div>
					) : run.status === "failed" ? (
						<div className="p-4">
							<Alert variant="destructive">
								<AlertTitle>{copy.failed}</AlertTitle>
								<AlertDescription>
									{run.error ||
										"Check your inbox connection and assistant configuration before the next scheduled run."}
									<div className="flex flex-wrap gap-2">
										{/* the other causes open the run from the header */}
										{(run.errorCause === "connection" ||
											!run.errorCause) && (
											<Button
												type="button"
												asChild
												variant="outline"
												size="sm"
											>
												<Link to="/brain/sources">
													Manage inbox connection
												</Link>
											</Button>
										)}
									</div>
								</AlertDescription>
							</Alert>
						</div>
					) : run.status === "running" ? (
						<div className="flex flex-wrap items-center gap-3 p-6">
							<Spinner />
							<output className="text-sm">{copy.running}</output>
							{runRoomId && (
								<OpenRunButton roomId={runRoomId} live />
							)}
						</div>
					) : (
						<div className="flex min-w-0 flex-col">
							{run.error && (
								<div className="p-4">
									<Alert>
										<AlertDescription>
											{run.error}
										</AlertDescription>
									</Alert>
								</div>
							)}
							{html ? (
								<div
									className={cn(
										"min-w-0",
										routine.id ===
											"weekly-meeting-agendas" &&
											"min-w-lg",
									)}
								>
									<EmailBody
										key={`${routine.id}:${run.startedAt}`}
										html={html}
										title={`${copy.title} email`}
										presentation="reader"
									/>
								</div>
							) : run.summary?.trim() ? (
								<Markdown
									className={cn(
										"min-w-0 p-4",
										MESSAGE_PROSE_CLASS_NAME,
									)}
									components={{ img: () => null }}
								>
									{DOMPurify.sanitize(run.summary, {
										ALLOWED_TAGS: [],
										ALLOWED_ATTR: [],
									})}
								</Markdown>
							) : (
								<P className="p-4 text-muted-foreground text-sm">
									The run finished without a summary.
								</P>
							)}
						</div>
					)}
				</article>
			</ScrollArea>
		</section>
	);
}
