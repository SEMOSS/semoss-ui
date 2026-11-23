import {
	AppWindow,
	ArrowDown,
	ArrowDownToLine,
	ArrowUp,
	ArrowUpFromLine,
	ExternalLink,
	Eye,
	Inbox,
	ScrollText,
	TriangleAlert,
	UserCheck,
	Users,
} from "lucide-react";
import { type ReactNode, useMemo } from "react";
import { Link } from "react-router";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
	Badge,
	Button,
	ButtonGroup,
	Item,
	ItemActions,
	ItemContent,
	ItemMedia,
	ItemTitle,
	Muted,
	Separator,
} from "@semoss/ui/next";
import { formatDateTimeWithRelativeDay } from "@semoss/utility/date";
import type {
	DependencyDirection,
	UserCatalogAccess,
} from "@/api/dependency-map";
import { ResourceId } from "@/components/shared/resource-id";
import { getGovernancePath } from "@/features/resource-governance/governance-type-view";
import { getResourcePagePath } from "@/utility/catalog";
import { DependencyDrawer } from "./dependency-drawer";
import {
	ACCESS_LEVEL_LABELS,
	ACCESS_SOURCE_LABELS,
	type DependencyGraphIndex,
	describeLink,
	traceGraph,
} from "./dependency-graph";
import { DependencyItemImage } from "./dependency-item-image";
import { DependencyLinkList } from "./dependency-link-list";
import { DrawerItemMeta } from "./drawer-item-meta";
import { focusCanvasItem } from "./focus-canvas-item";
import { MapTooltip } from "./map-tooltip";

