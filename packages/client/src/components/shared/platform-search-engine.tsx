import { ExternalLinkIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Env, useIteratorPixel } from "@semoss/sdk/react";
import type { Engine } from "@semoss/shared";
import { Button, CommandGroup, CommandItem, Spinner } from "@semoss/ui/next";

const LIMIT = 3;

interface PlatformSearchEngineProps {
	/** Name of the group */
	name: string;

	/** Types of engines to pre-filter on */
	type: Engine["engine_type"];

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
				return (
					<CommandItem
						key={engineId}
						value={engineId}
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
							src={`${Env.MODULE}/api/e-${engineId}/image/download`}
							alt={`${engineName} icon`}
							className="size-8 object-contain"
						/>
						<div className="flex flex-1 flex-col truncate">
							<span>{engineName}</span>
							{engine.description && (
								<span className="text-muted-foreground text-xs">
									{engine.description}
								</span>
							)}
						</div>
						<a
							className=""
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
						className="text-muted-foreground text-xs"
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
