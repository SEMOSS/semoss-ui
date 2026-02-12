import {
	AlertCircle,
	ImageIcon,
	SquareArrowOutUpRightIcon,
} from "lucide-react";
import { useMemo } from "react";
import { useInsight, usePixel } from "@semoss/sdk/react";
import {
	Badge,
	Button,
	Card,
	CardContent,
	Muted,
	ScrollArea,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { mcpToPlatformUrl } from "@/components";
import { toSentenceCase } from "@/utility";

export interface WorkspaceMCPListProps {
	/**
	 * Type of mcp
	 */
	type: "TOOLBOX" | "KNOWLEDGE";

	/**
	 * WorkspaceId
	 */
	workspaceId: string;

	/**
	 * Search the mcps by name
	 */
	search: string;
}

interface ProjectDependency {
	engine_type:
		| "PROJECT"
		| "STORAGE"
		| "DATABASE"
		| "FUNCTION"
		| "MODEL"
		| "VECTOR";
	engine_id: string;
	engine_name: string;
	description?: string;
	engine_discoverable?: boolean;
	permission_name?: "READ_ONLY" | "EDIT" | "OWNER";
	engine_global?: boolean;
}

/**
 * Renders a card representing a workspace
 *
 * @component
 */
export const WorkspaceMCPList = ({
	type,
	workspaceId,
	search,
}: WorkspaceMCPListProps) => {
	const { actions } = useInsight();

	const getDependencies = usePixel<ProjectDependency[]>(
		workspaceId
			? `GetProjectDependencies(project=["${workspaceId}"]);`
			: "",
		{
			data: null,
			onError: (_d, e) => {
				toast.error(
					`Failed to load workspace resources: ${e instanceof Error ? e.message : "Unknown error"}`,
				);
			},
		},
	);

	const searchedMCP = useMemo(() => {
		if (!search) {
			return getDependencies.data || [];
		}
		return (
			getDependencies.data?.filter(
				(m) =>
					m.engine_id.toLowerCase().includes(search.toLowerCase()) ||
					m.engine_name.toLowerCase().includes(search.toLowerCase()),
			) || []
		);
	}, [getDependencies.data, search]);

	if (searchedMCP.length === 0) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<Muted>
					No {type === "TOOLBOX" ? "toolboxes" : "knowledge"} found
				</Muted>
			</div>
		);
	}

	const handleRequestAccess = async (m: ProjectDependency) => {
		try {
			const response = await actions.run(
				m.engine_type === "PROJECT"
					? `RequestProject(project=${JSON.stringify(
							m.engine_id,
						)}, permission=${JSON.stringify("READ_ONLY")})`
					: `RequestEngine(engine=${JSON.stringify(m.engine_id)}, permission=${JSON.stringify("READ_ONLY")})`,
			);
			if (
				response.pixelReturn.some((r) =>
					r.operationType.some((op) => op === "ERROR"),
				)
			) {
				throw new Error("Failed to request access");
			}
		} catch {
			toast.error("Failed to request access");
		}
	};

	return (
		<ScrollArea className="h-full w-full">
			<div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
				{searchedMCP.map((m) => {
					const permissionColor = ({
						OWNER: "default",
						EDIT: "secondary",
						READ_ONLY: "outline",
					}[m.permission_name] ?? "destructive") as
						| "default"
						| "secondary"
						| "outline"
						| "destructive";

					const noDataShown =
						!m.permission_name && !m.engine_discoverable;

					return (
						<Card
							key={m.engine_id}
							className={`col-span-1 p-0 ${
								!m.permission_name
									? "border-destructive/50 border-dashed"
									: ""
							}`}
						>
							<CardContent className="space-y-2 p-4">
								{/* Title & Open Button */}
								<div className="flex items-start justify-between gap-2">
									<div className="wrap-break-word min-w-0 flex-1 font-semibold text-sm leading-tight">
										{m.engine_name}
									</div>
									{noDataShown ? (
										<Tooltip>
											<TooltipTrigger asChild>
												<AlertCircle className="size-4 shrink-0 cursor-help text-destructive" />
											</TooltipTrigger>
											<TooltipContent>
												{`You don't have access to this ${type === "TOOLBOX" ? "toolbox" : "knowledge base"}. Please request access from the owner.`}
											</TooltipContent>
										</Tooltip>
									) : (
										<Button
											variant="ghost"
											size="icon"
											className="-m-2 shrink-0"
											asChild
										>
											<a
												target="_blank"
												href={mcpToPlatformUrl(m)}
											>
												<SquareArrowOutUpRightIcon className="size-4" />
											</a>
										</Button>
									)}
								</div>

								{/* Image & Details */}
								<div className="flex items-center gap-3">
									{/* Image Placeholder */}
									{noDataShown ? (
										<div className="flex size-16 shrink-0 items-center justify-center rounded-md border border-border border-dashed bg-muted/50">
											<ImageIcon className="size-6 text-muted-foreground" />
										</div>
									) : (
										<img
											src={
												m.engine_type === "PROJECT"
													? `${import.meta.env.MODULE}/api/project-${m.engine_id}/projectImage/download`
													: `${import.meta.env.MODULE}/api/e-${m.engine_id}/image/download`
											}
											alt={m.engine_name}
											className="size-16 shrink-0 rounded-md object-cover object-center"
										/>
									)}

									{/* Type & Permission */}
									<div className="flex flex-1 flex-col gap-2">
										{/* Type */}
										<Badge
											variant="outline"
											className="w-fit"
										>
											{toSentenceCase(m.engine_type)}
										</Badge>

										{!m.permission_name &&
										m.engine_discoverable ? (
											<Button
												size="sm"
												className="h-fit w-fit px-2 py-1 text-xs"
												onClick={() =>
													handleRequestAccess(m)
												}
											>
												Request Access
											</Button>
										) : (
											<Badge
												variant={permissionColor}
												className="w-fit"
											>
												{toSentenceCase(
													m.permission_name,
												) ?? "No Access"}
											</Badge>
										)}
									</div>
								</div>

								{/* Description */}
								<div className="text-muted-foreground text-xs">
									{m.description ||
										"No description available."}
								</div>
								{true && (
									<div className="flex flex-wrap gap-1">
										{["TODO", "Tags"].map((tag) => (
											<Badge
												key={tag}
												variant="secondary"
												className="text-xs"
											>
												{tag}
											</Badge>
										))}
									</div>
								)}
							</CardContent>
						</Card>
					);
				})}
			</div>
		</ScrollArea>
	);
};
