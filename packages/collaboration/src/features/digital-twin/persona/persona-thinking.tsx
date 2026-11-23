import { Sparkles } from "lucide-react";
import type { CSSProperties } from "react";
// the scene a room opens with (room-loading.tsx), drawn here small with the same classes, as the finder's search
// scene does. That stylesheet's reduced-motion rule and its aura, a deliberate exception to DESIGN.md's
// no-gradients rule, come with it.
import "@/features/rooms/components/room-loading.css";

const RIPPLE_DELAYS = ["0s", "-1.2s", "-2.4s"];

interface PersonaThinkingProps {
	/** What the server is doing, as it said it would. */
	line: string;
}

/**
 * The wait between two steps of the interview while a model writes the next
 * one: a lens that turns, and a line that says what is being written.
 */
export function PersonaThinking({ line }: PersonaThinkingProps) {
	return (
		<div
			className="room-loading flex min-w-0 flex-col items-center gap-2 overflow-x-clip py-6"
			style={
				{
					// its own clock, and an orbit that fits between two steps
					"--room-loading-t": "0ms",
					"--orbit-radius": "4.25rem",
				} as CSSProperties
			}
		>
			<div
				aria-hidden="true"
				className="room-loading-stage relative h-32 w-48 max-w-full shrink-0"
			>
				<div className="room-loading-aura absolute inset-0 m-auto size-28 rounded-full bg-conic from-primary via-chart-2 to-primary opacity-40 blur-xl dark:opacity-50" />
				<div className="room-loading-plane absolute inset-0">
					{RIPPLE_DELAYS.map((delay) => (
						<span
							key={delay}
							className="room-loading-ripple absolute inset-0 m-auto size-34 rounded-full border-2 border-primary/40"
							style={{ "--ripple-delay": delay } as CSSProperties}
						/>
					))}
					<span className="room-loading-drift absolute inset-0 m-auto size-44 rounded-full border border-primary/20 border-dashed" />
					<div className="room-loading-tile absolute inset-0 m-auto size-14">
						<div className="grid size-full place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30">
							<Sparkles className="size-6" strokeWidth={1.75} />
						</div>
					</div>
				</div>
			</div>
			<output className="wrap-anywhere block text-center font-medium text-base">
				{line || "Working on it"}…
			</output>
		</div>
	);
}