/** The Resource Governance tabs the Security tab links to, in its order. */
const SECURITY_LINKS = [
	{
		tab: "access",
		label: "Access",
		icon: Users,
	},
	{
		tab: "effective-permissions",
		label: "Effective Permissions",
		icon: UserCheck,
	},
	{
		tab: "apps",
		label: "Apps",
		icon: AppWindow,
		isEngineOnly: true,
	},
	{
		tab: "requests",
		label: "Access Requests",
		icon: Inbox,
	},
	{
		tab: "audit-trail",
		label: "Audit Trail",
		icon: ScrollText,
	},
	{
		tab: "visibility",
		label: "Visibility",
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
	/** Traces what an item uses or what uses it */
	onTrace: (id: string, direction: DependencyDirection) => void;
	/** Centers the canvas on an item and selects it */
	onJump: (id: string) => void;
	/** Opens a link in the drawer */
	onSelectEdge: (id: string) => void;
}

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
	onTrace,
	onJump,
	onSelectEdge,
}: DependencyMapDrawerProps) => {
	const edge = index.edges.get(selectedEdgeId);
	const node = edge ? undefined : index.nodes.get(selectedId);
	const isOpen = !!edge || !!node;
	const openId = edge?.id ?? node?.id ?? "";

	/** Closes the drawer and puts focus back on the item or link it showed. */
	const handleClose = (): void => {
		onClose();
		requestAnimationFrame(() => focusCanvasItem(openId));
	};

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
	// a link's ends, under its title
	let description = "";
	// under an item's name: its type and how visible it is
	let headerMeta: ReactNode = null;
	// the item's actions, as icon buttons beside Close
	let headerActions: ReactNode = null;
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
			<div className="flex flex-col gap-4 pt-4">
				<div className="flex flex-wrap gap-1">
					<Badge variant="secondary">{role}</Badge>
					<Badge variant="outline">{origin}</Badge>
					{edge.inCycle ? (
						<Badge variant="outline" className="gap-1">
							<TriangleAlert
								className="size-3 text-warning"
								aria-hidden="true"
							/>
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
				<section aria-label="From" className="flex flex-col gap-2">
					<p className="font-medium text-sm">From</p>
					<DependencyLinkList
						links={[edge]}
						end="source"
						index={index}
						onJump={onJump}
						onSelectEdge={onSelectEdge}
					/>
				</section>
				<section aria-label="To" className="flex flex-col gap-2">
					<p className="font-medium text-sm">To</p>
					<DependencyLinkList
						links={[edge]}
						end="target"
						index={index}
						onJump={onJump}
						onSelectEdge={onSelectEdge}
					/>
				</section>
			</div>
		);
	} else if (node) {
		const uses = index.outgoing.get(node.id) ?? [];
		const usedBy = index.incoming.get(node.id) ?? [];
		const userAccess = access ? (access.get(node.id) ?? null) : undefined;
		// the links out of this item the picked user can't follow, as
		// findAccessGaps finds them: links to deleted items are left out
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
		const upstream = reach?.needs ?? 0;
		const downstream = reach?.affected ?? 0;
		headerMeta = (
			<DrawerItemMeta
				key={node.id}
				type={node.type}
				subtype={node.subtype}
			>
				{node.missing ? (
					<Badge variant="destructive">Deleted</Badge>
				) : null}
				{node.global ? <Badge variant="secondary">Public</Badge> : null}
				{node.discoverable ? (
					<Badge variant="secondary">Discoverable</Badge>
				) : null}
			</DrawerItemMeta>
		);
		const traceUpstreamLabel = upstream
			? `Trace upstream (${upstream})`
			: "Uses nothing";
		const traceDownstreamLabel = downstream
			? `Trace downstream (${downstream})`
			: "Nothing uses it";
		headerActions = (
			<ButtonGroup aria-label="Item actions">
				{catalogPath ? (
					<MapTooltip label="Open in Catalog">
						<Button asChild size="icon-sm" variant="ghost">
							<Link
								to={catalogPath}
								target="_blank"
								rel="noopener noreferrer"
								aria-label="Open in Catalog (opens in a new tab)"
							>
								<ExternalLink aria-hidden="true" />
							</Link>
						</Button>
					</MapTooltip>
				) : null}
				<MapTooltip label={traceUpstreamLabel}>
					{/* a span keeps the tooltip on a disabled button */}
					<span>
						<Button
							type="button"
							size="icon-sm"
							variant="ghost"
							aria-label={traceUpstreamLabel}
							disabled={upstream === 0}
							onClick={() => onTrace(node.id, "DEPENDENCIES")}
						>
							<ArrowUpFromLine aria-hidden="true" />
						</Button>
					</span>
				</MapTooltip>
				<MapTooltip label={traceDownstreamLabel}>
					<span>
						<Button
							type="button"
							size="icon-sm"
							variant="ghost"
							aria-label={traceDownstreamLabel}
							disabled={downstream === 0}
							onClick={() => onTrace(node.id, "DEPENDENTS")}
						>
							<ArrowDownToLine aria-hidden="true" />
						</Button>
					</span>
				</MapTooltip>
			</ButtonGroup>
		);
		body = (
			// a new key per item, so each opens on its overview
			<Accordion
				key={node.id}
				type="multiple"
				defaultValue={["overview"]}
			>
				<AccordionItem value="overview">
					<AccordionTrigger>Overview</AccordionTrigger>
					<AccordionContent className="flex flex-col gap-4">
						<ResourceId id={node.id} name={node.name} />
						{node.missing ? (
							<p className="text-sm">
								This item was deleted, but {usedBy.length}{" "}
								{usedBy.length === 1
									? "item still lists"
									: "items still list"}{" "}
								it as a dependency. Open them from Lineage to
								remove the link.
							</p>
						) : (
							<p className="text-muted-foreground text-sm">
								{node.description || "No description"}
							</p>
						)}
						{userAccess !== undefined ? (
							<section
								aria-label="The picked user"
								className="flex flex-col gap-1 border-primary border-l-2 pl-3"
							>
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
							</section>
						) : null}
						{node.createdBy || created ? (
							<dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
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
						) : null}
						{gaps.length > 0 ? (
							<section
								aria-label="Uses but the user can't"
								className="flex flex-col gap-2"
							>
								<p className="font-medium text-sm">
									Uses but the user can't ({gaps.length})
								</p>
								<DependencyLinkList
									links={gaps}
									end="target"
									index={index}
									onJump={onJump}
									onSelectEdge={onSelectEdge}
								/>
							</section>
						) : null}
					</AccordionContent>
				</AccordionItem>
				<AccordionItem value="lineage">
					<AccordionTrigger
						aria-label={`Lineage, ${upstream} upstream, ${downstream} downstream`}
					>
						<span className="flex items-center gap-2">
							Lineage
							<Badge variant="secondary" className="gap-0.5">
								<ArrowUp
									className="size-3"
									aria-hidden="true"
								/>
								{upstream}
							</Badge>
							<Badge variant="secondary" className="gap-0.5">
								<ArrowDown
									className="size-3"
									aria-hidden="true"
								/>
								{downstream}
							</Badge>
						</span>
					</AccordionTrigger>
					<AccordionContent className="flex flex-col gap-4">
						<section
							aria-label="Upstream"
							className="flex flex-col gap-2"
						>
							<p className="flex items-baseline justify-between gap-2 text-sm">
								<span className="font-medium">Upstream</span>
								<span className="text-muted-foreground text-xs">
									{upstream} in all · {uses.length} directly
								</span>
							</p>
							<DependencyLinkList
								links={uses}
								end="target"
								index={index}
								onJump={onJump}
								onSelectEdge={onSelectEdge}
							/>
						</section>
						<section
							aria-label="Downstream"
							className="flex flex-col gap-2"
						>
							<p className="flex items-baseline justify-between gap-2 text-sm">
								<span className="font-medium">Downstream</span>
								<span className="text-muted-foreground text-xs">
									{downstream} in all · {usedBy.length}{" "}
									directly
								</span>
							</p>
							<DependencyLinkList
								links={usedBy}
								end="source"
								index={index}
								onJump={onJump}
								onSelectEdge={onSelectEdge}
							/>
						</section>
					</AccordionContent>
				</AccordionItem>
				{node.missing ? null : (
					<AccordionItem value="security">
						<AccordionTrigger>Security</AccordionTrigger>
						<AccordionContent>
							<ul
								aria-label="Open in Resource Governance"
								className="flex flex-col"
							>
								{SECURITY_LINKS.filter(
									(link) =>
										!("isEngineOnly" in link) ||
										node.kind === "ENGINE",
								).map(({ tab, label, icon: Icon }) => (
									<li key={tab}>
										<Item
											asChild
											size="sm"
											className="px-2"
										>
											<Link
												to={`${getGovernancePath(node.type === "INSIGHTS" ? "INSIGHT" : node.type, node.id)}?tab=${tab}`}
												target="_blank"
												rel="noopener noreferrer"
											>
												<ItemMedia variant="icon">
													<Icon aria-hidden="true" />
												</ItemMedia>
												<ItemContent>
													<ItemTitle>
														{label}
														<span className="sr-only">
															{" "}
															(opens in a new tab)
														</span>
													</ItemTitle>
												</ItemContent>
												<ItemActions>
													<ExternalLink
														className="size-3.5 text-muted-foreground"
														aria-hidden="true"
													/>
												</ItemActions>
											</Link>
										</Item>
									</li>
								))}
							</ul>
						</AccordionContent>
					</AccordionItem>
				)}
			</Accordion>
		);
	}

	if (!isOpen) {
		return null;
	}
	return (
		<DependencyDrawer
			label={edge ? description : title}
			title={title}
			description={edge ? description : undefined}
			media={
				node ? (
					<DependencyItemImage node={node} className="size-10" />
				) : null
			}
			actions={headerActions}
			meta={headerMeta}
			focusKey={openId}
			onClose={handleClose}
		>
			{body}
		</DependencyDrawer>
	);
};
