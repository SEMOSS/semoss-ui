import type { ReactNode } from "react";
import { Avatar, AvatarFallback, AvatarImage, cn } from "@semoss/ui/next";
import {
	type CatalogImageResource,
	useCatalogImageUrl,
} from "./use-catalog-image";

interface CatalogImageProps {
	/** Determines the resource-scoped download endpoint. */
	resource: CatalogImageResource;
	/** Saved engine or project ID. */
	id: string;
	/** Existing initials or engine icon to show while loading or on failure. */
	fallback: ReactNode;
	/** Override the default catalog icon size. */
	className?: string;
}

/** A decorative resource image, kept fresh across catalog and settings views. */
export function CatalogImage({
	resource,
	id,
	fallback,
	className,
}: CatalogImageProps) {
	const src = useCatalogImageUrl(resource, id);
	return (
		<Avatar aria-hidden="true" className={cn("size-12 rounded", className)}>
			<AvatarImage src={src} alt="" className="object-cover" />
			<AvatarFallback className="rounded">{fallback}</AvatarFallback>
		</Avatar>
	);
}
