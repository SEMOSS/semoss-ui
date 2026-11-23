import { X } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";
import { Button, H4, Muted, ScrollArea, Separator } from "@semoss/ui/next";
import { MapTooltip } from "./map-tooltip";

/** Props for {@link DependencyDrawer}. */
interface DependencyDrawerProps {
	/** The drawer's accessible name */
	label: string;
	/** The heading: the item's name, or what is shown */
	title: string;
	/** A line under the heading, such as a link's two ends */
	description?: string;
	/** The image before the heading */
	media?: ReactNode;
	/** Icon buttons before Close, kept apart from it by a rule */
	actions?: ReactNode;
	/** What the item is, across the full width under the heading */
	meta?: ReactNode;
	/** What is shown; the heading takes focus again when it changes */
	focusKey: string;
	/** Closes the drawer, from Close */
	onClose: () => void;
	/** The details, scrolling under the header */
	children: ReactNode;
}

/**
 * The drawer both dependency graphs open beside their canvas, the admin
 * Ontology and the Ontology tab: an `aside` that slides in, with a header of
 * the image, the heading (up to two lines), the actions and Close (Esc) on one
 * row, then what the item is across the full width, and the details scrolling
 * below. Its heading takes focus whenever something new opens, so the details
 * are read next. Where focus goes on close is the owner's, in `onClose`.
 */
export const DependencyDrawer = ({
	label,
	title,
	description,
	media,
	actions,
	meta,
	focusKey,
	onClose,
	children,
}: DependencyDrawerProps) => {
	const headingRef = useRef<HTMLHeadingElement>(null);

	// a newly opened item takes focus, so its details are read next
	// biome-ignore lint/correctness/useExhaustiveDependencies: the heading moves focus each time something else opens
	useEffect(() => {
		headingRef.current?.focus();
	}, [focusKey]);

	return (
		<aside
			aria-label={label}
			className="slide-in-from-right flex size-full min-h-0 animate-in flex-col border-l bg-background duration-300"
		>
			<div className="flex flex-col gap-3 border-b p-4">
				<div className="flex min-w-0 items-start gap-3">
					{media}
					{/* the name has the row to itself, up to two lines */}
					<div className="flex min-w-0 flex-1 flex-col gap-0.5 self-center">
						<H4
							ref={headingRef}
							tabIndex={-1}
							title={title}
							className="line-clamp-2 break-words text-base leading-snug focus-visible:outline-none"
						>
							{title}
						</H4>
						{description ? (
							<Muted className="break-words">{description}</Muted>
						) : null}
					</div>
					{/* one row of actions, centred on the image beside the title */}
					<div className="flex h-10 shrink-0 items-center gap-1">
						{actions ? (
							<>
								{actions}
								<Separator
									orientation="vertical"
									className="h-5"
								/>
							</>
						) : null}
						<MapTooltip label="Close (Esc)">
							<Button
								type="button"
								size="icon-sm"
								variant="ghost"
								aria-label="Close details"
								onClick={onClose}
							>
								<X aria-hidden="true" />
							</Button>
						</MapTooltip>
					</div>
				</div>
				{meta}
			</div>
			<ScrollArea className="min-h-0 flex-1">
				<div className="px-4 pb-4">{children}</div>
			</ScrollArea>
		</aside>
	);
};
