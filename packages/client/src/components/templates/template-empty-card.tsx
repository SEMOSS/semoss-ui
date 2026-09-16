import { Check, FilePlus2 } from "lucide-react";
import { Card, cn, P } from "@semoss/ui/next";

export interface TemplateEmptyCardProps
	extends React.ComponentProps<typeof Card> {
	/** Marks the tile as the caller's current selection */
	isSelected?: boolean;
}

/**
 * The "no template" tile. Mirrors `TemplateCard`'s shape so it lines up with
 * the rest of the grid.
 */
export const TemplateEmptyCard = ({
	isSelected = false,
	className,
	...cardProps
}: TemplateEmptyCardProps) => {
	return (
		<Card
			{...cardProps}
			className={cn(
				"flex h-full flex-col gap-0 overflow-hidden p-0 transition-all",
				isSelected && "ring-2 ring-primary",
				className,
			)}
			data-testid="templateEmptyCard"
		>
			<div className="relative flex h-40 w-full items-center justify-center border-b bg-muted/50">
				<div className="flex size-16 items-center justify-center rounded-xl border border-border border-dashed bg-background">
					<FilePlus2
						aria-hidden="true"
						className="size-7 text-muted-foreground"
					/>
				</div>
				{isSelected ? (
					<span className="absolute top-2.5 right-2.5 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
						<Check aria-hidden="true" className="size-3.5" />
						<span className="sr-only">Selected</span>
					</span>
				) : null}
			</div>

			<div className="p-4">
				<P className="line-clamp-1 font-semibold text-base">
					Start from scratch
				</P>
			</div>
		</Card>
	);
};
