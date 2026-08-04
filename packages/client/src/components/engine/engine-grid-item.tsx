import {
	Bookmark,
	BookmarkCheck,
	Info,
	LockKeyhole,
	LockKeyholeOpen,
	Trash2,
} from "lucide-react";
import { type Engine, EngineSubtypeIcon } from "@semoss/shared";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { CatalogGridItem } from "@/components/catalog";
import { normalizeTagArray } from "@/utility";

export interface EngineGridItemProps {
	/** Display style - list row or grid card */
	variant: "LIST" | "CARD";
	/** Path to navigate to */
	path: string;
	/** The engine data to display */
	engine: Engine;
	/** Whether this engine is favorited */
	isFavorited: boolean;
	/** Show the favorite/bookmark button (e.g., in admin mode) */
	showFavorite: boolean;
	/** Show the global toggle button (e.g., in admin mode) */
	showGlobal: boolean;
	/** Override whether the user can delete (defaults to owner permission check) */
	showDelete: boolean;
	/** Show the info button */
	showInfo?: boolean;
	/** Callback when favorite/bookmark is toggled */
	onFavorite: (engine: Engine) => void;
	/** Callback when info button is clicked */
	onInfo?: (engine: Engine) => void;
	/** Callback when global toggle is clicked */
	onGlobalToggle: (engine: Engine) => void;
	/** Callback when delete is requested */
	onDelete: (engine: Engine) => void;
}

/**
 * Unified engine card component for catalog views.
 * Renders as either a row card or grid card based on gridStyle.
 */
export const EngineGridItem: React.FC<EngineGridItemProps> = ({
	path,
	engine,
	variant,
	isFavorited,
	showFavorite = true,
	showGlobal = true,
	showDelete = true,
	showInfo = false,
	onFavorite,
	onInfo,
	onGlobalToggle,
	onDelete,
}) => {
	const engineName = engine.engine_display_name || engine.engine_name;
	const engineTags = normalizeTagArray(engine.tag);
	const menuItems = showDelete
		? [
				{
					icon: <Trash2 className="text-destructive" />,
					label: "Delete",
					onClick: () => onDelete(engine),
				},
			]
		: [];

	const actions = (
		<>
			{showInfo && onInfo && (
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon-sm"
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								onInfo(engine);
							}}
						>
							<Info className="size-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Open Details in a New Tab</TooltipContent>
				</Tooltip>
			)}
			{typeof engine.engine_global === "boolean" && showGlobal && (
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon-sm"
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								if (engine.engine_user_permission === 1) {
									onGlobalToggle(engine);
								}
							}}
							disabled={engine.engine_user_permission !== 1}
						>
							{engine.engine_global ? (
								<LockKeyholeOpen className="size-4 text-muted-foreground" />
							) : (
								<LockKeyhole className="size-4 text-muted-foreground" />
							)}
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						{engine.engine_global ? "Global" : "Private"}
					</TooltipContent>
				</Tooltip>
			)}
			{showFavorite && (
				<Button
					variant="ghost"
					size="icon-sm"
					title={
						isFavorited
							? `Unbookmark ${engineName}`
							: `Bookmark ${engineName}`
					}
					onClick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						onFavorite(engine);
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
		<EngineSubtypeIcon
			engineType={engine.engine_type || ""}
			engineSubtype={engine.engine_subtype}
			alt={engineName}
			className="size-full object-contain drop-shadow-[0_1px_1px_rgba(0,0,0,0.08)]"
		/>
	);

	return (
		<CatalogGridItem
			variant={variant}
			path={path}
			name={engineName}
			description={engine.description || ""}
			id={engine.engine_id}
			icon={icon}
			tags={engineTags}
			dateCreated={engine.engine_date_created || ""}
			dateLastEdited={engine.engine_date_last_edited || ""}
			actions={actions}
			menuItems={menuItems}
			options={{
				LIST: {},
				CARD: {
					background: "transparent",
				},
			}}
		/>
	);
};
