import { Sparkles } from "lucide-react";
import { cn } from "@semoss/ui/next";
import type { AppIcon } from "@/components/common/app-icons";

/**
 * The mark of Find with AI where the places are listed: the lens of its
 * search scene in miniature, filled as the apps' logos beside it are, so it
 * does not read as the one plain entry among them. Its blend is the scene's
 * own, a deliberate exception to DESIGN.md's no-gradients rule.
 */
export const TwinFinderIcon: AppIcon = ({ className }) => (
	<span
		aria-hidden="true"
		className={cn(
			"grid size-4 shrink-0 place-items-center rounded-full bg-linear-to-br from-primary to-chart-2 text-primary-foreground",
			className,
		)}
	>
		<Sparkles className="size-2.5" fill="currentColor" />
	</span>
);
