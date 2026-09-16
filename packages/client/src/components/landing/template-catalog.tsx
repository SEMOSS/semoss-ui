import { Link } from "react-router";
import { Button, cn } from "@semoss/ui/next";
import { PreviewFrame } from "./preview-frame";
import { SectionHeading } from "./section-heading";

/**
 * Annotated regions in the decorative catalog preview. Each maps to one of the
 * three status tokens plus the primary accent — there is no separate palette.
 */
const ANNOTATIONS = [
	{ label: "Reasoning", bars: ["w-4/5", "w-3/5"], tone: "primary" },
	{ label: "Tool call", bars: ["w-full", "w-2/3", "w-3/4"], tone: "success" },
	{ label: "Result", bars: ["w-3/4", "w-1/2"], tone: "destructive" },
	{ label: "Side effect", bars: ["w-2/5"], tone: "warning" },
] as const;

const TONE_BORDER = {
	primary: "border-primary",
	success: "border-success",
	destructive: "border-destructive",
	warning: "border-warning",
} as const;

const TONE_LABEL = {
	primary: "bg-primary text-primary-foreground",
	success: "bg-success text-success-foreground",
	destructive: "bg-destructive text-destructive-foreground",
	warning: "bg-warning text-warning-foreground",
} as const;

/**
 * "Browse our template catalog" — copy on the left, an annotated preview of a
 * template's reasoning trace on the right.
 */
export const TemplateCatalog = () => (
	<div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
		<div className="flex flex-col items-start gap-6">
			<SectionHeading
				eyebrow="Customization"
				title="Browse our template catalog"
				description="Explore reusable templates for apps of every kind. Choose a starting point, create your own app, and customize it to fit your use case."
			/>
			<Button asChild variant="outline" className="rounded-full">
				<Link to="templates">Browse catalog</Link>
			</Button>
		</div>
		<PreviewFrame
			className="aspect-4/3 w-full"
			innerClassName="bg-card p-6"
		>
			<div aria-hidden="true" className="flex h-full flex-col gap-6">
				{ANNOTATIONS.map((annotation) => (
					<div
						key={annotation.label}
						className={cn(
							"relative flex flex-1 flex-col justify-center gap-3 rounded-xl border-2 px-4",
							TONE_BORDER[annotation.tone],
						)}
					>
						<span
							className={cn(
								"-top-2 absolute left-3 rounded-sm px-1.5 font-mono text-xs uppercase tracking-widest",
								TONE_LABEL[annotation.tone],
							)}
						>
							{annotation.label}
						</span>
						{annotation.bars.map((width) => (
							<div
								key={width}
								className={cn(
									"h-2.5 rounded-full bg-muted-foreground/20",
									width,
								)}
							/>
						))}
					</div>
				))}
			</div>
		</PreviewFrame>
	</div>
);
