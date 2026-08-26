import { type FC, useEffect, useMemo, useState } from "react";
import {
	Command,
	CommandEmpty,
	CommandInput,
	CommandItem,
	CommandList,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@semoss/ui/next";
import { useWorkbench } from "@/hooks";

interface WorkbenchPaletteItem {
	id: string;
	/** The full "Category: Label" line the row shows and sorts by. */
	displayLabel: string;
	description?: string;
}

/** Render and control the command palette for the nearest workbench. */
export const WorkbenchCommandPalette: FC = () => {
	const layoutActions = useWorkbench((state) => state.layout.actions);

	// list of all the currently registered commands in the workbench
	const commandList = useWorkbench((state) =>
		Object.values(state.command.commands),
	);

	// method to execute a command by its ID
	const executeCommand = useWorkbench(
		(state) => state.command.actions.executeCommand,
	);
	const runCommandDirectly = useWorkbench(
		(state) => state.command.actions.runCommand,
	);
	const isCommandOpen = useWorkbench((state) => state.command.isCommandOpen);
	const setCommandOpen = useWorkbench(
		(state) => state.command.actions.setCommandOpen,
	);

	const [search, setSearch] = useState("");

	// layout-derived entries (go-to, reopen, borders, maximize, reset, …) are
	// built only when the palette opens, never while the store churns
	const layoutCommands = useMemo(
		() => (isCommandOpen ? layoutActions.buildLayoutCommands() : []),
		[isCommandOpen, layoutActions],
	);

	const filteredItems = useMemo<WorkbenchPaletteItem[]>(() => {
		const query = search.trim().toLowerCase();

		// registered commands win over layout-derived ones on id collision
		const registeredIds = new Set(commandList.map((command) => command.id));
		const merged = [
			...commandList,
			...layoutCommands.filter(
				(command) => !registeredIds.has(command.id),
			),
		];

		return merged
			.map((command) => ({
				id: command.id,
				displayLabel: command.category
					? `${command.category}: ${command.label}`
					: command.label,
				description: command.description,
			}))
			.filter((item) => {
				if (!query) {
					return true;
				}

				const searchContent =
					`${item.displayLabel} ${item.id} ${item.description ?? ""}`
						.toLowerCase()
						.trim();
				return searchContent.includes(query);
			})
			.sort(
				(a, b) =>
					a.displayLabel.localeCompare(b.displayLabel, undefined, {
						sensitivity: "base",
					}) || a.id.localeCompare(b.id),
			);
	}, [commandList, layoutCommands, search]);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent): void => {
			const isCommandPaletteShortcut =
				(event.metaKey || event.ctrlKey) &&
				event.shiftKey &&
				event.key.toLowerCase() === "p";
			const isFunctionKeyShortcut = event.key === "F1";

			if (!isCommandPaletteShortcut && !isFunctionKeyShortcut) {
				return;
			}

			event.preventDefault();
			event.stopPropagation();
			setCommandOpen(true);
		};

		window.addEventListener("keydown", handleKeyDown, { capture: true });

		return () => {
			window.removeEventListener("keydown", handleKeyDown, {
				capture: true,
			});
		};
	}, [setCommandOpen]);

	const handleOpenChange = (nextOpen: boolean): void => {
		setCommandOpen(nextOpen);
		if (!nextOpen) {
			setSearch("");
		}
	};

	const runCommand = (commandId: string): void => {
		handleOpenChange(false);
		// registered commands run through the registry; layout-derived ones
		// execute directly
		if (commandList.some((command) => command.id === commandId)) {
			executeCommand(commandId);
			return;
		}
		const layoutCommand = layoutCommands.find(
			(command) => command.id === commandId,
		);
		if (layoutCommand) {
			runCommandDirectly(layoutCommand);
		}
	};

	return (
		<Dialog open={isCommandOpen} onOpenChange={handleOpenChange}>
			<DialogContent
				className="max-w-md overflow-hidden rounded-lg border p-0"
				showCloseButton={false}
			>
				<DialogHeader className="sr-only">
					<DialogTitle>Workbench Command Palette</DialogTitle>
					<DialogDescription>Search commands</DialogDescription>
				</DialogHeader>
				{/* shouldFilter off: the memo above is the only filter, so the
				    alphabetical sort holds while typing instead of cmdk's
				    fuzzy re-ranking */}
				<Command
					shouldFilter={false}
					className="[&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-1 [&_[cmdk-item]]:text-[13px]"
				>
					<CommandInput
						aria-label="Search workbench commands"
						placeholder="Search commands"
						value={search}
						onValueChange={setSearch}
					/>
					<CommandList className="max-h-[320px] p-1">
						<CommandEmpty>No Results Found</CommandEmpty>
						{filteredItems.map((item) => (
							<CommandItem
								key={item.id}
								value={item.id}
								onSelect={() => {
									runCommand(item.id);
								}}
							>
								<span className="min-w-0 truncate">
									{item.displayLabel}
								</span>
								{item.description ? (
									<span className="ml-auto shrink-0 pl-3 text-muted-foreground text-xs">
										{item.description}
									</span>
								) : null}
							</CommandItem>
						))}
					</CommandList>
				</Command>
			</DialogContent>
		</Dialog>
	);
};
