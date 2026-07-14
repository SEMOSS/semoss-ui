import {
	Ban,
	Check,
	Copy,
	Edit,
	ExternalLink,
	Eye,
	Pencil,
	TriangleAlert,
	User,
} from "lucide-react";
import { useState } from "react";
import { AppCatalogAvatar, EngineSubtypeIcon } from "@semoss/shared";
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
	const [copiedId, setCopiedId] = useState<string | null>(null);

	const toCapitalized = (word: string): string => {
		if (!word) return "";
		return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
	};

	const handleCopyId = (id: string) => {
		navigator.clipboard.writeText(id).then(() => {
			setCopiedId(id);
			setTimeout(() => {
				setCopiedId((current) => (current === id ? null : current));
			}, 1500);
		});
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
								{dep.type === "PROJECT" ? (
									<AppCatalogAvatar
										name={dep.name}
										className="size-12 shrink-0 rounded-lg text-base"
									/>
								) : (
									<div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg p-1.5">
										<EngineSubtypeIcon
											engineType={dep.type}
											engineSubtype={dep.subtype}
											alt={dep.name}
											className="size-full object-contain drop-shadow-[0_1px_1px_rgba(0,0,0,0.08)]"
										/>
									</div>
								)}
								<div className="flex min-w-0 flex-col">
									<div className="flex items-center gap-1.5">
										<a
											href={
												dep.type === "PROJECT"
													? `./#/app/${dep.id}`
													: `./#/${dep.type}/${dep.id}`
											}
											className="flex items-center gap-1 text-primary hover:underline"
										>
											<P className="truncate">
												{dep.name}
											</P>
											<ExternalLink className="size-3.5 shrink-0" />
										</a>
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
										<Muted className="truncate font-mono text-xs">
											{dep.id}
										</Muted>
										<Tooltip>
											<TooltipTrigger asChild>
												<Button
													variant="ghost"
													size="icon"
													className="h-5 w-5 shrink-0"
													onClick={() =>
														handleCopyId(dep.id)
													}
													aria-label="Copy ID"
												>
													{copiedId === dep.id ? (
														<Check className="h-3 w-3 text-emerald-500" />
													) : (
														<Copy className="h-3 w-3" />
													)}
												</Button>
											</TooltipTrigger>
											<TooltipContent>
												{copiedId === dep.id
													? "Copied!"
													: "Copy ID"}
											</TooltipContent>
										</Tooltip>
									</div>
								</div>
								<div className="ml-auto flex shrink-0 items-center gap-2">
									<Badge variant="outline" className="gap-1">
										{PERMISSION_ICONS[permissionKey]}
										{toCapitalized(
											dep.userPermission || "NONE",
										)}
									</Badge>
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

							{dep.description &&
								dep.description.trim() !== "" && (
									<Muted className="ml-15 text-muted-foreground text-sm">
										{dep.description}
									</Muted>
								)}
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
