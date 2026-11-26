import { Sparkles } from "lucide-react";
import { type CSSProperties, useEffect, useState } from "react";
import { cn, P } from "@semoss/ui/next";
import {
	OneDriveIcon,
	OutlookIcon,
	TeamsChatsIcon,
} from "@/components/common/app-icons";
import type { TwinSuggestion } from "./api/twin-suggestions";
// the scene a room opens with (room-loading.tsx), drawn here smaller with the same classes: the search's lens
// stands where the room's tile does, and the places it searches circle it. That stylesheet's reduced-motion rule
// and its aura, a deliberate exception to DESIGN.md's no-gradients rule, come with it.
import "@/features/rooms/components/room-loading.css";

// the places the server searches, each as its own mark, with the kind of item it holds
const PLACES = [
	{ id: "outlook", kind: "email", icon: OutlookIcon },
	{ id: "teams", kind: "chat", icon: TeamsChatsIcon },
	{ id: "onedrive", kind: "file", icon: OneDriveIcon },
] as const;

// What the search does, in the order the server does it, and how long each line shows; the last one holds. The
// server sends no progress, so these keep time by the clock: the three places are searched at once, which makes
// each of their lines true while any of them shows. A place the search leaves out loses its line.
const STEPS: readonly {
	text: string;
	ms?: number;
	place?: (typeof PLACES)[number]["id"];
}[] = [
	{ text: "Working out what to look for", ms: 2500 },
	{ text: "Searching your Outlook", ms: 2500, place: "outlook" },
	{ text: "Searching your Teams chats", ms: 2500, place: "teams" },
	{ text: "Searching your OneDrive", ms: 2500, place: "onedrive" },
	{ text: "Reading what turned up", ms: 4000 },
	{ text: "Picking what fits this twin" },
];

const RIPPLE_DELAYS = ["0s", "-1.2s", "-2.4s"];

interface TwinKnowledgeSearchSceneProps {
	/** Whether a search is under way. At rest the lens waits on its own. */
	isSearching: boolean;
	/**
	 * The kinds the search looks for: only their places circle the lens and
	 * are named. All of them when left out.
	 */
	kinds?: readonly TwinSuggestion["kind"][];
}

/**
 * The wait for a twin's suggestions, and the place they will be listed
 * before the first search: a lens, and once a search starts the owner's
 * Outlook, Teams chats and OneDrive flying in to circle it, each lit as the
 * line beside the scene names it. The one place the finder spends motion.
 */
export function TwinKnowledgeSearchScene({
	isSearching,
	kinds,
}: TwinKnowledgeSearchSceneProps) {
	const [step, setStep] = useState(0);
	// every search starts from its first line, with no effect to wait for
	const [wasSearching, setWasSearching] = useState(isSearching);
	if (wasSearching !== isSearching) {
		setWasSearching(isSearching);
		setStep(0);
	}
	const places = PLACES.filter(
		(place) => !kinds || kinds.includes(place.kind),
	);
	const current = STEPS.filter(
		(line) =>
			!line.place || places.some((place) => place.id === line.place),
	)[step];
	const wait = isSearching ? current?.ms : undefined;
	useEffect(() => {
		if (wait === undefined) return;
		// every line gets its own wait, also when it is as long as the one before
		const timer = setTimeout(() => setStep(step + 1), wait);
		return () => clearTimeout(timer);
	}, [wait, step]);

	return (
		<div
			className="room-loading flex min-w-0 flex-col items-center gap-2 overflow-x-clip px-4 py-4 sm:flex-row sm:gap-5"
			style={
				{
					// its own clock, and an orbit that fits a panel
					"--room-loading-t": "0ms",
					"--orbit-radius": "4.25rem",
				} as CSSProperties
			}
		>
			<div
				aria-hidden="true"
				className="room-loading-stage relative h-32 w-48 max-w-full shrink-0"
			>
				<div
					className={cn(
						"absolute inset-0 m-auto size-28 rounded-full bg-conic from-primary via-chart-2 to-primary blur-xl transition-opacity duration-700",
						// the light turns only while there is something to wait for
						isSearching
							? "room-loading-aura opacity-40 dark:opacity-50"
							: "opacity-15 dark:opacity-25",
					)}
				/>
				<div className="room-loading-plane absolute inset-0">
					{isSearching &&
						RIPPLE_DELAYS.map((delay) => (
							<span
								key={delay}
								className="room-loading-ripple absolute inset-0 m-auto size-34 rounded-full border-2 border-primary/40"
								style={
									{ "--ripple-delay": delay } as CSSProperties
								}
							/>
						))}
					<span className="absolute inset-0 m-auto size-34 rounded-full border border-primary/25" />
					<span
						className={cn(
							"absolute inset-0 m-auto size-44 rounded-full border border-primary/20 border-dashed",
							isSearching && "room-loading-drift",
						)}
					/>
					<div className="room-loading-tile absolute inset-0 m-auto size-14">
						{/* keyed per line, so the lens swells as the search moves on */}
						<div
							key={step}
							className={cn(
								"relative grid size-full place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-1 ring-primary-foreground/20 ring-inset",
								isSearching &&
									step > 0 &&
									"room-loading-absorb",
							)}
						>
							<span className="absolute inset-0 rounded-full bg-radial-[at_30%_20%] from-primary-foreground/45 to-65% to-transparent" />
							<Sparkles
								className="relative size-6"
								strokeWidth={1.75}
							/>
						</div>
					</div>
					{isSearching &&
						places.map(({ id, icon: Icon }, index) => (
							<div
								key={id}
								className="room-loading-arm absolute inset-0"
								style={
									{
										// spread evenly, however many are searched
										"--orbit-start": `${30 + (index * 360) / places.length}deg`,
										"--arrive-delay": `${100 + index * 150}ms`,
									} as CSSProperties
								}
							>
								<div className="room-loading-holder absolute inset-0 m-auto size-9">
									<div className="room-loading-chip size-9">
										<span className="room-loading-bubble block size-9">
											{/* the place the line names is the one lit */}
											<span
												data-active={
													current?.place === id ||
													undefined
												}
												className="grid size-9 place-items-center rounded-full bg-card shadow-md ring-1 ring-border transition-[scale,box-shadow] duration-500 ease-out data-active:scale-125 data-active:shadow-lg data-active:ring-2 data-active:ring-primary"
											>
												<Icon className="size-4.5" />
											</span>
										</span>
									</div>
								</div>
							</div>
						))}
				</div>
			</div>
			{isSearching ? (
				<div className="min-w-0 text-center sm:text-start">
					{/* keyed per line, so each one arrives rather than swaps */}
					<P
						key={step}
						className="fade-in-0 wrap-anywhere animate-in font-medium text-base duration-500 motion-reduce:animate-none"
					>
						{current?.text}…
					</P>
					<P className="text-muted-foreground text-sm">
						This can take up to a minute.
					</P>
				</div>
			) : (
				<P className="max-w-prose text-center text-muted-foreground text-sm sm:text-start">
					The emails, Teams chats and files that fit are listed here,
					each with the reason it was picked.
				</P>
			)}
		</div>
	);
}
