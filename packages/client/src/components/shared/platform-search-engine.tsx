import { ExternalLinkIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIteratorPixel } from "@semoss/sdk/react";
import type { Engine } from "@semoss/shared";
import { Button, CommandGroup, CommandItem, Spinner } from "@semoss/ui/next";
import { getEngineSubtypeIcon } from "./platform-search-icon-utils";

const LIMIT = 5;

interface PlatformSearchEngineProps {
	/** Name of the group */
	name: string;

	/** Types of engines to pre-filter on */
	type: Engine["engine_type"] | "GUARDRAIL";

	/** Search to filter on */
	search: string;

	/** Callback when an engine is selected */
	onSelect: (engine: Engine) => void;
}

export const PlatformSearchEngine = ({
	name,
	type,
	search,
	onSelect,
}: PlatformSearchEngineProps) => {
	const navigate = useNavigate();

	/**
	 * Get all of the engines with lazy loading
	 */
	const getEngines = useIteratorPixel<Engine[], Engine>(
		(limit, offset) => {
			return `MyEngines(${search ? `filterWord=["${search}"], ` : ""} engineTypes=["${type}"], limit=[${limit}], offset=[${offset}]);`;
		},
		(response) => {
			// if its less than the limit, we know its the end
			if (response.length < LIMIT) {
				return -1;
			}

			return Infinity;
		},
		(response) => {
			return response;
		},
		{
			limit: LIMIT,
		},
		[search],
	);

	// don't show if there are none
	if (getEngines.data.length === 0) {
		return null;
	}

	return (
		<CommandGroup heading={name}>
			{getEngines.data.map((engine) => {
				const engineId = engine.engine_id;
				const engineName =
					engine.engine_display_name || engine.engine_name;
				const engineSubtype =
					engine.engine_subtype ||
					(
						engine as Engine & {
							database_subtype?: string;
							app_subtype?: string;
						}
					).database_subtype ||
					(
						engine as Engine & {
							database_subtype?: string;
							app_subtype?: string;
						}
					).app_subtype;
				const icon = getEngineSubtypeIcon(type, engineSubtype);
				return (
					<CommandItem
						key={engineId}
						value={engineId}
						className="group rounded-md px-2 py-2.5"
						onSelect={() => {
							// manually navigate since it doesn't propagate with a link
							navigate(
								`/engine/${type.toLowerCase()}/${engineId}`,
							);

							// close it
							onSelect(engine);
						}}
					>
						<img
							src={icon}
							alt={`${engineName} icon`}
							className="size-8 shrink-0 object-contain"
						/>
						<div className="flex flex-1 flex-col truncate">
							<span className="truncate font-medium text-sm">
								{engineName}
							</span>
							<span className="truncate text-[11px] text-muted-foreground">
								{engineId}
							</span>
							{engine.description && (
								<span className="line-clamp-1 text-[11px] text-muted-foreground">
									{engine.description}
								</span>
							)}
						</div>
						<a
							className="rounded-sm p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
							target="_blank"
							href={`./#/engine/${type.toLowerCase()}/${engineId}`}
							onClick={(e) => {
								e.stopPropagation();
							}}
						>
							<ExternalLinkIcon />
						</a>
					</CommandItem>
				);
			})}

			{/* Loading more indicator */}
			{getEngines.isLoading && getEngines.data.length > 0 && (
				<div className="flex items-center justify-center p-2">
					<Spinner className="size-4" />
				</div>
			)}
			{!getEngines.isLoading && getEngines.hasMore && (
				<div className="flex items-center justify-center">
					<Button
						className="h-7 rounded-md text-muted-foreground text-xs"
						size="sm"
						variant="ghost"
						onClick={() => getEngines.next()}
					>
						Load more
					</Button>
				</div>
			)}
		</CommandGroup>
	);
};
