import { useDroppable } from "@dnd-kit/core";
import { cn, H2, P } from "@semoss/ui/next";
import {
	FOR_YOU_PRIORITIES,
	type ForYouItem,
	type Priority,
} from "./for-you.model";
import { ForYouCard } from "./for-you-card";

interface ForYouColumnProps {
	/** Priority changed by dropping a pending item here. */
	priority: Priority;
	/** Pending, ordered items in this column. */
	items: ForYouItem[];
}

/** Priority lanes never change the underlying review or approval status. */
export function ForYouColumn({ priority, items }: ForYouColumnProps) {
	const { setNodeRef, isOver } = useDroppable({ id: priority });
	const label = FOR_YOU_PRIORITIES.find(({ id }) => id === priority)?.label;
	return (
		<section
			ref={setNodeRef}
			aria-label={`${label} priority`}
			className={cn(
				"min-w-0 rounded-xl bg-muted/50 p-3 transition-colors",
				isOver && "bg-accent outline-2 outline-primary/50",
			)}
		>
			<div className="mb-4 flex items-center gap-2 px-1 pt-1">
				<span
					aria-hidden="true"
					className={cn(
						"size-2 rounded-full",
						priority === "P0"
							? "bg-destructive"
							: priority === "P1"
								? "bg-warning"
								: priority === "P2"
									? "bg-foreground/60"
									: "bg-muted-foreground/40",
					)}
				/>
				<H2 className="font-medium text-sm">{label}</H2>
				<span className="ml-auto text-muted-foreground text-xs tabular-nums">
					{items.length}
				</span>
			</div>
			<div className="space-y-3">
				{items.map((item) => (
					<ForYouCard key={item.id} item={item} view="board" />
				))}
				{items.length === 0 && (
					<P className="flex min-h-32 items-center justify-center rounded-lg border border-dashed p-4 text-center text-muted-foreground text-sm">
						Nothing here
					</P>
				)}
			</div>
		</section>
	);
}
