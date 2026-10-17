import { ChevronDown } from "lucide-react";
import { useId, useState } from "react";
import { EngineSelect } from "@semoss/shared";
import {
	Button,
	Label,
	P,
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@semoss/ui/next";
import type {
	RoomSession,
	RoomSessionSnapshot,
} from "@/features/rooms/room-session";
import { ThreadAgentSelect } from "@/features/work-thread/thread-agent-select";

interface DraftChatOptionsProps {
	session: RoomSession;
	snapshot: RoomSessionSnapshot;
	onSelectAgent: (agentId: string) => Promise<void>;
}

/** Keep the selected assistant visible; reveal configuration only on request. */
export function DraftChatOptions({
	session,
	snapshot,
	onSelectAgent,
}: DraftChatOptionsProps) {
	const modelId = useId();
	const [isOpen, setIsOpen] = useState(false);
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
					className="pointer-coarse:min-h-11 max-w-48 gap-1 font-normal text-muted-foreground"
					aria-label={`Assistant options: ${snapshot.agent?.name ?? "Assistant"}`}
				>
					<span className="truncate">
						{snapshot.agent?.name ?? "Assistant"}
					</span>
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
				aria-label="Assistant options"
			>
				<div className="space-y-2">
					<P className="font-medium text-sm">Assistant</P>
					<ThreadAgentSelect
						compact
						value={snapshot.settings.agentId}
						name={snapshot.agent?.name ?? "Assistant"}
						disabled={isDisabled}
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
