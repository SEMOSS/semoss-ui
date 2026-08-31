import { cn } from "@semoss/ui/next";

interface NoDetailsEmptyStateProps
	extends React.HTMLAttributes<HTMLDivElement> {
	/** Heading shown under the illustration */
	title?: string;
	/** Supporting copy shown under the heading */
	description?: string;
}

/**
 * Placeholder illustration shown when a catalog entry (app, engine, model, etc.)
 * has no markdown description. The artwork is inlined so every fill/stroke can
 * use Tailwind semantic tokens, which keeps it readable in light and dark mode.
 */
export const NoDetailsEmptyState = ({
	title = "No details yet",
	description = "This catalog entry doesn't have a markdown description provided.",
	className,
	...props
}: NoDetailsEmptyStateProps) => {
	return (
		<div
			className={cn(
				// Content sits at the top of its container; callers control vertical
				// placement (the metadata sidebar can make the row very tall).
				"flex w-full flex-col items-center justify-start gap-4 py-8 text-center",
				className,
			)}
			{...props}
		>
			{/*
			 * viewBox is cropped to the artwork bounds (x 220-460, y 40-330) with a
			 * few units of breathing room, so the drawing fills the box instead of
			 * floating inside a mostly empty canvas.
			 */}
			<svg
				viewBox="214 30 252 300"
				role="img"
				aria-hidden="true"
				className="h-auto w-96 max-w-full"
			>
				{/* Accent halo */}
				<circle cx="340" cy="150" r="110" className="fill-primary/10" />

				{/* Ground shadow */}
				<ellipse
					cx="340"
					cy="300"
					rx="120"
					ry="14"
					className="fill-muted-foreground/20"
				/>

				{/* Document */}
				<rect
					x="270"
					y="90"
					width="140"
					height="180"
					rx="10"
					strokeWidth="1.5"
					className="fill-card stroke-muted-foreground/30"
				/>
				<rect
					x="290"
					y="116"
					width="70"
					height="10"
					rx="3"
					className="fill-muted-foreground/40"
				/>
				<rect
					x="290"
					y="140"
					width="100"
					height="8"
					rx="3"
					className="fill-muted-foreground/25"
				/>
				<rect
					x="290"
					y="158"
					width="100"
					height="8"
					rx="3"
					className="fill-muted-foreground/25"
				/>
				<rect
					x="290"
					y="176"
					width="90"
					height="8"
					rx="3"
					className="fill-muted-foreground/25"
				/>
				<rect
					x="290"
					y="194"
					width="60"
					height="8"
					rx="3"
					className="fill-muted-foreground/25"
				/>

				{/* Pencil edit badge */}
				<circle
					cx="392"
					cy="256"
					r="30"
					strokeWidth="1.5"
					className="fill-primary/15 stroke-primary"
				/>
				<path
					d="M383 264 L385 254 L400 239 L406 245 L391 260 Z"
					className="fill-card"
				/>
				<path d="M383 264 L385 260 L389 262 Z" className="fill-card" />

				{/* Divider */}
				<line
					x1="300"
					y1="320"
					x2="326"
					y2="320"
					strokeWidth="2"
					strokeLinecap="round"
					className="stroke-muted-foreground/40"
				/>
				<circle cx="340" cy="320" r="4" className="fill-primary" />
				<line
					x1="354"
					y1="320"
					x2="380"
					y2="320"
					strokeWidth="2"
					strokeLinecap="round"
					className="stroke-muted-foreground/40"
				/>
			</svg>

			<div className="space-y-1">
				<p className="font-medium text-foreground text-lg">{title}</p>
				<p className="max-w-md text-muted-foreground text-sm">
					{description}
				</p>
			</div>
		</div>
	);
};
