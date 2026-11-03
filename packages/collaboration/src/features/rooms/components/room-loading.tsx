import { Bot, DoorOpen, FileText, MessagesSquare } from "lucide-react";
import { type CSSProperties, useEffect, useState } from "react";
import { ConnectorBrandIcon } from "@semoss/shared";
import { cn } from "@semoss/ui/next";
import type { Channel } from "@/features/collaboration/state/collaboration.types";
import { PhaseRow } from "@/features/onboarding/onboarding-ui";
import "./room-loading.css";

/** A thread's import into a room, in order; each step lands one orbiting mark in the room. */
const STEPS = [
	"Load the thread",
	"Open a room",
	"Save the thread to room files",
];

const RIPPLE_DELAYS = ["0s", "-1.2s", "-2.4s"];

// a loader that replaces one on screen (a thread handing over to its room renders before the old one unmounts) carries its scene on
const clock = { startedAt: 0, shown: 0 };

interface RoomLoadingProps {
	/** The import step underway, from 0; omitted while a saved room opens. */
	step?: number;
	/** What the room is for, such as the imported thread's subject. */
	subject?: string;
	/** Where the thread came from, which its orbiting mark shows. */
	channel?: Channel;
}

/**
 * The wait before a room appears: the room's tile with the thread, the agent,
 * and the room files orbiting it, each landing as its import step finishes.
 */
export function RoomLoading({ step, subject, channel }: RoomLoadingProps) {
	const [scene] = useState(() => {
		const now = performance.now();
		const startedAt = clock.shown > 0 ? clock.startedAt : now;
		return { startedAt, elapsed: now - startedAt };
	});
	useEffect(() => {
		clock.startedAt = scene.startedAt;
		clock.shown += 1;
		return () => {
			clock.shown -= 1;
		};
	}, [scene]);
	const brand =
		channel === "email" ? "outlook" : channel === "teams" ? "teams" : null;
	const marks = [
		{
			id: "thread",
			icon: brand ? (
				<ConnectorBrandIcon brand={brand} className="size-5" />
			) : (
				<MessagesSquare className="size-5 text-primary" />
			),
		},
		{ id: "agent", icon: <Bot className="size-5 text-primary" /> },
		{ id: "files", icon: <FileText className="size-5 text-primary" /> },
	];
	const landed = step ?? 0;
	return (
		<div
			className="room-loading relative flex min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6"
			style={
				{ "--room-loading-t": `${-scene.elapsed}ms` } as CSSProperties
			}
		>
			{/* m-auto centers it, yet scrolls from the top when zoomed text outgrows the pane */}
			<div className="m-auto flex flex-col items-center gap-6">
				<div
					aria-hidden="true"
					className="room-loading-stage relative h-56 w-72 shrink-0"
				>
					<div className="room-loading-aura absolute inset-0 m-auto size-48 rounded-full bg-conic from-primary via-chart-2 to-primary opacity-40 blur-2xl dark:opacity-50" />
					<div className="room-loading-plane absolute inset-0">
						{RIPPLE_DELAYS.map((delay) => (
							<span
								key={delay}
								className="room-loading-ripple absolute inset-0 m-auto size-56 rounded-full border-2 border-primary/40"
								style={
									{ "--ripple-delay": delay } as CSSProperties
								}
							/>
						))}
						<span className="absolute inset-0 m-auto size-56 rounded-full border border-primary/25" />
						<span className="room-loading-drift absolute inset-0 m-auto size-72 rounded-full border border-primary/20 border-dashed" />
						<div className="room-loading-tile absolute inset-0 m-auto size-24">
							<div
								key={landed}
								className={cn(
									"relative grid size-full place-items-center rounded-3xl bg-primary text-primary-foreground shadow-primary/30 shadow-xl ring-1 ring-primary-foreground/20 ring-inset",
									landed > 0 && "room-loading-absorb",
								)}
							>
								<span className="absolute inset-0 rounded-3xl bg-radial-[at_30%_20%] from-primary-foreground/45 to-65% to-transparent" />
								<DoorOpen
									className="relative size-10"
									strokeWidth={1.5}
								/>
							</div>
						</div>
						{marks.map((mark, index) => (
							<div
								key={mark.id}
								className="room-loading-arm absolute inset-0"
								style={
									{
										"--orbit-start": `${30 + index * 120}deg`,
										"--arrive-delay": `${250 + index * 150}ms`,
									} as CSSProperties
								}
							>
								<div
									className="room-loading-holder absolute inset-0 m-auto size-10"
									data-docked={
										step !== undefined && index < step
											? ""
											: undefined
									}
								>
									<div className="room-loading-chip size-10">
										<span className="room-loading-bubble grid size-10 place-items-center rounded-full bg-card shadow-md ring-1 ring-border">
											{mark.icon}
										</span>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
				{/* reserves the checklist's height, so the scene holds still when a thread hands over to its room */}
				<div className="flex min-h-40 max-w-md flex-col items-center gap-5 text-center">
					<output className="flex flex-col items-center gap-2">
						<span className="font-display font-medium text-3xl leading-tight">
							Opening room
						</span>
						{subject && (
							<span className="line-clamp-2 break-words text-muted-foreground text-sm">
								{subject}
								{brand &&
									` · from ${brand === "outlook" ? "Outlook" : "Teams"}`}
							</span>
						)}
						{step !== undefined && (
							<span className="sr-only">
								{`Step ${step + 1} of ${STEPS.length}: ${STEPS[step]}`}
							</span>
						)}
					</output>
					{step !== undefined && (
						<ol className="flex flex-col gap-2 text-start">
							{STEPS.map((label, index) => (
								<PhaseRow
									key={label}
									state={
										index < step
											? "done"
											: index === step
												? "active"
												: "todo"
									}
								>
									{label}
								</PhaseRow>
							))}
						</ol>
					)}
				</div>
			</div>
		</div>
	);
}
