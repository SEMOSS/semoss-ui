import type { ComponentProps } from "react";
import {
	Item,
	ItemContent,
	ItemDescription,
	ItemMedia,
	ItemTitle,
} from "@semoss/ui/next";
import { DependencyKindBadge } from "@/features/catalog/dependencies/dependency-kind-badge";
import { DependencyItemImage } from "./dependency-item-image";
import { MapTooltip } from "./map-tooltip";

/** Props for {@link DependencyLinkRow}. */
interface DependencyLinkRowProps {
	/** The item at the link's other end */
	node: ComponentProps<typeof DependencyItemImage>["node"];
	/** Whether the user cannot see what the item is */
	isPrivate?: boolean;
	/** The line under the item's name, such as its type and a manual link's name */
	description: string;
	/**
	 * The link's kind and its badge's words, such as its role; no badge when
	 * left out, as for the link to the items the user cannot view
	 */
	link?: { readonly isAutomatic: boolean; readonly label: string };
	/** What the link is for, in a tooltip on the row */
	note?: string | null;
	/** Opens the item */
	onOpenItem: () => void;
	/** Opens the link, from its badge; the badge is static when left out */
	onOpenLink?: () => void;
	/** The badge's name when it opens the link */
	linkLabel?: string;
}

/**
 * One link in a dependency drawer's list, on one row: the item at the
 * link's other end (its image, its name, and a line under it), which opens
 * the item, then the link's kind at the end (`DependencyKindBadge`), which
 * can open the link. What the link is for is the row's tooltip. The admin
 * Ontology's lists and the Ontology tab's Lineage share it.
 */
export const DependencyLinkRow = ({
	node,
	isPrivate = false,
	description,
	link,
	note,
	onOpenItem,
	onOpenLink,
	linkLabel,
}: DependencyLinkRowProps) => {
	const row = (
		<Item
			asChild
			size="sm"
			className="min-w-0 flex-1 flex-nowrap px-2 py-1.5 text-left"
		>
			<button type="button" onClick={onOpenItem}>
				<ItemMedia>
					<DependencyItemImage
						node={node}
						isPrivate={isPrivate}
						className="size-6"
					/>
				</ItemMedia>
				<ItemContent className="min-w-0 gap-0">
					<ItemTitle
						className="w-full truncate font-normal"
						title={node.name}
					>
						{node.name}
					</ItemTitle>
					<ItemDescription className="truncate text-xs">
						{description}
					</ItemDescription>
				</ItemContent>
			</button>
		</Item>
	);

	return (
		<li className="flex min-w-0 items-center gap-1">
			{note ? <MapTooltip label={note}>{row}</MapTooltip> : row}
			{link ? (
				<DependencyKindBadge
					isAutomatic={link.isAutomatic}
					label={link.label}
					onClick={onOpenLink}
					aria-label={onOpenLink ? linkLabel : undefined}
				/>
			) : null}
		</li>
	);
};
