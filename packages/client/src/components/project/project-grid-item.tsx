import {
	Bookmark,
	BookmarkCheck,
	Copy,
	Info,
	LockKeyhole,
	LockKeyholeOpen,
	Trash2,
} from "lucide-react";
import { AppCatalogAvatar, type Project } from "@semoss/shared";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { CatalogGridItem } from "@/components/catalog";
import { normalizeTagArray } from "@/utility";

export interface ProjectGridItemProps {
	/** Display style - list row or grid card */
	variant: "LIST" | "CARD";
	/** Path to navigate to */
	path: string;
	/** The project data to display */
	project: Project;
	/** Whether this project is favorited */
	isFavorited: boolean;
	/** Show the favorite/bookmark button */
	showFavorite: boolean;
	/** Show the global toggle button (e.g., in admin mode) */
	showGlobal: boolean;
	/** Show the ability to clone */
	showClone: boolean;
	/** Override whether the user can delete (defaults to owner permission check) */
	showDelete: boolean;
	/** Show the info button */
	showInfo?: boolean;
	/** Callback when favorite/bookmark is toggled (required if showFavorite is true) */
	onFavorite: (project: Project) => void;
	/** Callback when info button is clicked */
	onInfo: (project: Project) => void;
	/** Callback when global toggle is clicked */
	onGlobal: (project: Project) => void;
	/** Callback when delete is requested */
	onDelete: (project: Project) => void;
	/** Callback when clone is requested */
	onClone: (project: Project) => void;
}

/**
 * Unified project card component for catalog views.
 * Renders as either a row card or grid card based on gridStyle.
 */
export const ProjectGridItem: React.FC<ProjectGridItemProps> = ({
	path,
	project,
	variant,
	isFavorited = false,
	showFavorite = true,
	showGlobal = true,
	showClone = true,
	showDelete = true,
	showInfo = true,
	onInfo,
	onFavorite,
	onGlobal,
	onDelete,
	onClone,
}) => {
	const displayName = project.project_display_name || project.project_name;
	const projectTags = normalizeTagArray(project.tag);

	const menuItems: {
		icon: React.ReactNode;
		label: string;
		onClick: () => void;
	}[] = [];
	if (showClone) {
		menuItems.push({
			icon: <Copy />,
			label: "Clone",
			onClick: () => onClone(project),
		});
	}
	if (showDelete) {
		menuItems.push({
			icon: <Trash2 className="text-destructive" />,
			label: "Delete",
			onClick: () => onDelete(project),
		});
	}

	const actions = (
		<>
			{showInfo && (
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon-sm"
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								onInfo(project);
							}}
						>
							<Info className="size-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Open Details in a New Tab</TooltipContent>
				</Tooltip>
			)}
			{typeof project.project_global === "boolean" && showGlobal && (
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon-sm"
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								if (project.user_permission === 1) {
									onGlobal(project);
								}
							}}
							disabled={project.user_permission !== 1}
						>
							{project.project_global ? (
								<LockKeyholeOpen className="size-4 text-muted-foreground" />
							) : (
								<LockKeyhole className="size-4 text-muted-foreground" />
							)}
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						{project.project_global ? "Global" : "Private"}
					</TooltipContent>
				</Tooltip>
			)}
			{showFavorite && onFavorite && (
				<Button
					variant="ghost"
					size="icon-sm"
					title={
						isFavorited
							? `Unbookmark ${displayName}`
							: `Bookmark ${displayName}`
					}
					onClick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						onFavorite(project);
					}}
				>
					{isFavorited ? (
						<BookmarkCheck className="size-4 text-primary" />
					) : (
						<Bookmark className="size-4" />
					)}
				</Button>
			)}
		</>
	);

	const icon = (
		<AppCatalogAvatar
			name={displayName || project.project_id}
			className="h-full w-full rounded text-lg"
		/>
	);

	return (
		<CatalogGridItem
			variant={variant}
			path={path}
			name={displayName}
			description={project.description || ""}
			id={project.project_id}
			icon={icon}
			tags={projectTags}
			dateCreated={project.project_date_created || ""}
			dateLastEdited={project.project_date_last_edited || ""}
			actions={actions}
			menuItems={menuItems}
		/>
	);
};
