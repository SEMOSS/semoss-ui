import { Tag } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Badge, Button, cn } from "@semoss/ui/next";
import { getDependencyTypeConfig } from "@/features/catalog/dependencies/catalog-dependency";
import { DEPENDENCY_FAMILIES, getDependencyFamily } from "./dependency-graph";

/** How many tags show before the rest fold behind "+N more". */
const VISIBLE_TAGS = 6;

/** Props for {@link DrawerItemMeta}. */
interface DrawerItemMetaProps {
	/** The item's catalog type, such as MODEL: its label, icon and colour */
	type: string;
	/**
	 * The underlying kind, such as OPEN_AI or H2_DB; not shown when it repeats
	 * the type, as a project's does
	 */
	subtype?: string | null;
	/** Status badges after the type, such as the user's access and visibility */
	children?: ReactNode;
	/** The item's tags, in the catalog's order */
	tags?: readonly string[];
}

/**
 * What an item is, under its name in a dependency drawer's header, across the
 * header's full width so nothing squeezes the name or the actions: one row of
 * facts (the type with its icon, the subtype as a quieter chip, then the
 * caller's status badges), wrapping as it must, and below it the tags, led by
 * a tag icon. Past six tags the rest fold behind "+N more", which shows them
 * all; a long tag is cut short with its full text on hover. The admin Ontology
 * and the Ontology tab share it.
 */
export const DrawerItemMeta = ({
	type,
	subtype,
	children,
	tags = [],
}: DrawerItemMetaProps) => {
	const [isShowingAllTags, setIsShowingAllTags] = useState(false);
	const typeConfig = getDependencyTypeConfig(type);
	const TypeIcon = typeConfig.icon;
	const shownSubtype = subtype === type ? null : subtype;
	const hiddenCount = Math.max(tags.length - VISIBLE_TAGS, 0);
	const shownTags = isShowingAllTags ? tags : tags.slice(0, VISIBLE_TAGS);

	return (
		<div className="flex flex-col gap-2">
			<div className="flex flex-wrap items-center gap-1.5">
				<Badge variant="outline" className="gap-1">
					<TypeIcon
						className={cn(
							"size-3",
							DEPENDENCY_FAMILIES[getDependencyFamily(type)]
								.textClass,
						)}
						aria-hidden="true"
					/>
					{typeConfig.label}
				</Badge>
				{shownSubtype ? (
					<Badge
						variant="outline"
						className="max-w-40 text-muted-foreground"
						title={shownSubtype}
					>
						<span className="truncate">{shownSubtype}</span>
					</Badge>
				) : null}
				{children}
			</div>
			{tags.length > 0 ? (
				<div className="flex items-start gap-1.5">
					<Tag
						className="mt-1 size-3.5 shrink-0 text-muted-foreground"
						aria-hidden="true"
					/>
					<ul
						aria-label="Tags"
						className="flex min-w-0 flex-wrap gap-1.5"
					>
						{shownTags.map((tag) => (
							<li key={tag} className="min-w-0">
								<Badge
									variant="secondary"
									className="max-w-40 font-normal"
									title={tag}
								>
									<span className="truncate">{tag}</span>
								</Badge>
							</li>
						))}
						{hiddenCount > 0 ? (
							<li>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="h-5 px-1.5 text-muted-foreground text-xs"
									aria-expanded={isShowingAllTags}
									onClick={() =>
										setIsShowingAllTags((shown) => !shown)
									}
								>
									{isShowingAllTags
										? "Show less"
										: `+${hiddenCount} more`}
								</Button>
							</li>
						) : null}
					</ul>
				</div>
			) : null}
		</div>
	);
};
