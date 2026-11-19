import {
	AppWindow,
	ArrowLeftFromLine,
	ArrowRightFromLine,
	ExternalLink,
	Eye,
	Inbox,
	ScrollText,
	UserCheck,
	Users,
	X,
} from "lucide-react";
import { type ReactNode, useMemo } from "react";
import { Link } from "react-router";
import {
	Badge,
	Button,
	cn,
	Muted,
	ScrollArea,
	Separator,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { formatDateTimeWithRelativeDay } from "@semoss/utility/date";
import type {
	DependencyGraphNode,
	UserCatalogAccess,
} from "@/api/dependency-map";
import { ResourceId } from "@/components/shared/resource-id";
import { getDependencyTypeConfig } from "@/features/catalog/dependencies/catalog-dependency";
import { getGovernancePath } from "@/features/resource-governance/governance-type-view";
import { getResourcePagePath } from "@/utility/catalog";
import {
	ACCESS_LEVEL_LABELS,
	ACCESS_SOURCE_LABELS,
	DEPENDENCY_FAMILIES,
	type DependencyGraphIndex,
	describeLink,
	getDependencyFamily,
	traceGraph,
} from "./dependency-graph";
import { DependencyItemImage } from "./dependency-item-image";
import { DependencyLinkList } from "./dependency-link-list";
import { useDependencyMapActions } from "./dependency-map-actions.context";

/** The Resource Governance tabs the Security tab links to, in its order. */
const SECURITY_LINKS = [
	{
		tab: "access",
		label: "Access",
		description: "Who can use it, and change their access",
		icon: Users,
	},
	{
		tab: "effective-permissions",
		label: "Effective Permissions",
		description:
			"Everyone's access and where it comes from: direct, a team, or public",
		icon: UserCheck,
	},
	{
		tab: "apps",
		label: "Apps",
		description: "Apps given a permission on this engine",
		icon: AppWindow,
		isEngineOnly: true,
	},
	{
		tab: "requests",
		label: "Access Requests",
		description: "Requests waiting for its owners",
		icon: Inbox,
	},
	{
		tab: "audit-trail",
		label: "Audit Trail",
		description: "Changes to it, its settings and its access",
		icon: ScrollText,
	},
	{
		tab: "visibility",
		label: "Visibility",
		description: "Whether it is public or discoverable",
		icon: Eye,
	},
] as const;

interface DependencyMapDrawerProps {
	/** The network */
	index: DependencyGraphIndex;
	/** The selected item */
	selectedId: string;
	/** The selected link, which wins over the item */
	selectedEdgeId: string;
	/** The picked user's access, or null when the User Access lens is off */
	access: ReadonlyMap<string, UserCatalogAccess> | null;
	/** Clears the selection, closing the drawer */
	onClose: () => void;
}

/**
 * Resource Governance's page for an item, at one of its tabs.
 *
 * @param node - The item.
 * @param tab - The tab.
 * @returns The path.
 */
const governancePath = (node: DependencyGraphNode, tab: string): string =>
	`${getGovernancePath(node.type === "INSIGHTS" ? "INSIGHT" : node.type, node.id)}?tab=${tab}`;

/**
 * The side drawer for the selected item or link, beside the canvas inside the
 * map, so it stays when the map is expanded. It does not block the map:
 * clicking another item shows that one, and clicking the empty canvas, Close
 * or Escape closes it. Nothing is shown while nothing is selected.
 *
 * An item shows its overview (description, facts, and how far a change to it
 * reaches), what it uses and what uses it, and a Security tab linking to its
 * access, effective permissions, requests, audit trail and visibility in
 * Resource Governance. A link shows both ends, its role and where it came from.
 */
export const DependencyMapDrawer = ({
	index,
	selectedId,
	selectedEdgeId,
	access,
	onClose,
}: DependencyMapDrawerProps) => {
	const { trace } = useDependencyMapActions();
	const edge = index.edges.get(selectedEdgeId);
	const node = edge ? undefined : index.nodes.get(selectedId);
	const isOpen = !!edge || !!node;

	// how far a change reaches, both ways, all the way
	const reach = useMemo(() => {
		if (!node) {
			return null;
		}
		return {
			affected:
				traceGraph(index, node.id, "DEPENDENTS", null).nodeIds.size - 1,
			needs:
				traceGraph(index, node.id, "DEPENDENCIES", null).nodeIds.size -
				1,
		};
	}, [index, node]);

	let title = "";
	let description = "";
	let body: ReactNode = null;

	if (edge) {
		const source = index.nodes.get(edge.source);
		const target = index.nodes.get(edge.target);
		const { role, origin } = describeLink(edge);
		const added = edge.dateAdded
			? formatDateTimeWithRelativeDay(edge.dateAdded)
			: "";
		title = "Link";
		description = `${source?.name ?? edge.source} uses ${target?.name ?? edge.target}`;
		body = (
			<div className="flex flex-col gap-4">
				<div className="flex flex-wrap gap-1">
					<Badge variant="secondary">{role}</Badge>
					<Badge variant="outline">{origin}</Badge>
					{edge.inCycle ? (
						<Badge
							variant="outline"
							className="border-warning text-warning"
						>
							Cycle
						</Badge>
					) : null}
				</div>
				{edge.name ? (
					<p className="font-medium text-sm">{edge.name}</p>
				) : null}
				<p className="text-muted-foreground text-sm">
					{edge.description ||
						(edge.isAutomatic
							? "Recorded from the item's configuration. Change the configuration to change it."
							: "No description")}
				</p>
				{edge.addedBy || added ? (
					<Muted>
						Added{edge.addedBy ? ` by ${edge.addedBy}` : ""}
						{added ? ` · ${added}` : ""}
					</Muted>
				) : null}
				<p className="text-sm">
					People who use {source?.name ?? edge.source} need access to{" "}
					{target?.name ?? edge.target} too.
				</p>
				<Separator />
				<DependencyLinkList
					title="From"
					links={[edge]}
					end="source"
					index={index}
				/>
				<DependencyLinkList
					title="To"
					links={[edge]}
					end="target"
					index={index}
				/>
			</div>
		);
	} else if (node) {
		const typeConfig = getDependencyTypeConfig(node.type);
		const family = DEPENDENCY_FAMILIES[getDependencyFamily(node.type)];
		const TypeIcon = typeConfig.icon;
		const uses = index.outgoing.get(node.id) ?? [];
		const usedBy = index.incoming.get(node.id) ?? [];
		const userAccess = access ? (access.get(node.id) ?? null) : undefined;
		const gaps =
			access && userAccess
				? uses.filter(
						(link) =>
							!access.has(link.target) &&
							index.nodes.get(link.target)?.missing !== true,
					)
				: [];
		const catalogPath = node.missing
			? null
			: getResourcePagePath(node.kind, node.type, node.id);
		const created = node.dateCreated
			? formatDateTimeWithRelativeDay(node.dateCreated)
			: "";
		title = node.name;
		description = `${typeConfig.label}${node.subtype ? ` · ${node.subtype}` : ""}`;
		body = (
			<div className="flex flex-col gap-4">
				<div className="flex flex-col gap-2">
					<ResourceId id={node.id} name={node.name} />
					<div className="flex flex-wrap gap-1">
						<Badge variant="outline" className="gap-1">
							<TypeIcon
								className={cn("size-3", family.textClass)}
								aria-hidden="true"
							/>
							{typeConfig.label}
						</Badge>
						{node.missing ? (
							<Badge variant="destructive">Deleted</Badge>
						) : null}
						{node.global ? (
							<Badge variant="secondary">Public</Badge>
						) : null}
						{node.discoverable ? (
							<Badge variant="secondary">Discoverable</Badge>
						) : null}
					</div>
				</div>
				<div className="flex flex-wrap gap-2">
					{catalogPath ? (
						<Button asChild size="sm">
							<Link to={catalogPath}>
								<ExternalLink aria-hidden="true" />
								Open in Catalog
							</Link>
						</Button>
					) : null}
					{(
						[
							[
								"DEPENDENCIES",
								"Trace what it uses",
								ArrowRightFromLine,
							],
							[
								"DEPENDENTS",
								"Trace what uses it",
								ArrowLeftFromLine,
							],
						] as const
					).map(([direction, label, Icon]) => (
						<Tooltip key={direction}>
							<TooltipTrigger asChild>
								<Button
									type="button"
									size="icon-sm"
									variant="outline"
									aria-label={label}
									onClick={() => trace(node.id, direction)}
								>
									<Icon aria-hidden="true" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>{label}</TooltipContent>
						</Tooltip>
					))}
				</div>
				{/* a new key per item, so each opens on its overview */}
				<Tabs key={node.id} defaultValue="overview">
					<TabsList className="w-full">
						<TabsTrigger value="overview">Overview</TabsTrigger>
						<TabsTrigger value="uses">
							Uses {uses.length}
						</TabsTrigger>
						<TabsTrigger value="used-by">
							Used by {usedBy.length}
						</TabsTrigger>
						{node.missing ? null : (
							<TabsTrigger value="security">Security</TabsTrigger>
						)}
					</TabsList>
					<TabsContent
						value="overview"
						className="flex flex-col gap-4 pt-2"
					>
						{node.missing ? (
							<p className="text-sm">
								This item was deleted, but {usedBy.length}{" "}
								{usedBy.length === 1
									? "item still lists"
									: "items still list"}{" "}
								it as a dependency. Open them from Used by to
								remove the link.
							</p>
						) : (
							<p className="text-muted-foreground text-sm">
								{node.description || "No description"}
							</p>
						)}
						{userAccess !== undefined ? (
							<div className="flex flex-col gap-1 rounded-md border p-3">
								<p className="font-medium text-sm">
									The picked user
								</p>
								<p className="text-sm">
									{userAccess
										? `${ACCESS_LEVEL_LABELS[userAccess.permission]} · ${ACCESS_SOURCE_LABELS[userAccess.source]}`
										: "Has no access"}
								</p>
								{gaps.length > 0 ? (
									<p className="text-destructive text-sm">
										Can't use {gaps.length} of the items
										this uses, so it may fail for them.
									</p>
								) : null}
							</div>
						) : null}
						<dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
							<div>
								<dt className="text-muted-foreground text-xs">
									Uses directly
								</dt>
								<dd>{uses.length}</dd>
							</div>
							<div>
								<dt className="text-muted-foreground text-xs">
									Used by directly
								</dt>
								<dd>{usedBy.length}</dd>
							</div>
							<div>
								<dt className="text-muted-foreground text-xs">
									Needs in all
								</dt>
								<dd>{reach?.needs ?? 0}</dd>
							</div>
							<div>
								<dt className="text-muted-foreground text-xs">
									A change affects
								</dt>
								<dd>{reach?.affected ?? 0}</dd>
							</div>
							{node.createdBy ? (
								<div>
									<dt className="text-muted-foreground text-xs">
										Created by
									</dt>
									<dd className="break-words">
										{node.createdBy}
									</dd>
								</div>
							) : null}
							{created ? (
								<div>
									<dt className="text-muted-foreground text-xs">
										Created
									</dt>
									<dd>{created}</dd>
								</div>
							) : null}
						</dl>
						{gaps.length > 0 ? (
							<DependencyLinkList
								title="Uses but the user can't"
								links={gaps}
								end="target"
								index={index}
							/>
						) : null}
					</TabsContent>
					<TabsContent value="uses" className="pt-2">
						<DependencyLinkList
							title="Uses"
							links={uses}
							end="target"
							index={index}
						/>
					</TabsContent>
					<TabsContent value="used-by" className="pt-2">
						<DependencyLinkList
							title="Used by"
							links={usedBy}
							end="source"
							index={index}
						/>
					</TabsContent>
					{node.missing ? null : (
						<TabsContent value="security" className="pt-2">
							<p className="pb-2 text-muted-foreground text-sm">
								Opens Resource Governance in a new tab, so the
								map stays here.
							</p>
							<ul className="flex flex-col gap-1">
								{SECURITY_LINKS.filter(
									(link) =>
										!("isEngineOnly" in link) ||
										node.kind === "ENGINE",
								).map(
									({
										tab,
										label,
										description: linkDescription,
										icon: Icon,
									}) => (
										<li key={tab}>
											<Link
												to={governancePath(node, tab)}
												target="_blank"
												rel="noopener noreferrer"
												className="flex items-start gap-3 rounded-md p-2 hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
											>
												<Icon
													className="mt-0.5 size-4 shrink-0 text-muted-foreground"
													aria-hidden="true"
												/>
												<span className="flex min-w-0 flex-1 flex-col">
													<span className="font-medium text-sm">
														{label}
														<span className="sr-only">
															{" "}
															(opens in a new tab)
														</span>
													</span>
													<span className="text-muted-foreground text-xs">
														{linkDescription}
													</span>
												</span>
												<ExternalLink
													className="size-3.5 shrink-0 text-muted-foreground"
													aria-hidden="true"
												/>
											</Link>
										</li>
									),
								)}
							</ul>
						</TabsContent>
					)}
				</Tabs>
			</div>
		);
	}

	if (!isOpen) {
		return null;
	}
	return (
		<aside
			aria-label={edge ? description : title}
			className="slide-in-from-right flex size-full min-h-0 animate-in flex-col border-l bg-background duration-300"
		>
			<div className="flex min-w-0 items-center gap-3 border-b p-4">
				{node ? (
					<DependencyItemImage node={node} className="size-10" />
				) : null}
				<div className="flex min-w-0 flex-1 flex-col gap-0.5">
					<h4 className="break-words font-semibold text-base text-foreground leading-snug">
						{title}
					</h4>
					<Muted className="break-words">{description}</Muted>
				</div>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							type="button"
							size="icon-sm"
							variant="ghost"
							aria-label="Close details"
							onClick={onClose}
						>
							<X aria-hidden="true" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Close (Esc)</TooltipContent>
				</Tooltip>
			</div>
			<ScrollArea className="min-h-0 flex-1">
				<div className="p-4">{body}</div>
			</ScrollArea>
		</aside>
	);
};
