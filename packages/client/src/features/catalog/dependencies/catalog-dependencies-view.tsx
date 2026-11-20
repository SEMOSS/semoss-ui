import {
	Ban,
	Edit,
	Eye,
	Info,
	Lock,
	Pencil,
	TriangleAlert,
	User,
} from "lucide-react";
import { useState } from "react";
import type { Role } from "@semoss/sdk";
import {
	AppCatalogAvatar,
	type CatalogDependencyRow,
	type CatalogType,
	EngineSubtypeIcon,
} from "@semoss/shared";
import {
	Badge,
	Button,
	H4,
	Muted,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { capitalize as toCapitalized } from "@semoss/utility/text";
import { CatalogGrid } from "@/components/catalog/catalog-grid";
import { CatalogGridItem } from "@/components/catalog/catalog-grid-item";
import {
	getDependencyKey,
	getDependencyRoleLabel,
	getDependencyTypeConfig,
} from "./catalog-dependency";
import { EditCatalogDependenciesDialog } from "./edit-catalog-dependencies-dialog";

const PERMISSION_ICONS: Record<Role | "NONE", React.ReactNode> = {
	OWNER: <User className="size-4 text-primary" aria-hidden="true" />,
	READ_ONLY: <Eye className="size-4 text-primary" aria-hidden="true" />,
	EDIT: <Edit className="size-4 text-primary" aria-hidden="true" />,
	DISCOVERABLE: <Eye className="size-4 text-primary" aria-hidden="true" />,
	NONE: <Ban className="size-4 text-primary" aria-hidden="true" />,
};

interface CatalogDependenciesViewProps {
	/** The owner's id */
	catalogId: string;
	/** The owner's specific type */
	catalogType: CatalogType;
	/** Whether the user can edit the owner's dependencies here */
	canEdit: boolean;
	/** Explains how the dependencies are edited, or why they cannot be here */
	editHint?: string;
	/**
	 * The owner's direct dependencies, automatic and manual, one row per
	 * target and role
	 */
	dependencies: CatalogDependencyRow[];
	/** Reads the dependencies again after an edit is saved */
	onRefresh: () => void;
}

/**
 * The list of the engines and projects an engine or a project depends on:
 * one row per dependency and role with the user's access to it, and, for
 * editors, the edit dialog. Automatic rows come from the owner's
 * configuration and are read-only, with their role and the backend's
 * description; manual rows show the name and description a user gave them,
 * and only they are edited.
 */
export const CatalogDependenciesView = ({
	catalogId,
	catalogType,
	canEdit,
	editHint,
	dependencies,
	onRefresh,
}: CatalogDependenciesViewProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const ownerLabel = getDependencyTypeConfig(catalogType).label.toLowerCase();
	const automaticNote = `Set by this ${ownerLabel}'s configuration. Change the configuration to change it.`;
	const hasAutomatic = dependencies.some((d) => d.is_automatic);

	return (
		<>
			<div className="flex w-full flex-col gap-3">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<H4 className="text-base">Dependencies</H4>
						{editHint ? (
							<Tooltip disableHoverableContent={false}>
								<TooltipTrigger asChild>
									<button
										type="button"
										aria-label={editHint}
										className="text-muted-foreground"
									>
										<Info
											className="size-4"
											aria-hidden="true"
										/>
									</button>
								</TooltipTrigger>
								<TooltipContent>{editHint}</TooltipContent>
							</Tooltip>
						) : null}
					</div>

					{canEdit ? (
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsOpen(true)}
							aria-label="Edit dependencies"
							data-testid="catalogDependenciesView-edit-btn"
						>
							<Pencil className="size-4" aria-hidden="true" />
						</Button>
					) : null}
				</div>

				<Muted>
					These are the resources (engines and apps) this {ownerLabel}{" "}
					depends on. You need access to each of them for this{" "}
					{ownerLabel} to work properly.
					{hasAutomatic
						? ` Automatic dependencies come from this ${ownerLabel}'s configuration and can only be changed there.`
						: null}
				</Muted>

				<CatalogGrid variant="LIST">
					{dependencies.length === 0 ? (
						<div className="w-full px-2 py-4 text-center">
							<Muted>No dependencies found</Muted>
						</div>
					) : (
						dependencies.map((d) => {
							const config = getDependencyTypeConfig(
								d.catalog_type,
							);
							const permissionKey = d.permission_name || "NONE";
							const name = d.catalog_name || d.catalog_id;
							const roleLabel = getDependencyRoleLabel(d.role);

							return (
								<CatalogGridItem
									key={getDependencyKey(d)}
									variant="LIST"
									path={`${config.route}/${d.catalog_id}`}
									name={name}
									description={
										d.dependency_description ||
										d.description ||
										""
									}
									id={d.catalog_id}
									icon={
										config.kind === "project" ? (
											<AppCatalogAvatar
												projectId={d.catalog_id}
												name={name}
												className="h-full w-full rounded text-lg"
											/>
										) : (
											<EngineSubtypeIcon
												engineType={d.catalog_type}
												engineSubtype={
													d.catalog_subtype
												}
												alt={name}
												className="size-full object-contain drop-shadow-[0_1px_1px_rgba(0,0,0,0.08)]"
											/>
										)
									}
									tags={[]}
									dateCreated=""
									dateLastEdited=""
									actions={
										<>
											{d.is_automatic ? (
												<Tooltip
													disableHoverableContent={
														false
													}
												>
													<TooltipTrigger asChild>
														<Badge
															asChild
															variant="secondary"
															className="gap-1"
														>
															<button
																type="button"
																aria-label={`${roleLabel}, automatic. ${automaticNote}`}
															>
																<Lock
																	className="size-3"
																	aria-hidden="true"
																/>
																{roleLabel}
															</button>
														</Badge>
													</TooltipTrigger>
													<TooltipContent>
														{automaticNote}
													</TooltipContent>
												</Tooltip>
											) : d.dependency_name ? (
												<Badge
													variant="secondary"
													className="max-w-40"
													title={d.dependency_name}
												>
													<span className="truncate">
														{d.dependency_name}
													</span>
												</Badge>
											) : null}
											<Badge variant="outline">
												{config.label}
											</Badge>
											<Badge
												variant="outline"
												className="gap-1"
											>
												{
													PERMISSION_ICONS[
														permissionKey
													]
												}
												{toCapitalized(permissionKey)}
											</Badge>
											{d.catalog_global ? (
												<Badge variant="outline">
													Public
												</Badge>
											) : d.catalog_discoverable ? (
												<Badge variant="outline">
													Discoverable
												</Badge>
											) : (
												<>
													<Badge variant="outline">
														Non-Discoverable
													</Badge>
													<Badge variant="outline">
														Private
													</Badge>
												</>
											)}
											{d.can_view_dependencies ===
											false ? (
												<Tooltip
													disableHoverableContent={
														false
													}
												>
													<TooltipTrigger asChild>
														<TriangleAlert
															className="size-4 shrink-0 text-warning"
															aria-label="Missing access to its dependencies"
														/>
													</TooltipTrigger>
													<TooltipContent>
														{`You don't have access to all dependencies of this ${config.label.toLowerCase()}, so functionality may be limited. View its details page for more information.`}
													</TooltipContent>
												</Tooltip>
											) : null}
										</>
									}
									menuItems={[]}
								/>
							);
						})
					)}
				</CatalogGrid>
			</div>

			{canEdit && isOpen ? (
				<EditCatalogDependenciesDialog
					catalogId={catalogId}
					catalogType={catalogType}
					dependencies={dependencies.filter((d) => !d.is_automatic)}
					onClose={(saved) => {
						if (saved) {
							onRefresh();
						}
						setIsOpen(false);
					}}
				/>
			) : null}
		</>
	);
};
