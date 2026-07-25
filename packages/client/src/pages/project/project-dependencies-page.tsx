import {
	Ban,
	Edit,
	Eye,
	Info,
	Pencil,
	TriangleAlert,
	User,
} from "lucide-react";
import { useState } from "react";
import type { Role } from "@semoss/shared";
import { AppCatalogAvatar, EngineSubtypeIcon } from "@semoss/shared";
import {
	Badge,
	Button,
	H4,
	Muted,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { CatalogGrid, CatalogGridItem } from "@/components/catalog";
import { EditProjectDependenciesDialog } from "@/components/project";
import { TYPE_TO_ROUTE } from "@/constants";
import { useProject } from "@/hooks";

const PERMISSION_ICONS = {
	OWNER: <User className="h-4 w-4 text-primary" />,
	READ_ONLY: <Eye className="h-4 w-4 text-primary" />,
	EDIT: <Edit className="h-4 w-4 text-primary" />,
	DISCOVERABLE: <Eye className="h-4 w-4 text-primary" />,
	NONE: <Ban className="h-4 w-4 text-primary" />,
};

type PermissionIconKey = Role | "NONE";
type DependencyKind = "engine" | "project";
type DependencyTypeConfig = {
	kind: DependencyKind;
	route: string;
};

const DEPENDENCY_TYPE_CONFIG = {
	PROJECT: { kind: "project", route: TYPE_TO_ROUTE.PROJECT },
	CODE: { kind: "project", route: TYPE_TO_ROUTE.CODE },
	BLOCKS: { kind: "project", route: TYPE_TO_ROUTE.BLOCKS },
	INSIGHT: { kind: "project", route: TYPE_TO_ROUTE.INSIGHT },
	SKILL: { kind: "project", route: TYPE_TO_ROUTE.SKILL },
	WORKSPACE: { kind: "project", route: TYPE_TO_ROUTE.WORKSPACE },
	FUNCTION: { kind: "engine", route: TYPE_TO_ROUTE.FUNCTION },
	MODEL: { kind: "engine", route: TYPE_TO_ROUTE.MODEL },
	DATABASE: { kind: "engine", route: TYPE_TO_ROUTE.DATABASE },
	VECTOR: { kind: "engine", route: TYPE_TO_ROUTE.VECTOR },
	STORAGE: { kind: "engine", route: TYPE_TO_ROUTE.STORAGE },
	GUARDRAIL: { kind: "engine", route: TYPE_TO_ROUTE.GUARDRAIL },
} satisfies Record<string, DependencyTypeConfig>;

const toCapitalized = (word: string): string => {
	if (!word) return "";
	return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
};

export const ProjectDependenciesPage = () => {
	const { project, dependencies, permission, refresh } = useProject();
	const [isOpen, setIsOpen] = useState(false);

	const canEdit = permission === "OWNER" || permission === "EDIT";

	return (
		<>
			<div className="flex w-full flex-col gap-3">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<H4 className="text-base">Dependencies</H4>
						{canEdit && (
							<Tooltip>
								<TooltipTrigger asChild>
									<span>
										<Info className="size-4 text-muted-foreground" />
									</span>
								</TooltipTrigger>
								<TooltipContent>
									{project?.project_type === "CODE"
										? "Add/Remove dependencies using the Edit Icon"
										: "Add/Remove dependencies using the Variables Tab"}
								</TooltipContent>
							</Tooltip>
						)}
					</div>

					{project?.project_type === "CODE" && canEdit && (
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsOpen(true)}
							data-testid="appDetail-edit-btn"
						>
							<Pencil className="size-4" />
						</Button>
					)}
				</div>

				<Muted>
					These are the resources (engines and apps) this project
					depends on. You need access to each of them for this project
					to work properly.
				</Muted>

				<CatalogGrid variant={"LIST"}>
					{dependencies.length === 0 ? (
						<div className="w-full px-2 py-4 text-center">
							<Muted>No dependencies found</Muted>
						</div>
					) : (
						dependencies.map((d) => {
							const permissionKey: PermissionIconKey =
								d.permission_name || "NONE";

							if (
								DEPENDENCY_TYPE_CONFIG[d.engine_type]?.kind ===
								"project"
							) {
								return (
									<CatalogGridItem
										key={d.engine_id}
										variant={"LIST"}
										path={`${DEPENDENCY_TYPE_CONFIG[d.engine_type].route}/${d.engine_id}`}
										name={d.engine_name}
										description={d.description || ""}
										id={d.engine_id}
										icon={
											<AppCatalogAvatar
												name={
													d.engine_name || d.engine_id
												}
												className="h-full w-full rounded text-lg"
											/>
										}
										tags={[]}
										dateCreated={""}
										dateLastEdited={""}
										actions={
											<>
												<Badge
													variant="outline"
													className="gap-1"
												>
													{
														PERMISSION_ICONS[
															permissionKey
														]
													}
													{toCapitalized(
														permissionKey,
													)}
												</Badge>
												{d.engine_global && (
													<Badge variant="outline">
														Public
													</Badge>
												)}
												{!d.engine_global &&
													d.engine_discoverable && (
														<Badge variant="outline">
															Discoverable
														</Badge>
													)}
												{!d.engine_global &&
													!d.engine_discoverable && (
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
													false && (
													<Tooltip>
														<TooltipTrigger asChild>
															<TriangleAlert className="size-4 shrink-0 text-warning" />
														</TooltipTrigger>
														<TooltipContent>
															{`You don't have access to all dependencies of this ${d.engine_type.toLowerCase()}, so functionality may be limited. View its details page for more information.`}
														</TooltipContent>
													</Tooltip>
												)}
											</>
										}
										menuItems={[]}
									/>
								);
							}

							return (
								<CatalogGridItem
									key={d.engine_id}
									variant={"LIST"}
									path={`${DEPENDENCY_TYPE_CONFIG[d.engine_type].route}/${d.engine_id}`}
									name={d.engine_name || ""}
									description={d.description || ""}
									id={d.engine_id}
									icon={
										<EngineSubtypeIcon
											engineType={d.engine_type}
											engineSubtype={d.engine_subtype}
											alt={d.engine_name}
											className="size-full object-contain drop-shadow-[0_1px_1px_rgba(0,0,0,0.08)]"
										/>
									}
									tags={[]}
									dateCreated={""}
									dateLastEdited={""}
									actions={
										<>
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
											{d.engine_global && (
												<Badge variant="outline">
													Public
												</Badge>
											)}
											{!d.engine_global &&
												d.engine_discoverable && (
													<Badge variant="outline">
														Discoverable
													</Badge>
												)}
											{!d.engine_global &&
												!d.engine_discoverable && (
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
												false && (
												<Tooltip>
													<TooltipTrigger asChild>
														<TriangleAlert className="size-4 shrink-0 text-warning" />
													</TooltipTrigger>
													<TooltipContent>
														{`You don't have access to all dependencies of this ${d.engine_type.toLowerCase()}, so functionality may be limited. View its details page for more information.`}
													</TooltipContent>
												</Tooltip>
											)}
										</>
									}
									menuItems={[]}
								/>
							);
						})
					)}
				</CatalogGrid>
			</div>

			<EditProjectDependenciesDialog
				dependencies={dependencies}
				open={isOpen}
				onClose={(success) => {
					if (success) {
						refresh();
					}
					setIsOpen(false);
				}}
				appId={project.project_id}
			/>
		</>
	);
};
