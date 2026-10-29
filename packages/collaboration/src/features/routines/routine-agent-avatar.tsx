import { type ReactNode, useId } from "react";
import { cn } from "@semoss/ui/next";

interface AgentArt {
	/** The tile's chart color, which tells the agents apart. */
	tileClassName: string;
	/** The agent's props, drawn behind its head; `clay` paints the shaded parts. */
	props: (clay: string) => ReactNode;
}

const AGENT_ART = {
	"inbox-daily-brief": {
		tileClassName: "fill-chart-1",
		props: (clay) => (
			<>
				<rect
					x="10"
					y="2"
					width="10"
					height="6"
					rx="1"
					fill={clay}
					stroke={clay}
				/>
				<path
					d="m10.5 3 4.5 2.75 4.5-2.75"
					className="stroke-chart-1"
				/>
			</>
		),
	},
	"weekly-meeting-agendas": {
		tileClassName: "fill-chart-3",
		props: () => (
			<>
				<path d="M3.5 15v-3a8.5 8.5 0 0 1 17 0v3" />
				<path d="M3.5 14v3M20.5 14v3" strokeWidth={3} />
			</>
		),
	},
	"event-planning": {
		tileClassName: "fill-chart-4",
		props: (clay) => (
			<>
				<path d="M9.5 9 14 3.5l2.5 6.2z" fill={clay} stroke={clay} />
				<path d="M14 2.5h.01" strokeWidth={3} />
			</>
		),
	},
	"expense-review": {
		tileClassName: "fill-chart-2",
		props: () => (
			<>
				<circle cx="15.5" cy="4.5" r="2.5" />
				<path d="m17.5 6.5 2.5 2.5" />
			</>
		),
	},
} satisfies Record<string, AgentArt>;

interface RoutineAgentAvatarProps {
	/** The system routine whose agent to draw. */
	routineId: keyof typeof AGENT_ART;
	className?: string;
}

/**
 * A system routine's agent: a capsule-eyed robot, after the Grok bot mascot, in soft 3D on a tile in the agent's chart color.
 * Decorative; it fills its container, so size it with the slot it sits in.
 */
export function RoutineAgentAvatar({
	routineId,
	className,
}: RoutineAgentAvatarProps) {
	// url(#...) finds gradients by id, so every avatar needs its own; useId's punctuation is dropped to keep the reference plain
	const id = useId().replace(/[^\w-]/g, "");
	const art = AGENT_ART[routineId];
	// lines that would have no width or height, like the ear cups, can't take a gradient, so only the filled shapes use it
	const clay = `url(#${id}-clay)`;
	return (
		// a deliberate exception to DESIGN.md's no-gradients rule: the owner chose this soft 3D look for the agents
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={2}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			// currentColor is the clay's light color, in both themes
			className={cn(
				"size-full text-background dark:text-foreground",
				className,
			)}
		>
			<defs>
				<linearGradient id={`${id}-shine`} x2="0" y2="1">
					<stop stopColor="currentColor" stopOpacity={0.35} />
					<stop offset="1" stopColor="currentColor" stopOpacity={0} />
				</linearGradient>
				{/* the see-through rim lets the tile's color tint the clay's edges */}
				<radialGradient id={`${id}-clay`} cx="0.38" cy="0.3" r="0.85">
					<stop stopColor="currentColor" />
					<stop
						offset="1"
						stopColor="currentColor"
						stopOpacity={0.78}
					/>
				</radialGradient>
				<filter
					id={`${id}-shadow`}
					x="-30%"
					y="-30%"
					width="160%"
					height="160%"
				>
					<feDropShadow
						dy={0.8}
						stdDeviation={0.7}
						floodColor="currentColor"
						floodOpacity={0.28}
						className="text-foreground dark:text-background"
					/>
				</filter>
			</defs>
			<rect
				width="24"
				height="24"
				rx="6"
				stroke="none"
				className={art.tileClassName}
			/>
			<rect
				width="24"
				height="24"
				rx="6"
				stroke="none"
				fill={`url(#${id}-shine)`}
			/>
			{/* shrinks the robot so it sits inside its tile */}
			<g
				transform="matrix(0.8 0 0 0.8 2.4 2.4)"
				filter={`url(#${id}-shadow)`}
			>
				{art.props(clay)}
				<rect
					x="5"
					y="9"
					width="14"
					height="12"
					rx="5"
					stroke="none"
					fill={clay}
				/>
				<g
					strokeWidth={3}
					className="stroke-foreground dark:stroke-background"
				>
					<path d="M9.5 14v2" />
					<path d="M14.5 14v2" />
				</g>
				<g stroke="none" fill="currentColor">
					<circle cx="9.1" cy="13.4" r="0.45" />
					<circle cx="14.1" cy="13.4" r="0.45" />
				</g>
			</g>
		</svg>
	);
}
