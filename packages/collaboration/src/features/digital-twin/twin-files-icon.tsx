import { FolderOpen } from "lucide-react";
import { cn } from "@semoss/ui/next";
import type { AppIcon } from "@/components/common/app-icons";

/** The twin's collected files, shared by its navigation and section heading. */
export const TwinFilesIcon: AppIcon = ({ className }) => (
	<FolderOpen
		aria-hidden="true"
		className={cn(
			"size-4 shrink-0 fill-primary/25 text-primary",
			className,
		)}
	/>
);
