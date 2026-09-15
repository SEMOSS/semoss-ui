import { Badge } from "@semoss/ui/next";
import { getTagBadgeStyle, normalizeTagArray } from "@/utility";

export interface CatalogTagsProps {
	/** Tags to render as badges */
	tags?: string[] | string;
	/** Empty-state text when no tags exist */
	emptyText?: string;
}

export const CatalogTags = ({ tags, emptyText = "None" }: CatalogTagsProps) => {
	const normalizedTags = normalizeTagArray(tags)
		.map((tag) => tag.trim())
		.filter((tag) => tag !== "");

	if (normalizedTags.length === 0) {
		return <div className="text-muted-foreground text-sm">{emptyText}</div>;
	}

	return (
		<div className="flex flex-wrap gap-2">
			{normalizedTags.map((tag) => (
				<Badge
					key={tag}
					variant="outline"
					style={getTagBadgeStyle(tag)}
				>
					{tag}
				</Badge>
			))}
		</div>
	);
};
