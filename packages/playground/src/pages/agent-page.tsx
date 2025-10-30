import { ComputerIcon, SearchIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePixel } from "@semoss/sdk/react";
import {
	Button,
	H4,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Lead,
	Muted,
	ScrollArea,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { AgentCard, AgentOverlay } from "@/components/agent";
import { useChat } from "@/hooks";
import type { Agent } from "@/types";

/**
 * Renders the Discover Page, allowing users to discover and create agents
 *
 * @component
 */
export const AgentPage = observer(() => {
	const { chat } = useChat();

	/**
	 * Library Hooks
	 */
	const listWorkspaces = usePixel<{
		workspaces: Agent[];
	}>(`ListWorkspaces();`, { data: { workspaces: [] } });

	const navigate = useNavigate();

	/**
	 * State
	 */
	const [search, setSearch] = useState("");
	const [isAgentModalOpen, setIsAgentModalOpen] = useState<boolean>(false);
	const [agentInfo, setAgentInfo] = useState<Agent | null>(null);

	return (
		<div className="flex h-full w-full flex-col overflow-hidden px-2">
			<div className="mx-auto w-full max-w-2xl">
				<H4 className="mt-16">Discover Agents</H4>
				<div className="mt-4 flex flex-row">
					<Lead className="flex-1 text-base">
						Explore and build custom AI agents designed to meet your
						unique needs and integrate seamlessly into your
						processes.
					</Lead>
					<Tooltip>
						<TooltipTrigger asChild>
							<span>
								<Button
									onClick={() => {
										setAgentInfo(null);
										setIsAgentModalOpen(true);
									}}
								>
									<ComputerIcon />
									Build
								</Button>
							</span>
						</TooltipTrigger>
						<TooltipContent>Create a new agent</TooltipContent>
					</Tooltip>
				</div>
				<InputGroup className="mt-12">
					<InputGroupInput
						placeholder="Search Agents"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
					<InputGroupAddon>
						<SearchIcon />
					</InputGroupAddon>
					<InputGroupAddon align="inline-end">
						{listWorkspaces.status === "LOADING" ? (
							<Spinner />
						) : (
							`${listWorkspaces.data.workspaces.length} results`
						)}
					</InputGroupAddon>
				</InputGroup>
			</div>
			<div className="mx-auto w-full max-w-5xl flex-1 pt-10">
				<ScrollArea className="h-full w-full">
					{listWorkspaces.status === "LOADING" && (
						<div className="flex items-center justify-center py-12">
							<Spinner />
						</div>
					)}

					{listWorkspaces.status === "SUCCESS" &&
						listWorkspaces.data.workspaces.length > 0 && (
							<div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
								{listWorkspaces.data.workspaces.map((w) => (
									<AgentCard
										key={w.workspace_id}
										agent={w}
										onPrimaryClick={() => {
											navigate(
												`/new?agentId=${w.workspace_id}`,
											);
										}}
										onSecondaryClick={() => {
											setAgentInfo(w);
											setIsAgentModalOpen(true);
										}}
									/>
								))}
							</div>
						)}

					{listWorkspaces.status === "SUCCESS" &&
						listWorkspaces.data.workspaces.length === 0 && (
							<div className="flex items-center justify-center py-12">
								<Muted>No results found</Muted>
							</div>
						)}
				</ScrollArea>
			</div>

			{isAgentModalOpen && (
				<AgentOverlay
					open={isAgentModalOpen}
					agentInfo={agentInfo}
					onOpenChange={(isOpen) => {
						setIsAgentModalOpen(isOpen);
					}}
					onSubmit={async (data) => {
						const output = await chat.addWorkspace(data);

						if (output) {
							navigate(`/new?agentId=${output}`);
						}
					}}
				/>
			)}
		</div>
	);
});
