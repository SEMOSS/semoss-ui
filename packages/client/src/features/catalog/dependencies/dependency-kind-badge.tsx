import { Lock, PencilLine } from "lucide-react";
import { Badge, cn } from "@semoss/ui/next";

/** Props for {@link DependencyKindBadge}. */
interface DependencyKindBadgeProps {
	/** Whether the link is recorded from its owner's configuration */
	isAutomatic: boolean;
	className?: string;
}

/**
 * Whether a dependency link is Automatic, recorded from its owner's
 * configuration and changed only there (a lock), or Manual, added by a
 * person with a name and description (a pencil). The kind is always said in
 * words beside its icon, so it never rests on the line style or colour.
 */
export const DependencyKindBadge = ({
	isAutomatic,
	className,
}: DependencyKindBadgeProps) =>
	isAutomatic ? (
		<Badge variant="secondary" className={cn("gap-1", className)}>
			<Lock className="size-3" aria-hidden="true" />
			Automatic
		</Badge>
	) : (
		<Badge variant="outline" className={cn("gap-1", className)}>
			<PencilLine className="size-3" aria-hidden="true" />
			Manual
		</Badge>
	);
