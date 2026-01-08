import { ExternalLinkIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Env, useIteratorPixel } from "@semoss/sdk/react";
import type { App } from "@semoss/shared";
import { Button, CommandGroup, CommandItem, Spinner } from "@semoss/ui/next";

const LIMIT = 3;

interface PlatformSearchAppProps {
	/** Name of the group */
	name: string;

	/** Search to filter on */
	search: string;

	/** Callback when an app is selected */
	onSelect: (app: App) => void;
}

export const PlatformSearchApp = ({
	name,
	search,
	onSelect,
}: PlatformSearchAppProps) => {
	const navigate = useNavigate();

	/**
	 * Get all of the engines with lazy loading
	 */
	const getApps = useIteratorPixel<App[], App>(
		(limit, offset) => {
			return `MyProjects(${search ? `filterWord=["<encode>${search}</encode>"], ` : ""} limit=[${limit}], offset=[${offset}]);`;
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
	if (getApps.data.length === 0) {
		return null;
	}

	return (
		<CommandGroup heading={name}>
			{getApps.data.map((app) => {
				return (
					<CommandItem
						key={app.project_id}
						value={app.project_id}
						onSelect={() => {
							// manually navigate since it doesn't propagate with a link
							navigate(`/app/${app.project_id}/view`);

							// close it
							onSelect(app);
						}}
					>
						<img
							src={`${Env.MODULE}/api/project-${app.project_id}/projectImage/download`}
							alt={`${app.project_name} icon`}
							className="size-8 object-contain"
						/>
						<div className="flex flex-1 flex-col truncate">
							<span>{app.project_name}</span>
							{app.description && (
								<span className="text-muted-foreground text-xs">
									{app.description}
								</span>
							)}
						</div>
						<a
							className=""
							target="_blank"
							href={`./#/app/${app.project_id}/view`}
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
			{getApps.isLoading && getApps.data.length > 0 && (
				<div className="flex items-center justify-center p-2">
					<Spinner className="size-4" />
				</div>
			)}
			{!getApps.isLoading && getApps.hasMore && (
				<div className="flex items-center justify-center">
					<Button
						className="text-muted-foreground text-xs"
						size="sm"
						variant="ghost"
						onClick={() => getApps.next()}
					>
						Load more
					</Button>
				</div>
			)}
		</CommandGroup>
	);
};
