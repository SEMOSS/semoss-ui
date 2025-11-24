import { Env, useIteratorPixel } from "@semoss/sdk/react";
import type { Engine } from "@semoss/shared";
import { Button, CommandGroup, CommandItem, Spinner } from "@semoss/ui/next";

const LIMIT = 3;

interface PlatformSearchEngineProps {
	/** Name of the group */
	name: string;

	/** Types of engines to pre-filter on */
	type: Engine["app_type"];

	/** Search to filter on */
	search: string;

	/** Callback when an app is selected */
	onSelect: (engine: Engine) => void;
}

export const PlatformSearchEngine = ({
	name,
	type,
	search,
	onSelect,
}: PlatformSearchEngineProps) => {
	/**
	 * Get all of the engines with lazy loading
	 */
	const getEngines = useIteratorPixel<Engine[], Engine>(
		(limit, offset) => {
			return `MyEngines(${search ? `filterWord=["<encode>${search}</encode>"], ` : ""} engineTypes=["${type}"], limit=[${limit}], offset=[${offset}]);`;
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
				return (
					<CommandItem
						key={engine.app_id}
						value={engine.app_id}
						onSelect={() => onSelect(engine)}
					>
						<img
							src={`${Env.MODULE}/api/e-${engine.app_id}/image/download`}
							alt={`${engine.app_name} icon`}
							className="size-8 object-contain"
						/>
						<div className="flex flex-1 flex-col truncate">
							<span>{engine.app_name}</span>
							{engine.description && (
								<span className="text-muted-foreground text-xs">
									{engine.description}
								</span>
							)}
						</div>
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
