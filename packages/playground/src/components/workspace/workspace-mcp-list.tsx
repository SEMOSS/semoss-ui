import { SquareArrowOutUpRightIcon } from "lucide-react";
import { useMemo } from "react";
import { Button, Card, CardContent, ScrollArea } from "@semoss/ui/next";
import type { Workspace } from "@/types";

const PLATFORM_URL = import.meta.env.VITE_PLATFORM_URL
	? import.meta.env.VITE_PLATFORM_URL
	: "";

export interface WorkspaceMCPListProps {
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
			<div className="px-2 py-4 text-center text-muted-foreground text-sm">
				No MCPs
			</div>
		);
	}

	return (
		<ScrollArea className="h-full w-full">
			<div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-3">
				{searchedMCP.map((m) => (
					<Card key={m.id} className="col-span-1">
						<CardContent>
							<div className="space-between flex flex-row">
								<div className="flex-1 space-y-1.5">
									<div className="line-clamp-2 h-8 font-semibold text-base text-card-foreground leading-none">
										{m.name}
									</div>
									<div className="truncate text-muted-foreground text-sm">
										{m.type}
									</div>
								</div>
								<Button variant="ghost" size="icon" asChild>
									<a
										target="_blank"
										href={`${PLATFORM_URL}/#/app/${m.id}`}
									>
										<SquareArrowOutUpRightIcon />
									</a>
								</Button>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</ScrollArea>
	);
};
