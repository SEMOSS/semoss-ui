import { Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@semoss/ui/next";
import { MapTooltip } from "./map-tooltip";

/** Props for {@link ExpandCanvasButton}. */
interface ExpandCanvasButtonProps {
	/** Whether the graph fills the window */
	isExpanded: boolean;
	/** Expands or collapses the graph */
	onToggle: () => void;
}

/**
 * Expand or Collapse for a dependency graph's toolbar, an icon button named in
 * its tooltip. The admin Ontology and the Ontology tab share it.
 */
export const ExpandCanvasButton = ({
	isExpanded,
	onToggle,
}: ExpandCanvasButtonProps) => (
	<MapTooltip label={isExpanded ? "Collapse" : "Expand"}>
		<Button
			type="button"
			size="icon-sm"
			variant="outline"
			aria-label={
				isExpanded ? "Collapse the ontology" : "Expand the ontology"
			}
			onClick={onToggle}
		>
			{isExpanded ? (
				<Minimize2 aria-hidden="true" />
			) : (
				<Maximize2 aria-hidden="true" />
			)}
		</Button>
	</MapTooltip>
);
