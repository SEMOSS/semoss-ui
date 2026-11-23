import {
	ArrowLeft,
	ArrowLeftRight,
	ArrowRight,
	Focus,
	type LucideIcon,
	Unlink,
	X,
} from "lucide-react";
import { useMemo } from "react";
import { PersonIdentity } from "@semoss/shared";
import {
	Button,
	Muted,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Spinner,
	Toggle,
	ToggleGroup,
	ToggleGroupItem,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { getAllUsers } from "@/api/auth";
import type {
	DependencyDirection,
	UserCatalogAccess,
} from "@/api/dependency-map";
import type { SETTINGS_MEMBER } from "@/components/settings/settings.types";
import { AgentRunFilterSelect } from "@/features/agent-runs/agent-run-filter-select";
import {
	type DependencyGraphIndex,
	findAccessGaps,
	summarizeImpact,
	traceGraph,
} from "./dependency-graph";
import { DependencyItemImage } from "./dependency-item-image";
import { MapOverlayCard } from "./map-overlay-card";
import { MapTooltip } from "./map-tooltip";
import type {
	DependencyMapViewChange,
	DependencyMapViewState,
} from "./use-dependency-map-view";

/** How many people the user picker lists for a search */
const USER_OPTION_LIMIT = 25;

/**
 * Reads the people the user picker lists, as an admin.
 *
 * @param search - What was typed.
 * @returns The first people matching it.
 */
const loadUsers = async (search: string): Promise<SETTINGS_MEMBER[]> =>
	// getAllUsers puts the search in the address as it is given
	(await getAllUsers(true, encodeURIComponent(search), 0, USER_OPTION_LIMIT))
		?.users ?? [];

const DIRECTIONS: readonly {
	value: DependencyDirection;
	label: string;
	icon: LucideIcon;
}[] = [
	{ value: "DEPENDENCIES", label: "What it uses", icon: ArrowRight },
	{ value: "DEPENDENTS", label: "What uses it", icon: ArrowLeft },
	{ value: "BOTH", label: "Both ways", icon: ArrowLeftRight },
];

interface DependencyMapViewBarProps {
	/** The network */
	index: DependencyGraphIndex;
	/** The view */
	view: DependencyMapViewState;
	/** Changes the view */
	onViewChange: (change: DependencyMapViewChange) => void;
	/** Leaves the trace for the whole network */
	onStopTracing: () => void;
	/** The picked user's name, when known */
	userName: string;
	/** Records the picked user's name, for the picker */
	onUserNameChange: (name: string) => void;
	/** The picked user's access, or null while unknown or outside User Access */
	access: ReadonlyMap<string, UserCatalogAccess> | null;
	/** Whether the user's access is being read */
	isAccessLoading: boolean;
	/** Why the user's access could not be read, or null */
	accessError: string | null;
}

/**
 * The controls of the Trace and User Access views, on the canvas's top left.
 * They are icons with their names in tooltips, over one line saying what the
 * view shows. The All view has none, so the map renders nothing for it.
 */
export const DependencyMapViewBar = ({
	index,
	view,
	onViewChange,
	onStopTracing,
	userName,
	onUserNameChange,
	access,
	isAccessLoading,
	accessError,
}: DependencyMapViewBarProps) => {
	const isTracing = view.lens === "trace" && view.traceRootId !== "";
	// the trace's reach by type, for the impact line
	const impact = useMemo(
		() =>
			isTracing
				? summarizeImpact(
						index,
						traceGraph(
							index,
							view.traceRootId,
							view.direction,
							view.depth,
						),
						view.traceRootId,
					)
				: [],
		[index, isTracing, view.traceRootId, view.direction, view.depth],
	);
	// the links the picked user can't follow
	const gapCount = useMemo(
		() => (access ? findAccessGaps(index, access).length : null),
		[index, access],
	);

	if (view.lens === "trace") {
		const root = index.nodes.get(view.traceRootId);
		if (!root) {
			return (
				<MapOverlayCard className="px-3">
					<Muted>
						Click an item in the ontology, or press Enter on it, to
						trace it.
					</Muted>
				</MapOverlayCard>
			);
		}
		const reached = impact.reduce((sum, entry) => sum + entry.count, 0);
		return (
			<MapOverlayCard className="flex max-w-xl flex-col gap-1">
				<div className="flex flex-wrap items-center gap-1">
					<span className="flex min-w-0 items-center gap-2 px-1">
						<DependencyItemImage node={root} className="size-5" />
						<span
							className="max-w-48 truncate font-medium text-sm"
							title={root.name}
						>
							{root.name}
						</span>
					</span>
					<ToggleGroup
						type="single"
						size="sm"
						variant="outline"
						aria-label="Trace direction"
						value={view.direction}
						onValueChange={(
							direction: DependencyDirection | "",
						) => {
							if (direction) {
								onViewChange({ direction });
							}
						}}
					>
						{DIRECTIONS.map(({ value, label, icon: Icon }) => (
							<Tooltip key={value}>
								<TooltipTrigger asChild>
									<ToggleGroupItem
										value={value}
										aria-label={label}
									>
										<Icon aria-hidden="true" />
									</ToggleGroupItem>
								</TooltipTrigger>
								<TooltipContent>{label}</TooltipContent>
							</Tooltip>
						))}
					</ToggleGroup>
					<Select
						value={view.depth === null ? "all" : String(view.depth)}
						onValueChange={(depth) =>
							onViewChange({
								depth: depth === "all" ? null : Number(depth),
							})
						}
					>
						<MapTooltip label="How many links to follow">
							<SelectTrigger
								size="sm"
								aria-label="Trace depth"
								className="w-24"
							>
								<SelectValue />
							</SelectTrigger>
						</MapTooltip>
						<SelectContent>
							<SelectItem value="1">1 link</SelectItem>
							<SelectItem value="2">2 links</SelectItem>
							<SelectItem value="3">3 links</SelectItem>
							<SelectItem value="all">All</SelectItem>
						</SelectContent>
					</Select>
					<MapTooltip label="Show only the traced items">
						<Toggle
							size="sm"
							variant="outline"
							aria-label="Show only the traced items"
							pressed={view.tracedOnly}
							onPressedChange={(tracedOnly) =>
								onViewChange({ tracedOnly })
							}
						>
							<Focus aria-hidden="true" />
						</Toggle>
					</MapTooltip>
					<MapTooltip label="Stop tracing">
						<Button
							type="button"
							size="icon-sm"
							variant="ghost"
							aria-label="Stop tracing"
							onClick={onStopTracing}
						>
							<X aria-hidden="true" />
						</Button>
					</MapTooltip>
				</div>
				<p
					className="px-1 text-muted-foreground text-xs"
					aria-live="polite"
				>
					{reached === 0
						? view.direction === "DEPENDENTS"
							? "Nothing uses this item."
							: view.direction === "DEPENDENCIES"
								? "This item uses nothing."
								: "This item has no links."
						: `${view.direction === "DEPENDENTS" ? "A change affects" : "Reaches"} ${reached.toLocaleString()}: ${impact
								.map((entry) => `${entry.count} ${entry.label}`)
								.join(", ")}`}
				</p>
			</MapOverlayCard>
		);
	}

	if (view.lens === "access") {
		return (
			<MapOverlayCard className="flex max-w-xl flex-col gap-1">
				<div className="flex flex-wrap items-center gap-1">
					<AgentRunFilterSelect<SETTINGS_MEMBER>
						label="User"
						allLabel="Pick a user"
						selectedLabel={
							view.userId ? userName || view.userId : null
						}
						selectedKey={view.userId || null}
						loadOptions={loadUsers}
						getOptionKey={(user) => user.id}
						renderOption={(user) => (
							<PersonIdentity
								name={user.name || user.username || user.id}
								type={user.type}
								id={user.id}
								email={user.email}
								isCompact={true}
							/>
						)}
						onSelect={(user) => {
							onUserNameChange(
								user
									? user.name || user.username || user.id
									: "",
							);
							onViewChange({ userId: user?.id ?? "" });
						}}
						searchPlaceholder="Search people"
					/>
					<MapTooltip label="Mark the links they can't follow">
						<Toggle
							size="sm"
							variant="outline"
							aria-label="Mark the links they can't follow"
							pressed={view.showGaps}
							disabled={!view.userId}
							onPressedChange={(showGaps) =>
								onViewChange({ showGaps })
							}
						>
							<Unlink aria-hidden="true" />
						</Toggle>
					</MapTooltip>
				</div>
				<output className="flex items-center gap-2 px-1 text-xs">
					{accessError ? (
						<span className="text-destructive">{accessError}</span>
					) : !view.userId ? (
						<span className="text-muted-foreground">
							Pick a user. What they can't use is dimmed.
						</span>
					) : isAccessLoading ? (
						<span className="flex items-center gap-2 text-muted-foreground">
							<Spinner className="size-3" />
							Reading their access...
						</span>
					) : access ? (
						<span className="text-muted-foreground">
							Can use {access.size.toLocaleString()} of{" "}
							{index.nodes.size.toLocaleString()}
							{gapCount
								? ` · ${gapCount.toLocaleString()} ${gapCount === 1 ? "link" : "links"} they can't follow`
								: ""}
						</span>
					) : null}
				</output>
			</MapOverlayCard>
		);
	}

	return null;
};
