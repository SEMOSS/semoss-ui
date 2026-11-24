import { X } from "lucide-react";
import { useId } from "react";
import { Badge, Button } from "@semoss/ui/next";
import { GrantResource } from "./grant-resource";
import { type PickedResource, resourceKey } from "./picked-resource";

/** Props for {@link GrantQueue}. */
export interface GrantQueueProps {
	/** The list's heading, such as "To Authorize"; the count follows it */
	heading: string;
	/** What the list says while it is empty */
	emptyText: string;
	/** The engines and projects on the list */
	items: readonly PickedResource[];
	/** The badge beside one, such as its type's name, or null for none */
	badgeOf?: (item: PickedResource) => string | null;
	/** Whether the remove buttons are disabled, while the dialog saves */
	disabled?: boolean;
	/** Takes one off the list */
	onRemove: (item: PickedResource) => void;
}

/**
 * A list of engines and projects picked in an Add dialog, each with its image
 * or logo, name, id, an optional badge and a button that takes it off. The
 * list is a region named by its heading, with how many it holds.
 */
export const GrantQueue = ({
	heading,
	emptyText,
	items,
	badgeOf,
	disabled = false,
	onRemove,
}: GrantQueueProps) => {
	const headingId = useId();
	return (
		<section aria-labelledby={headingId} className="flex flex-col gap-2">
			<h3 id={headingId} className="font-medium text-sm">
				{heading} ({items.length})
			</h3>
			{items.length === 0 ? (
				<p className="text-muted-foreground text-sm">{emptyText}</p>
			) : (
				<ul className="flex max-h-60 flex-col divide-y divide-border overflow-y-auto rounded-md border border-border">
					{items.map((item) => {
						const badge = badgeOf?.(item) ?? null;
						return (
							<li
								key={resourceKey(item)}
								className="flex items-center gap-3 px-3 py-2"
							>
								<div className="min-w-0 flex-1">
									<GrantResource
										type={item.type}
										id={item.id}
										name={item.name}
										subtype={item.subtype}
										isLinked={false}
									/>
								</div>
								{badge ? (
									<Badge variant="secondary">{badge}</Badge>
								) : null}
								<Button
									type="button"
									variant="ghost"
									size="icon-sm"
									disabled={disabled}
									aria-label={`Remove ${item.name} from the list`}
									onClick={() => onRemove(item)}
								>
									<X className="size-4" aria-hidden />
								</Button>
							</li>
						);
					})}
				</ul>
			)}
		</section>
	);
};
