import { Bot, ChevronDown } from "lucide-react";
import { useState } from "react";
import {
	Alert,
	AlertDescription,
	Button,
	Command,
	CommandInput,
	CommandItem,
	CommandList,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Spinner,
	useDebouncedValue,
} from "@semoss/ui/next";
import { useAgentDirectory } from "@/features/agents/api/use-agent-directory";

/** Search the same authorized agent catalog used by Collaboration. */
export function ThreadAgentSelect({
	value,
	name,
	disabled,
	onChange,
}: {
	/** Current workspace id; blank uses the built-in Work assistant. */
	value: string;
	name: string;
	disabled: boolean;
	onChange: (id: string) => void;
}) {
	const [isOpen, setIsOpen] = useState(false);
	const [search, setSearch] = useState("");
	const query = useAgentDirectory(useDebouncedValue(search));
	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<Button
					type="button"
					variant="outline"
					role="combobox"
					aria-label={`Agent: ${name || "Work assistant"}`}
					aria-expanded={isOpen}
					disabled={disabled}
					className="w-full min-w-0 justify-start"
				>
					<Bot aria-hidden="true" />
					<span className="min-w-0 flex-1 truncate text-start">
						{name || "Work assistant"}
					</span>
					<ChevronDown aria-hidden="true" />
				</Button>
			</PopoverTrigger>
			<PopoverContent align="start" className="w-72 max-w-full p-0">
				<Command shouldFilter={false}>
					<CommandInput
						aria-label="Search agents"
						placeholder="Search agents…"
						value={search}
						onValueChange={setSearch}
					/>
					<CommandList>
						<CommandItem
							value="builtin"
							onSelect={() => {
								onChange("");
								setIsOpen(false);
							}}
						>
							Work assistant{!value && " · Selected"}
						</CommandItem>
						{query.agents.map((agent) => (
							<CommandItem
								key={agent.id}
								value={agent.id}
								onSelect={() => {
									onChange(agent.id);
									setIsOpen(false);
								}}
							>
								{agent.name}
								{agent.id === value && " · Selected"}
							</CommandItem>
						))}
						{query.isLoading && <Spinner className="m-4" />}
						{query.error && (
							<Alert variant="destructive">
								<AlertDescription>
									Could not load agents.
									<Button
										type="button"
										variant="outline"
										onClick={query.reset}
									>
										Retry
									</Button>
								</AlertDescription>
							</Alert>
						)}
						{!query.isLoading &&
							!query.error &&
							query.agents.length === 0 && (
								<CommandItem disabled>
									No matching agents
								</CommandItem>
							)}
						{query.hasMore && (
							<CommandItem onSelect={query.next}>
								Load more agents
							</CommandItem>
						)}
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
