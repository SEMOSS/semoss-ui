import type { HTMLAttributes } from "react";
import { Avatar, AvatarFallback, AvatarImage, cn } from "@semoss/ui/next";
import { buildInitials } from "@semoss/utility/text";
import { useCatalogImageUrl } from "../hooks/use-catalog-image";
import { getAppCatalogAvatarStyle } from "./icon-utils";

interface AppCatalogAvatarProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children"> {
	/** App / project name used for the initials and their deterministic colors. */
	name: string;
	/** Image mode is the default; initials mode keeps the letter-and-color avatar. */
	mode?: "image" | "initials";
	/** Saved project ID used to load uploaded, stock, or system-managed artwork. */
	projectId?: string;
	/** Optional image URL, such as a bundled system-app SVG; takes precedence over projectId. */
	imageUrl?: string;
	/** Tailwind classes for the wrapper (sizing, rounding, etc.). */
	className?: string;
}

// Two letters fit every avatar size; a long name would otherwise overflow it.
const MAX_INITIALS = 2;

/** A themed project image with initials while loading, unavailable, or explicitly requested. */
export const AppCatalogAvatar = ({
	name,
	mode = "image",
	projectId,
	imageUrl,
	className,
	...rest
}: AppCatalogAvatarProps) => {
	const label = name || "App";
	const projectImageUrl = useCatalogImageUrl(
		"PROJECT",
		mode === "image" && !imageUrl ? (projectId ?? "") : "",
	);
	const src = mode === "image" ? imageUrl || projectImageUrl : undefined;

	return (
		<Avatar
			key={src || "initials"}
			asChild
			className={cn("rounded-none font-semibold", className)}
		>
			<div aria-hidden="true" {...rest}>
				{src && (
					<AvatarImage src={src} alt="" className="object-cover" />
				)}
				<AvatarFallback
					className="rounded-none"
					style={getAppCatalogAvatarStyle(label)}
				>
					{buildInitials(label, MAX_INITIALS)}
				</AvatarFallback>
			</div>
		</Avatar>
	);
};
