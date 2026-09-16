import { Link } from "react-router";
import { cn } from "@semoss/ui/next";

interface ToolCard {
	title: string;
	description: string;
	/** In-app route this card opens */
	to: string;
	testId: string;
	/** Tint applied to the card's glyph panel */
	panelClassName: string;
	/** Token classes for the decorative bars/avatars inside the panel */
	markClassName: string;
	mutedMarkClassName: string;
	/** Which decorative glyph the panel draws */
	glyph: "bars" | "rows";
}

const CARDS: readonly ToolCard[] = [
	{
		title: "Develop in code",
		description:
			"Choose a framework or start from scratch—code and preview your app seamlessly in our editor!",
		to: "/app",
		testId: "new-app-code-btn",
		panelClassName: "bg-success/10",
		markClassName: "bg-success/40",
		mutedMarkClassName: "bg-success/20",
		glyph: "bars",
	},
	{
		title: "Run interactive notebooks",
		description:
			"Write and execute code cells, visualize data, and document your analysis in a live, interactive notebook environment.",
		to: "/notebook",
		testId: "new-notebook-btn",
		panelClassName: "bg-muted",
		markClassName: "bg-muted-foreground/25",
		mutedMarkClassName: "bg-muted-foreground/15",
		glyph: "rows",
	},
];

/**
 * Decorative glyph drawn inside a card's tinted panel. These are static
 * ornaments, so they use token-filled elements rather than the animated
 * `Skeleton` primitive.
 */
const CardGlyph = ({ card }: { card: ToolCard }) => {
	if (card.glyph === "rows") {
		return (
			<div className="flex h-full w-full flex-col justify-between">
				{[0, 1].map((row) => (
					<div key={row} className="flex items-center gap-4">
						<div
							className={cn(
								"size-10 shrink-0 rounded-full",
								card.markClassName,
							)}
						/>
						<div className="flex min-w-0 flex-col gap-2">
							<div
								className={cn(
									"h-4 w-32 rounded-md",
									card.mutedMarkClassName,
								)}
							/>
							<div
								className={cn(
									"h-4 w-20 rounded-md",
									card.mutedMarkClassName,
								)}
							/>
						</div>
					</div>
				))}
			</div>
		);
	}

	return (
		<div className="flex h-full w-full flex-col gap-2">
			<div
				className={cn("h-2.5 w-4/5 rounded-full", card.markClassName)}
			/>
			<div
				className={cn(
					"h-2.5 w-full rounded-full",
					card.mutedMarkClassName,
				)}
			/>
			<div
				className={cn("h-2.5 w-2/3 rounded-full", card.markClassName)}
			/>
		</div>
	);
};

/**
 * The "Get started with our tools" cards. Each tile is a single link into the
 * catalog where that kind of project is created.
 */
export const ToolCards = () => (
	<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
		{CARDS.map((card) => (
			<Link
				key={card.to}
				to={card.to}
				data-testid={card.testId}
				className="group flex flex-col gap-6 rounded-2xl text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
			>
				<div
					aria-hidden="true"
					className={cn(
						"group-hover:-translate-y-0.5 h-42 rounded-2xl p-6 transition-transform",
						card.panelClassName,
					)}
				>
					<CardGlyph card={card} />
				</div>
				<div className="flex flex-col gap-2">
					<h3 className="heading-sm text-foreground">{card.title}</h3>
					<p className="text-base text-muted-foreground">
						{card.description}
					</p>
				</div>
			</Link>
		))}
	</div>
);
