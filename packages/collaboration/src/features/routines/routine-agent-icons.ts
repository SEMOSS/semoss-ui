import { createLucideIcon, type IconNode, type LucideIcon } from "lucide-react";

/** The face every system routine agent shares, after the Grok bot mascot: a page-colored head with two capsule eyes. */
const face: IconNode = [
	[
		"rect",
		{
			x: "5",
			y: "9",
			width: "14",
			height: "12",
			rx: "5",
			className: "fill-background stroke-none",
			key: "head",
		},
	],
	// heavier than the outline so the eyes read as solid capsules
	[
		"path",
		{
			d: "M9.5 14v2",
			strokeWidth: "3",
			className: "stroke-foreground",
			key: "left-eye",
		},
	],
	[
		"path",
		{
			d: "M14.5 14v2",
			strokeWidth: "3",
			className: "stroke-foreground",
			key: "right-eye",
		},
	],
];

/**
 * An agent avatar: a tile in the agent's chart color, its props, then its face, drawn last so the props tuck behind the head.
 * Paints every color itself, so it ignores the text color it is placed in.
 */
function agentIcon(
	name: string,
	tileClassName: string,
	props: IconNode,
): LucideIcon {
	return createLucideIcon(name, [
		[
			"rect",
			{
				width: "24",
				height: "24",
				rx: "6",
				className: `${tileClassName} stroke-none`,
				key: "tile",
			},
		],
		// shrinks the robot so it sits inside its tile
		...[...props, ...face].map(([tag, attrs]): IconNode[number] => [
			tag,
			{ ...attrs, transform: "matrix(0.8 0 0 0.8 2.4 2.4)" },
		]),
	]);
}

/** The inbox daily brief agent, carrying an envelope. */
export const InboxAgentIcon = agentIcon("inbox-agent", "fill-chart-1", [
	[
		"rect",
		{
			x: "10",
			y: "2",
			width: "10",
			height: "6",
			rx: "1",
			className: "fill-background stroke-background",
			key: "envelope",
		},
	],
	[
		"path",
		{
			d: "m10.5 3 4.5 2.75 4.5-2.75",
			className: "stroke-chart-1",
			key: "envelope-flap",
		},
	],
]);

/** The weekly meeting agendas agent, wearing a headset. */
export const AgendaAgentIcon = agentIcon("agenda-agent", "fill-chart-3", [
	[
		"path",
		{
			d: "M3.5 15v-3a8.5 8.5 0 0 1 17 0v3",
			className: "stroke-background",
			key: "headband",
		},
	],
	[
		"path",
		{
			d: "M3.5 14v3",
			strokeWidth: "3",
			className: "stroke-background",
			key: "left-ear-cup",
		},
	],
	[
		"path",
		{
			d: "M20.5 14v3",
			strokeWidth: "3",
			className: "stroke-background",
			key: "right-ear-cup",
		},
	],
]);

/** The event planning agent, wearing a party hat. */
export const EventPlanningAgentIcon = agentIcon(
	"event-planning-agent",
	"fill-chart-4",
	[
		[
			"path",
			{
				d: "M9.5 9 14 3.5l2.5 6.2z",
				className: "fill-background stroke-background",
				key: "party-hat",
			},
		],
		[
			"path",
			{
				d: "M14 2.5h.01",
				strokeWidth: "3",
				className: "stroke-background",
				key: "pom-pom",
			},
		],
	],
);

/** The expense review agent, holding a magnifying glass. */
export const ExpenseAgentIcon = agentIcon("expense-agent", "fill-chart-2", [
	[
		"circle",
		{
			cx: "15.5",
			cy: "4.5",
			r: "2.5",
			className: "stroke-background",
			key: "lens",
		},
	],
	[
		"path",
		{
			d: "m17.5 6.5 2.5 2.5",
			className: "stroke-background",
			key: "lens-handle",
		},
	],
]);
