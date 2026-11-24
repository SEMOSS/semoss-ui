import {
	Archive,
	Blocks,
	Bolt,
	Bot,
	Box,
	Boxes,
	ChartColumn,
	CodeXml,
	Cpu,
	Database,
	type LucideIcon,
	NotebookText,
	Puzzle,
	ShieldCheck,
	Sigma,
	Workflow,
} from "lucide-react";
import { cn } from "@semoss/ui/next";

/**
 * Each type's icon: the sidebar's icon for its catalog, one for each kind of
 * app, and several boxes for a filter's choice of every type
 */
const TYPE_ICONS: Readonly<Record<string, LucideIcon>> = {
	ALL: Boxes,
	CODE: CodeXml,
	BLOCKS: Blocks,
	INSIGHT: ChartColumn,
	WORKSPACE: Bot,
	SKILL: Puzzle,
	NOTEBOOK: NotebookText,
	AUTOMATION: Workflow,
	DATABASE: Database,
	MODEL: Cpu,
	STORAGE: Archive,
	FUNCTION: Sigma,
	VECTOR: Bolt,
	GUARDRAIL: ShieldCheck,
};

/** Props for {@link CatalogTypeIcon}. */
export interface CatalogTypeIconProps {
	/**
	 * A project type, such as CODE, an engine type, such as MODEL, or ALL for a
	 * filter's choice of every type
	 */
	type: string;
	/** Size and color classes; it is small and muted unless these change it */
	className?: string;
}

/**
 * The icon of a project or engine type, shown beside the type's name wherever
 * a dropdown offers types: the sidebar's icon for its catalog, or one for each
 * kind of app, several boxes for All Types, and a box for a type with none. It
 * is decorative, since the name beside it says the type.
 */
export const CatalogTypeIcon = ({ type, className }: CatalogTypeIconProps) => {
	const Icon = TYPE_ICONS[type] ?? Box;
	return (
		<Icon
			className={cn("size-4 shrink-0 text-muted-foreground", className)}
			aria-hidden
		/>
	);
};
