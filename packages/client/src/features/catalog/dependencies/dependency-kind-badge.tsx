import { Lock, PencilLine } from "lucide-react";
import { Badge } from "@semoss/ui/next";

/** Props for {@link DependencyKindBadge}. */
interface DependencyKindBadgeProps {
	/** Whether the link is recorded from its owner's configuration */
	isAutomatic: boolean;
	/**
	 * What the badge says after its icon, such as the link's role; the kind
	 * itself, Automatic or Manual, when left out
	 */
	label?: string;
	/** Opens the link; the badge is then a button */
	onClick?: () => void;
	/** The button's name, when it is one */
	"aria-label"?: string;
}

/**
 * Whether a dependency link is Automatic, recorded from its owner's
 * configuration and changed only there (a lock), or Manual, added by a
 * person (a pencil), so the kind never rests on a line's style or colour.
 * Every place that lists links uses it: the drawers' Configuration and
 * Lineage, and the admin Ontology's lists, where it opens the link. With a
 * label, such as the role, screen readers still hear the kind first.
 */
export const DependencyKindBadge = ({
	isAutomatic,
	label,
	onClick,
	"aria-label": ariaLabel,
}: DependencyKindBadgeProps) => {
	const kind = isAutomatic ? "Automatic" : "Manual";
	const text = label ?? kind;
	const Icon = isAutomatic ? Lock : PencilLine;
	const content = (
		<>
			<Icon className="size-3" aria-hidden="true" />
			{text === kind ? null : (
				<span className="sr-only">{`${kind}: `}</span>
			)}
			{text}
		</>
	);
	const variant = isAutomatic ? "secondary" : "outline";

	return onClick ? (
		<Badge asChild variant={variant}>
			<button
				type="button"
				className="shrink-0 gap-1"
				aria-label={ariaLabel}
				onClick={onClick}
			>
				{content}
			</button>
		</Badge>
	) : (
		<Badge variant={variant} className="shrink-0 gap-1">
			{content}
		</Badge>
	);
};
