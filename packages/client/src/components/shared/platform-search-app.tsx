import { ExternalLinkIcon } from "lucide-react";
import { useIteratorPixel } from "@semoss/sdk/react";
import type { App } from "@semoss/shared";
import { Button, CommandGroup, CommandItem, Spinner } from "@semoss/ui/next";
import { useNavigate } from "@/hooks/useNavigate";
import {
	buildInitials,
	getAppCatalogAvatarStyle,
} from "./platform-search-icon-utils";

const LIMIT = 5;

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
			return `MyProjects(${search ? `filterWord=["${search}"], ` : ""} limit=[${limit}], offset=[${offset}]);`;
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
				const appName =
					(app as App & { project_display_name?: string })
						.project_display_name || app.project_name;
				const initials = buildInitials(appName || "App");
				const avatarStyle = getAppCatalogAvatarStyle(appName || "App");

				return (
					<CommandItem
						key={app.project_id}
						value={app.project_id}
						className="group rounded-md px-2 py-2.5"
						onSelect={() => {
							// manually navigate since it doesn't propagate with a link
							navigate(`/app/${app.project_id}/view`);

							// close it
							onSelect(app);
						}}
					>
						<div
							className="flex size-8 shrink-0 items-center justify-center rounded-md font-semibold text-[11px]"
							style={avatarStyle}
						>
							{initials}
						</div>
						<div className="flex flex-1 flex-col truncate">
							<span className="truncate font-medium text-sm">
								{appName}
							</span>
							<span className="truncate text-[11px] text-muted-foreground">
								{app.project_id}
							</span>
							{app.description && (
								<span className="line-clamp-1 text-[11px] text-muted-foreground">
									{app.description}
								</span>
							)}
						</div>
						<a
							className="rounded-sm p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
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
						className="h-7 rounded-md text-muted-foreground text-xs"
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
