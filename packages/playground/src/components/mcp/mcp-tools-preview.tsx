import { HammerIcon, WrenchIcon } from "lucide-react";
import { useState } from "react";
import { usePixel } from "@semoss/sdk/react";
import {
	Button,
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
	Muted,
	Spinner,
} from "@semoss/ui/next";
import type { ToolStructure } from "@/types";

interface MCPToolsPreviewProps {
	engineId: string;
}

export const MCPToolsPreview = ({ engineId }: MCPToolsPreviewProps) => {
	const [isHovered, setIsHovered] = useState(false);

	const getTools = usePixel<ToolStructure>(
		isHovered ? `GetMCPTools(engine=["${engineId}"]);` : "",
		{ data: undefined },
	);

	const tools = getTools.data?.tools ?? [];

	return (
		<HoverCard
			openDelay={700}
			onOpenChange={(open) => {
				if (open) {
					setIsHovered(true);
				}
			}}
		>
			<HoverCardTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="-m-2 shrink-0"
					onClick={(e) => {
						e.preventDefault();
						e.stopPropagation();
					}}
				>
					<HammerIcon className="size-4" />
				</Button>
			</HoverCardTrigger>
			<HoverCardContent
				className="w-64 p-2"
				onClick={(e) => e.stopPropagation()}
			>
				<p className="mb-1 px-2 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
					Tools
				</p>
				{getTools.status === "LOADING" && (
					<div className="flex items-center justify-center py-4">
						<Spinner />
					</div>
				)}
				{getTools.status === "ERROR" && (
					<Muted className="text-center text-xs">
						Failed to load tools.
					</Muted>
				)}
				{getTools.status === "SUCCESS" && tools.length === 0 && (
					<Muted className="text-center text-xs">
						No tools available.
					</Muted>
				)}
				{getTools.status === "SUCCESS" && tools.length > 0 && (
					<ul className="flex max-h-64 flex-col overflow-y-auto">
						{tools.map((tool) => (
							<li
								key={tool.name}
								className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-xs hover:bg-muted"
							>
								<WrenchIcon className="size-3 shrink-0 text-muted-foreground" />
								{tool.title ?? tool.name}
							</li>
						))}
					</ul>
				)}
			</HoverCardContent>
		</HoverCard>
	);
};
