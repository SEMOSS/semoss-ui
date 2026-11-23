import { ChevronDown } from "lucide-react";
import { useId, useState } from "react";
import { EngineSelect } from "@semoss/shared";
import {
	Button,
	cn,
	Label,
	P,
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@semoss/ui/next";
import { AgentAvatar } from "@/components/common/agent-avatar";
import { useChatAgent } from "@/features/digital-twin/use-main-twin";
import type {
	RoomSession,
	RoomSessionSnapshot,
} from "@/features/rooms/room-session";
import { ThreadAgentSelect } from "@/features/work-thread/thread-agent-select";

interface DraftChatOptionsProps {
	session: RoomSession;
	snapshot: RoomSessionSnapshot;
	onSelectAgent: (agentId: string) => Promise<void>;
	/** The page is one agent's own, such as a Digital Twin's, so the agent cannot be changed. */
	isAgentLocked?: boolean;
}

/** Keep who the chat is with visible; reveal configuration only on request. */
export function DraftChatOptions({
	session,
	snapshot,
	onSelectAgent,
	isAgentLocked = false,
}: DraftChatOptionsProps) {
	const modelId = useId();
	const [isOpen, setIsOpen] = useState(false);
	const chat = useChatAgent({
		agentId: snapshot.settings.agentId,
		agent: snapshot.agent,
		options: snapshot.options,
		isOwnPage: isAgentLocked,
	});
	const isMainTwin = chat.kind === "mainTwin";
	const isDisabled =
		!snapshot.isReady ||
		snapshot.isPreparing ||
		snapshot.turn.isSubmitting ||
		snapshot.turn.isRunning ||
		snapshot.isSavingSettings ||
		snapshot.hasUnconfirmedSubmission ||
		snapshot.isCreationUncertain;
	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					disabled={isDisabled}
					className={cn(
						"pointer-coarse:min-h-11 min-w-0 gap-1 font-normal text-muted-foreground",
						// the person's own twin is who the page is about: its name is not cut short at a fixed width
						isMainTwin ? "max-w-full" : "max-w-48",
					)}
					aria-label={`Chat Options: ${chat.name}`}
				>
					{isMainTwin && (
						<AgentAvatar
							agent={{ name: chat.name, avatar: chat.avatar }}
							size="xs"
						/>
					)}
					<span className="truncate">{chat.name}</span>
					<ChevronDown
						aria-hidden="true"
						className="size-3.5 shrink-0"
					/>
				</Button>
			</PopoverTrigger>
			<PopoverContent
				align="start"
				side="top"
				className="w-72 max-w-(--radix-popover-content-available-width) space-y-4"
				aria-label="Chat Options"
			>
				<div className="space-y-2">
					<P className="font-medium text-sm">Talking To</P>
					<ThreadAgentSelect
						compact
						value={snapshot.settings.agentId}
						name={chat.name}
						disabled={isDisabled || isAgentLocked}
						onChange={(agentId) => {
							setIsOpen(false);
							void onSelectAgent(agentId);
						}}
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor={modelId}>Model</Label>
					<EngineSelect
						id={modelId}
						name={snapshot.modelName}
						value={snapshot.modelId}
						className="w-full"
						disabled={isDisabled || snapshot.isLoadingModel}
						engineTypes={["MODEL"]}
						metaFilters={[{ tag: "text-generation" }]}
						showEngineIcon={false}
						onChange={(engine) => {
							setIsOpen(false);
							void session.selectModel(
								engine.engine_id,
								engine.engine_display_name ||
									engine.engine_name,
							);
						}}
					/>
				</div>
			</PopoverContent>
		</Popover>
	);
}
