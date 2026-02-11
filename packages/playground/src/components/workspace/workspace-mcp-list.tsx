import { ImageIcon, SquareArrowOutUpRightIcon } from "lucide-react";
import { useMemo } from "react";
import {
	Badge,
	Button,
	Card,
	CardContent,
	Muted,
	ScrollArea,
} from "@semoss/ui/next";
import { mcpToPlatformUrl } from "@/components";
import type { Workspace } from "@/types";

interface WorkspaceMCPListProps {
	/**
	 * Type of mcp
	 */
	type: "TOOLBOX" | "KNOWLEDGE";

	/**
	 * MCPs associated with the workspace
	 */
	mcp: Workspace["mcp"];

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
						<Card key={m.id} className="col-span-1">
							<CardContent className="space-y-2">
								{/* Title & Open Button */}
								<div className="-mt-2 flex items-start justify-between gap-2">
									<div className="wrap-break-word min-w-0 flex-1 font-semibold text-sm leading-tight">
										T{m.name.repeat(4)}
									</div>
									<Button
										variant="ghost"
										size="icon"
										className="-m-2 -mr-4 shrink-0"
										asChild
									>
										<a
											target="_blank"
											href={mcpToPlatformUrl(m)}
										>
											<SquareArrowOutUpRightIcon className="size-4" />
										</a>
									</Button>
								</div>

								{/* Image & Details */}
								<div className="flex gap-3">
									{/* Image Placeholder */}
									<div className="flex size-16 shrink-0 items-center justify-center rounded-md border border-border border-dashed bg-muted/50">
										<ImageIcon className="size-6 text-muted-foreground" />
									</div>

									{/* Type & Permission */}
									<div className="flex flex-1 flex-col gap-2">
										{/* Type */}
										<Badge
											variant="outline"
											className="w-fit"
										>
											{m.type}
										</Badge>

										{/* Permission & Action */}
										{m.permission === "NONE" ? (
											<Button
												variant="default"
												size="sm"
												className="w-fit"
											>
												Request Access
											</Button>
										) : (
											<Badge
												variant={permissionColor}
												className="w-fit"
											>
												{m.permission.replace("_", " ")}
											</Badge>
										)}
									</div>
								</div>
							</CardContent>
						</Card>
					);
				})}
			</div>
		</ScrollArea>
	);
};
