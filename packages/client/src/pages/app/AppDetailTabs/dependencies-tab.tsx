import { Ban, Edit, Eye, Pencil, TriangleAlert, User } from "lucide-react";
import { Env } from "@semoss/sdk";
import { Link } from "@semoss/ui";
import {
	Badge,
	Button,
	Card,
	CardContent,
	H3,
	Muted,
	P,
	TabsContent,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import type { modelledDependency } from "@/components/app";
import { EngineAccessButton } from "@/components/engine";
import { EngineContext } from "@/contexts/EngineContext";
import type { ENGINE_TYPES, Role } from "@/types";

export const PERMISSION_ICONS = {
	OWNER: <User className="h-4 w-4 text-primary" />,
	READ_ONLY: <Eye className="h-4 w-4 text-primary" />,
	EDIT: <Edit className="h-4 w-4 text-primary" />,
	NONE: <Ban className="h-4 w-4 text-primary" />,
};

export const Dependencies = ({
	dependencies,
}: {
	dependencies: modelledDependency[];
}) => {
	const toCapitalized = (word: string): string => {
		if (!word) return "";
		return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
	};

	return (
		<div className="flex w-full flex-col gap-2">
			{dependencies.length === 0 ? (
				<P className="flex items-center justify-center text-muted-foreground">
					No Dependencies Found
				</P>
			) : (
				dependencies.map((dep) => {
					const permissionKey = dep.userPermission || "NONE";
					const missingSubDependencies =
						dep.can_view_dependencies === false;
					return (
						<div
							key={dep.id}
							className="flex w-full flex-col gap-2 rounded-xl border border-border bg-card p-2"
						>
							<div className="flex items-center gap-3">
								<img
									src={
										dep.type === "PROJECT"
											? `${Env.MODULE}/api/project-${dep.id}/projectImage/download`
											: `${Env.MODULE}/api/e-${dep.id}/image/download`
									}
									alt={dep.name}
									className="h-12 w-12 shrink-0 rounded-lg object-cover"
								/>
								<div className="flex min-w-0 flex-col">
									<div className="flex items-center gap-1.5">
										<Link
											href={
												dep.type === "PROJECT"
													? `./#/app/${dep.id}`
													: `./#/engine/${dep.type}/${dep.id}`
											}
											//className="text-base text-primary"
										>
											<P className="truncate">
												{dep.name}
											</P>
										</Link>
										{missingSubDependencies && (
											<Tooltip>
												<TooltipTrigger asChild>
													<TriangleAlert className="size-4 shrink-0 text-amber-500" />
												</TooltipTrigger>
												<TooltipContent>
													{`You don't have access to all dependencies of this ${dep.type.toLowerCase()}, so functionality may be limited. View its details page for more information.`}
												</TooltipContent>
											</Tooltip>
										)}
									</div>
									<div className="flex items-center gap-1">
										{PERMISSION_ICONS[permissionKey]}
										<Muted className="text-xs">
											{toCapitalized(
												dep.userPermission || "NONE",
											)}
										</Muted>
									</div>
								</div>
								<div className="ml-auto flex shrink-0 items-center gap-2">
									{dep.isPublic && (
										<Badge variant="outline">Public</Badge>
									)}
									{!dep.isPublic && dep.isDiscoverable && (
										<Badge variant="outline">
											Discoverable
										</Badge>
									)}
									{!dep.isPublic && !dep.isDiscoverable && (
										<>
											<Badge variant="outline">
												Non-Discoverable
											</Badge>
											<Badge variant="outline">
												Private
											</Badge>
										</>
									)}
									<Badge variant="outline">
										{toCapitalized(dep.type)}
									</Badge>
									<EngineContext.Provider
										value={{
											type: dep.type as ENGINE_TYPES,
											name: dep.name,
											path: "",
											active: {
												id: dep.id,
												role: dep.userPermission as Role,
												name: dep.name,
												metadata: {},
												refresh: () => {},
											},
										}}
									>
										<EngineAccessButton fromApp={true} />
									</EngineContext.Provider>
								</div>
							</div>

							<Muted className="ml-15 text-muted-foreground text-sm">
								{dep.description &&
								dep.description.trim() !== ""
									? dep.description
									: "No Description Available"}
							</Muted>
						</div>
					);
				})
			)}
		</div>
	);
};

interface DependenciesTabProps {
	dependencies: modelledDependency[];
	effectiveRole: Role | null;
	effectiveMetadata?: {
		project_name?: string;
		project_type?: string;
	};
	onEditClick: () => void;
}

export const DependenciesTab = ({
	dependencies,
	effectiveRole,
	effectiveMetadata,
	onEditClick,
}: DependenciesTabProps) => {
	return (
		<TabsContent value="dependencies" className="mt-0">
			<Card className="p-0 shadow-md">
				<CardContent className="p-6">
					<div className="space-y-6">
						<div>
							<div className="flex items-center gap-2">
								<H3 className="font-bold">Dependencies</H3>
								{effectiveMetadata?.project_type === "CODE" &&
									effectiveRole === "OWNER" && (
										<Button
											variant="ghost"
											size="icon"
											className="h-6 w-6"
											onClick={onEditClick}
										>
											<Pencil className="h-4 w-4" />
										</Button>
									)}
							</div>
							<Muted className="mt-1">
								{effectiveMetadata?.project_type === "CODE"
									? "Add/Remove dependencies using the Edit Icon"
									: "Add/Remove dependencies using the Variables Tab"}
							</Muted>
						</div>

						<Dependencies dependencies={dependencies} />
					</div>
				</CardContent>
			</Card>
		</TabsContent>
	);
};
