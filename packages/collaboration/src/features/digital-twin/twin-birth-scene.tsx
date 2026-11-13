import { type CSSProperties, type ReactNode, useEffect, useRef } from "react";
import { cn, H1 } from "@semoss/ui/next";
import { AgentAvatar } from "@/components/common/agent-avatar";
import { PhaseRow } from "@/features/onboarding/onboarding-ui";
// the scene a room opens with (room-loading.tsx), drawn here with the same classes: the twin stands where the
// room's tile does and its parts circle it. That stylesheet's reduced-motion rule and its aura, a deliberate
// exception to DESIGN.md's no-gradients rule, come with it.
import "@/features/rooms/components/room-loading.css";

const RIPPLE_DELAYS = ["0s", "-1.2s", "-2.4s"];

interface TwinBirthSceneProps {
	/** The twin's name, as the headline says it. */
	name: string;
	/** The twin's image, if one was chosen. */
	image?: string;
	/** What the server is doing, in order; once every step is done the twin is ready. */
	steps: { id: string; label: string; state: "done" | "active" | "todo" }[];
	/** What circles the portrait: the things the twin is made of, each landing in it once it is in. */
	parts: { id: string; icon: ReactNode; isLanded: boolean }[];
	/** Where to go from here, shown in place of the steps once the twin is ready. */
	children: ReactNode;
}

/**
 * A Digital Twin being made: its portrait with the parts it is made of
 * circling it, each landing in it as the server finishes with it, and then the
 * twin itself with what to do next. Shown once per person, so it is the one
 * place this flow spends motion.
 */
export function TwinBirthScene({
	name,
	image,
	steps,
	parts,
	children,
}: TwinBirthSceneProps) {
	const heading = useRef<HTMLHeadingElement>(null);
	// the button that started this is gone by now, so focus goes to what replaced it
	useEffect(() => {
		heading.current?.focus();
	}, []);
	const isReady = steps.every((step) => step.state === "done");
	const activeIndex = steps.findIndex((step) => step.state === "active");
	const landed = parts.filter((part) => part.isLanded).length;
	return (
		<div
			// the parts fly in from well outside the orbit: clipped at the sides, so a narrow page does not scroll sideways
			className="room-loading flex min-w-0 flex-col items-center gap-6 overflow-x-clip py-6"
			// the scene's own clock: nothing hands over to it mid-flight, as one room loader does to the next
			style={{ "--room-loading-t": "0ms" } as CSSProperties}
		>
			<div
				aria-hidden="true"
				className="room-loading-stage relative h-56 w-72 max-w-full shrink-0"
			>
				<div
					className={cn(
						"absolute inset-0 m-auto size-48 rounded-full bg-conic from-primary via-chart-2 to-primary opacity-40 blur-2xl dark:opacity-50",
						// every loop ends with the work: a finished twin holds still
						!isReady && "room-loading-aura",
					)}
				/>
				<div className="room-loading-plane absolute inset-0">
					{!isReady &&
						RIPPLE_DELAYS.map((delay) => (
							<span
								key={delay}
								className="room-loading-ripple absolute inset-0 m-auto size-56 rounded-full border-2 border-primary/40"
								style={
									{ "--ripple-delay": delay } as CSSProperties
								}
							/>
						))}
					<span className="absolute inset-0 m-auto size-56 rounded-full border border-primary/25" />
					<span
						className={cn(
							"absolute inset-0 m-auto size-72 rounded-full border border-primary/20 border-dashed",
							!isReady && "room-loading-drift",
						)}
					/>
					<div className="room-loading-tile absolute inset-0 m-auto size-24">
						{/* keyed per landing, so the portrait swells again each time a part arrives */}
						<div
							key={landed}
							className={cn(
								"grid size-full place-items-center rounded-full shadow-primary/30 shadow-xl",
								landed > 0 && "room-loading-absorb",
							)}
						>
							<AgentAvatar
								agent={{ name, avatar: image }}
								size="xl"
							/>
						</div>
					</div>
					{parts.map((part, index) => (
						<div
							key={part.id}
							className="room-loading-arm absolute inset-0"
							style={
								{
									"--orbit-start": `${30 + (index * 360) / parts.length}deg`,
									// the last part is in place within a second and a half, however many there are
									"--arrive-delay": `${250 + (index * 1200) / parts.length}ms`,
								} as CSSProperties
							}
						>
							<div
								className="room-loading-holder absolute inset-0 m-auto size-10"
								data-docked={part.isLanded ? "" : undefined}
							>
								<div className="room-loading-chip size-10">
									<span className="room-loading-bubble grid size-10 place-items-center rounded-full bg-card text-primary shadow-md ring-1 ring-border">
										{part.icon}
									</span>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
			<div className="flex w-full max-w-md flex-col items-center gap-5 text-center">
				<div
					aria-live="polite"
					className="flex flex-col items-center gap-2"
				>
					<H1
						ref={heading}
						tabIndex={-1}
						className="wrap-anywhere rounded-sm font-display font-medium text-3xl leading-tight focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-4"
					>
						{isReady ? `Meet ${name}` : `Bringing ${name} to life`}
					</H1>
					{activeIndex >= 0 && (
						<span className="sr-only">
							{`Step ${activeIndex + 1} of ${steps.length}: ${steps[activeIndex]?.label}`}
						</span>
					)}
				</div>
				{isReady ? (
					children
				) : (
					<ol className="flex flex-col gap-2 text-start">
						{steps.map((step) => (
							<PhaseRow key={step.id} state={step.state}>
								{step.label}
							</PhaseRow>
						))}
					</ol>
				)}
			</div>
		</div>
	);
}
