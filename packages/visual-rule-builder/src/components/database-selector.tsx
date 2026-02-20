import { Check, ChevronsUpDown, Database } from "lucide-react";
import { observer } from "mobx-react-lite";
import React from "react";
import {
	Button,
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	cn,
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@semoss/ui/next";
import type { Database as DatabaseType } from "@/stores/database-store";

interface DatabaseSelectorProps {
	databases: DatabaseType[];
	selectedDatabaseId: string | null;
	onSelect: (databaseId: string) => void;
	disabled?: boolean;
}

export const DatabaseSelector = observer(
	({
		databases,
		selectedDatabaseId,
		onSelect,
		disabled = false,
	}: DatabaseSelectorProps) => {
		const [open, setOpen] = React.useState(false);

		const selectedDatabase = databases.find(
			(db) => db.database_id === selectedDatabaseId,
		);

		return (
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						role="combobox"
						aria-expanded={open}
						className="w-full justify-between"
						disabled={disabled || databases.length === 0}
					>
						<div className="flex items-center gap-2">
							<Database className="h-4 w-4" />
							<span>
								{selectedDatabase
									? selectedDatabase.app_name
									: "Select database..."}
							</span>
						</div>
						<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-full p-0">
					<Command>
						<CommandInput placeholder="Search databases..." />
						<CommandList>
							<CommandEmpty>No database found.</CommandEmpty>
							<CommandGroup>
								{databases.map((database) => (
									<CommandItem
										key={database.database_id}
										value={database.app_name}
										onSelect={() => {
											onSelect(database.database_id);
											setOpen(false);
										}}
									>
										<Check
											className={cn(
												"mr-2 h-4 w-4",
												selectedDatabaseId ===
													database.database_id
													? "opacity-100"
													: "opacity-0",
											)}
										/>
										<div className="flex flex-col">
											<span>{database.app_name}</span>
											{database.database_subtype && (
												<span className="text-muted-foreground text-xs">
													{database.database_subtype}
												</span>
											)}
										</div>
									</CommandItem>
								))}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
		);
	},
);

DatabaseSelector.displayName = "DatabaseSelector";
