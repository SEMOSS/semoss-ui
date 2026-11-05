import { ExternalLink } from "lucide-react";
import { Link, useSearchParams } from "react-router";
import { useConfig } from "@semoss/sdk/react";
import {
	Button,
	Card,
	H3,
	Muted,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@semoss/ui/next";
import { formatLocalDateTime } from "@semoss/utility/date";
import { PendingMembersTable } from "@/components/settings/pending-members-table";
import { SettingsTiles } from "@/components/settings/settings-tiles";
import { UpdateSMSS } from "@/components/settings/update-smss";
import { ResourceId } from "@/components/shared/resource-id";
import { ResourceAuditTrail } from "@/features/audit-trail/resource-audit-trail";
import { BulkAccessManagement } from "@/features/bulk-access-management/bulk-access-management";
import { useAdminResourceName } from "@/features/bulk-access-management/use-admin-resource-name";
import { EffectivePermissions } from "@/features/effective-permissions/effective-permissions";
import { ModelUsageLimitsCard } from "@/features/model-usage-limits/model-usage-limits-card";
import { getResourcePagePath } from "@/utility/catalog";
import { GovernanceResourceIcon } from "./governance-resource-icon";
import { GOVERNANCE_NOUNS, type GovernanceType } from "./governance-types";
import type { GovernanceResource } from "./use-governance-resources";

/** A tab of the details, and which resources have it. */
interface GovernanceTab {
	value: string;
	label: string;
	/** Whether a resource of this type has the tab */
	isAvailable?: (entry: GovernanceType) => boolean;
}

const TABS: readonly GovernanceTab[] = [
	{ value: "access", label: "Access" },
	{ value: "effective-permissions", label: "Effective Permissions" },
	{ value: "requests", label: "Requests" },
	{ value: "visibility", label: "Visibility" },
	{ value: "audit-trail", label: "Audit Trail" },
	{ value: "smss", label: "SMSS" },
	{
		value: "usage-limits",
		label: "Usage Limits",
		isAvailable: (entry) => entry.type === "MODEL",
	},
];

export interface GovernanceResourceDetailsProps {
	/** The resource's type */
	entry: GovernanceType;
	/** The resource's id */
	resourceId: string;
	/** The resource as the list read it, once it has */
	resource?: GovernanceResource;
	/** Called once the resource is deleted */
	onDeleted: () => void;
}

/**
 * Everything about one project or engine for an admin: who can use it, with
 * changes for many people staged and saved together, its effective
 * permissions, requests, visibility, audit trail and SMSS, and a model's usage
 * limits. The tab is kept in the address, so a link opens it.
 */
export const GovernanceResourceDetails = ({
	entry,
	resourceId,
	resource,
	onDeleted,
}: GovernanceResourceDetailsProps) => {
	const [searchParams, setSearchParams] = useSearchParams();
	const isDirectoryAvailable = useConfig(
		(state) => state.config?.msGraphLookup === true,
	);
	// a link straight to a resource opens before the list has read it
	const fetchedName = useAdminResourceName(
		entry.kind,
		resource ? "" : resourceId,
	);
	const name = resource?.name ?? fetchedName;
	const tabs = TABS.filter((tab) => tab.isAvailable?.(entry) ?? true);
	const requestedTab = searchParams.get("tab");
	const tab = tabs.some((option) => option.value === requestedTab)
		? (requestedTab as string)
		: "access";
	const target = { resourceType: entry.kind, id: resourceId } as const;
	const settingsType = entry.kind === "PROJECT" ? "PROJECT" : entry.type;
	const noun = GOVERNANCE_NOUNS[entry.kind].singular;
	const isModel = entry.type === "MODEL";
	const pagePath = getResourcePagePath(entry.kind, entry.type, resourceId);
	const dateCreated = formatLocalDateTime(
		resource?.dateCreated,
		"MMM D, YYYY",
	);

	const handleTabChange = (value: string) => {
		setSearchParams(
			(params) => {
				const next = new URLSearchParams(params);
				next.set("tab", value);
				return next;
			},
			{ replace: true },
		);
	};

	return (
		<Card className="flex flex-1 flex-col gap-0 border border-border/60 py-0">
			<div className="flex flex-col gap-3 border-border/60 border-b p-4 sm:flex-row sm:items-start sm:justify-between">
				<div className="flex min-w-0 items-center gap-3">
					<GovernanceResourceIcon
						entry={entry}
						resource={resource ?? { id: resourceId, name }}
						className="size-10"
					/>
					<div className="flex min-w-0 flex-col">
						<H3 className="truncate font-semibold text-lg">
							{name}
						</H3>
						<ResourceId id={resourceId} name={name} />
						<Muted className="text-xs">
							{[
								entry.label,
								resource?.createdBy
									? `Created by ${resource.createdBy}`
									: null,
								dateCreated,
							]
								.filter(Boolean)
								.join(" | ")}
						</Muted>
					</div>
				</div>
				{pagePath ? (
					<Button
						asChild
						variant="outline"
						size="sm"
						className="shrink-0"
					>
						<Link
							to={pagePath}
							target="_blank"
							rel="noopener noreferrer"
							aria-label={`Open ${name} (opens in a new tab)`}
						>
							<ExternalLink className="size-4" aria-hidden />
							Open
						</Link>
					</Button>
				) : null}
			</div>

			<Tabs
				value={tab}
				onValueChange={handleTabChange}
				className="flex min-h-0 flex-1 flex-col gap-0"
			>
				<div className="border-border/60 border-b px-4 py-2">
					<TabsList className="w-fit max-w-full flex-wrap">
						{tabs.map((option) => (
							<TabsTrigger
								key={option.value}
								value={option.value}
							>
								{option.label}
							</TabsTrigger>
						))}
					</TabsList>
				</div>
				<div className="flex-1 p-4">
					{/*
					 * Access stays mounted on every tab, so changes staged for
					 * this resource survive a look at another tab; moving to
					 * another resource asks first.
					 */}
					<TabsContent
						value="access"
						forceMount
						className="data-[state=inactive]:hidden"
					>
						<BulkAccessManagement
							key={resourceId}
							target={target}
							name={name}
							noun={noun}
							admin
							isDirectoryAvailable={isDirectoryAvailable}
							isModel={isModel}
							headingLevel={3}
						/>
					</TabsContent>
					<TabsContent value="effective-permissions">
						<EffectivePermissions
							key={resourceId}
							target={target}
							name={name}
							admin
							isModel={isModel}
							headingLevel={3}
						/>
					</TabsContent>
					<TabsContent value="requests">
						<PendingMembersTable
							type={settingsType}
							id={resourceId}
						/>
					</TabsContent>
					<TabsContent value="visibility">
						<SettingsTiles
							type={settingsType}
							name={noun}
							id={resourceId}
							direction="row"
							onDelete={onDeleted}
						/>
					</TabsContent>
					<TabsContent value="audit-trail">
						<ResourceAuditTrail
							scope={entry.kind}
							resourceId={resourceId}
						/>
					</TabsContent>
					<TabsContent value="smss">
						<UpdateSMSS type={settingsType} id={resourceId} />
					</TabsContent>
					{isModel ? (
						<TabsContent value="usage-limits">
							<ModelUsageLimitsCard engineId={resourceId} admin />
						</TabsContent>
					) : null}
				</div>
			</Tabs>
		</Card>
	);
};
