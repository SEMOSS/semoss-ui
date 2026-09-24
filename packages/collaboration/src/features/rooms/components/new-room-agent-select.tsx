import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";
import {
	Button,
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@semoss/ui/next";
import { AgentAvatar } from "@/components/common/agent-avatar";
import type { Agent } from "@/types/agent";

interface NewRoomAgentSelectProps {
	/** Available workspace agents. */
	agents: Agent[];
	/** Requested agent, including agents opened through a direct link. */
	agent: Agent | undefined;
	/** Agent requested by the current URL. */
	value: string;
	/** Prevents switching once room creation has started. */
	disabled: boolean;
	/** Selects an agent without replacing the message draft. */
	onChange: (agentId: string) => void;
}

/** Searchable agent control below the new-room composer. */
export function NewRoomAgentSelect({
	agents,
	agent,
	value,
	disabled,
	onChange,
}: NewRoomAgentSelectProps) {
	const [isOpen, setIsOpen] = useState(false);
	const options =
		agent && !agents.some((candidate) => candidate.id === agent.id)
			? [agent, ...agents]
			: agents;

	return (
		<Popover open={isOpen && !disabled} onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<Button
					type="button"
					variant="ghost"
					role="combobox"
					aria-label={`Choose agent: ${agent?.name || "Selected agent"}`}
					aria-expanded={isOpen && !disabled}
					disabled={disabled}
					className="h-auto min-h-11 min-w-0 max-w-full justify-start gap-2 px-2 py-2 text-muted-foreground"
				>
					{agent && <AgentAvatar agent={agent} size="xs" />}
					<span className="min-w-0 truncate">
						{agent?.name || "Selected agent"}
					</span>
					<ChevronDown
						aria-hidden="true"
						className="size-4 shrink-0"
					/>
				</Button>
			</PopoverTrigger>
			<PopoverContent align="start" className="w-72 max-w-full p-0">
				<Command label="Search agents">
					<CommandInput
						aria-label="Search agents"
						placeholder="Search agents…"
					/>
					<CommandList label="Agents">
						<CommandEmpty>No agents found.</CommandEmpty>
						<CommandGroup>
							{options.map((option) => (
								<CommandItem
									key={option.id}
									value={option.id}
									keywords={[option.name]}
									className="min-h-11 gap-2"
									onSelect={() => {
										onChange(option.id);
										setIsOpen(false);
									}}
								>
									<AgentAvatar agent={option} size="xs" />
									<span className="min-w-0 flex-1 break-words">
										{option.name}
									</span>
									{option.id === value && (
										<>
											<Check
												aria-hidden="true"
												className="size-4 shrink-0 text-primary"
											/>
											<span className="sr-only">
												Current agent
											</span>
										</>
									)}
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
