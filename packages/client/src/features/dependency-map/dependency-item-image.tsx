import { Lock } from "lucide-react";
import {
	AppCatalogAvatar,
	EngineSubtypeIcon,
	useCatalogImageUrl,
} from "@semoss/shared";
import { Avatar, AvatarFallback, AvatarImage, cn } from "@semoss/ui/next";
import type { DependencyGraphNode } from "@/api/dependency-map";
import { getDependencyTypeConfig } from "@/features/catalog/dependencies/catalog-dependency";

interface DependencyItemImageProps {
	/** The item */
	node: Pick<
		DependencyGraphNode,
		"id" | "kind" | "type" | "subtype" | "name"
	> & {
		/** Whether the item was deleted: its type's icon, and no image is read */
		missing?: boolean;
	};
	/** Whether the user cannot see what it is: a lock, and no image is read */
	isPrivate?: boolean;
	/** Size classes */
	className?: string;
}

/**
 * An item's image, as the catalog has it: a project's image (else its
 * initials), or an engine's image (else its type's logo). A deleted item shows
 * its type's icon, and an item private to the user a lock. Decorative: the
 * item's name is always beside it.
 */
export const DependencyItemImage = ({
	node,
	isPrivate = false,
	className,
}: DependencyItemImageProps) => {
	// an empty id reads no image
	const engineImageUrl = useCatalogImageUrl(
		"ENGINE",
		node.kind === "ENGINE" && !node.missing && !isPrivate ? node.id : "",
	);
	if (node.missing || isPrivate) {
		const Icon = isPrivate ? Lock : getDependencyTypeConfig(node.type).icon;
		return (
			<span
				aria-hidden="true"
				className={cn(
					"flex shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground",
					className,
				)}
			>
				<Icon className="size-4" />
			</span>
		);
	}
	if (node.kind === "PROJECT") {
		return (
			<AppCatalogAvatar
				projectId={node.id}
				name={node.name}
				className={cn("shrink-0 rounded-md text-xs", className)}
			/>
		);
	}
	return (
		<Avatar
			key={engineImageUrl}
			aria-hidden="true"
			className={cn("shrink-0 rounded-md bg-muted", className)}
		>
			<AvatarImage
				src={engineImageUrl}
				alt=""
				loading="lazy"
				decoding="async"
				className="object-contain"
			/>
			<AvatarFallback className="rounded-md bg-muted">
				<EngineSubtypeIcon
					engineType={node.type}
					engineSubtype={node.subtype ?? undefined}
					className="size-3/4 object-contain"
				/>
			</AvatarFallback>
		</Avatar>
	);
};
