import {
	AlertCircle,
	ImageIcon,
	SquareArrowOutUpRightIcon,
} from "lucide-react";
import { useMemo } from "react";
import { useInsight } from "@semoss/sdk/react";
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
import type { WorkspaceWithMCPData } from "@/types";
import { toSentenceCase } from "@/utility";

interface WorkspaceMCPListProps {
	/**
	 * Type of mcp
	 */
	type: "TOOLBOX" | "KNOWLEDGE";

	/**
	 * MCPs associated with the workspace
	 */
	mcp: WorkspaceWithMCPData["mcp"];

	/**
	 * Search the mcps by name
	 */
	search: string;
}

/**
 * Renders a card representing a workspace
 *
 * @component
 */
export const WorkspaceMCPList = ({
	type,
	mcp = [],
	search,
}: WorkspaceMCPListProps) => {
	const { actions } = useInsight();

	const searchedMCP = useMemo(() => {
		if (!search) {
			return mcp;
		}
		return mcp.filter((m) =>
			m.name.toLowerCase().includes(search.toLowerCase()),
		);
	}, [mcp, search]);

	if (searchedMCP.length === 0) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<Muted>
					No {type === "TOOLBOX" ? "toolboxes" : "knowledge"} found
				</Muted>
			</div>
		);
	}

	const handleRequestAccess = async (
		m: WorkspaceWithMCPData["mcp"][number],
	) => {
		try {
			const response = await actions.run(
				m.type === "PROJECT"
					? `RequestProject(project=${JSON.stringify(
							m.id,
						)}, permission=${JSON.stringify("READ_ONLY")})`
					: `RequestEngine(engine=${JSON.stringify(m.id)}, permission=${JSON.stringify("READ_ONLY")})`,
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
					const permissionColor = {
						OWNER: "default",
						EDIT: "secondary",
						READ_ONLY: "outline",
						NONE: "destructive",
					}[m.permission] as
						| "default"
						| "secondary"
						| "outline"
						| "destructive";

					return (
						<Card
							key={m.id}
							className={`col-span-1 p-0 ${
								m.permission === "NONE"
									? "border-destructive/50 border-dashed"
									: ""
							}`}
						>
							<CardContent className="space-y-2 p-4">
								{/* Title & Open Button */}
								<div className="flex items-start justify-between gap-2">
									<div className="wrap-break-word min-w-0 flex-1 font-semibold text-sm leading-tight">
										{m.name}
									</div>
									{m.permission === "NONE" ? (
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
									{m.permission === "NONE" ? (
										<div className="flex size-16 shrink-0 items-center justify-center rounded-md border border-border border-dashed bg-muted/50">
											<ImageIcon className="size-6 text-muted-foreground" />
										</div>
									) : (
										<img
											src={
												m.type === "PROJECT"
													? `${import.meta.env.MODULE}/api/project-${m.id}/projectImage/download`
													: `${import.meta.env.MODULE}/api/e-${m.id}/image/download`
											}
											alt={m.name}
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
											{toSentenceCase(m.type)}
										</Badge>

										{m.permission === "NONE" ? (
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
												{toSentenceCase(m.permission)}
											</Badge>
										)}
									</div>
								</div>

								{/* Description */}
								<div className="text-muted-foreground text-xs">
									{m.description ||
										"No description available."}
								</div>
								{m.tags?.length && (
									<div className="flex flex-wrap gap-1">
										{m.tags.map((tag) => (
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
