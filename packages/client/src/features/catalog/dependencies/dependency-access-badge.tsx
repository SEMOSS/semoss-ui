import { Badge } from "@semoss/ui/next";
import type { DependencyAccess } from "./catalog-dependency";
import { getDependencyAccessStatus } from "./dependency-access-status";

/** Props for {@link DependencyAccessBadge}. */
interface DependencyAccessBadgeProps {
	/** The user's access to the dependency */
	access: DependencyAccess;
}

/** The user's access to a dependency, as a badge with its icon and words. */
export const DependencyAccessBadge = ({
	access,
}: DependencyAccessBadgeProps) => {
	const { label, variant, icon: Icon } = getDependencyAccessStatus(access);
	return (
		<Badge variant={variant} className="gap-1">
			{Icon ? <Icon className="size-3" aria-hidden="true" /> : null}
			{label}
		</Badge>
	);
};
