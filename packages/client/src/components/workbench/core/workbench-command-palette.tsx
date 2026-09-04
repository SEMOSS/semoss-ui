import { type FC, useEffect, useMemo, useState } from "react";
import {
	Command,
	CommandEmpty,
	CommandGroup,
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
import { buildWorkbenchLayoutCommands } from "@/stores/workbench/slices/workbench-layout.commands";

interface WorkbenchPaletteItem {
	id: string;
	category?: string;
	/** The full "Category: Label" line the row shows and sorts by. */
	displayLabel: string;
	description?: string;
}

/** Render and control the command palette for the nearest workbench. */
export const WorkbenchCommandPalette: FC = () => {
	const layout = useWorkbench((state) => state.layout);

	// list of all the currently registered commands in the workbench
	const commandList = useWorkbench((state) =>
		Object.values(state.command.commands),
	);
	const recentCommands = useWorkbench(
		(state) => state.command.recentCommands,
	);

	// method to execute a command by its ID
	const executeCommand = useWorkbench(
		(state) => state.command.actions.executeCommand,
	);
	const registerCommand = useWorkbench(
		(state) => state.command.actions.registerCommand,
	);
	const isCommandOpen = useWorkbench((state) => state.command.isCommandOpen);
	const setCommandOpen = useWorkbench(
		(state) => state.command.actions.setCommandOpen,
	);

	const [search, setSearch] = useState("");

	// Layout commands use the reserved workbench.layout.* namespace, so they
	// can be registered directly without checking the registry first.
	useEffect(() => {
		if (!isCommandOpen) {
			return;
		}

		const layoutCommands = buildWorkbenchLayoutCommands(layout);

		return registerCommand(layoutCommands);
	}, [isCommandOpen, layout, registerCommand]);

	const commandSections = useMemo(() => {
		const query = search.trim().toLowerCase();

		const filteredItems: WorkbenchPaletteItem[] = [];
		const itemsById = new Map<string, WorkbenchPaletteItem>();
		for (const command of commandList) {
			const item: WorkbenchPaletteItem = {
				id: command.id,
				category: command.category,
				displayLabel: command.category
					? `${command.category}: ${command.label}`
					: command.label,
				description: command.description,
			};
			if (
				query &&
				!`${item.displayLabel} ${item.id} ${item.description ?? ""}`
					.toLowerCase()
					.trim()
					.includes(query)
			) {
				continue;
			}
			filteredItems.push(item);
			itemsById.set(item.id, item);
		}

		const recentItems: WorkbenchPaletteItem[] = [];
		const recentItemIds = new Set<string>();
		for (const commandId of recentCommands) {
			const item = itemsById.get(commandId);
			if (!item) {
				continue;
			}
			recentItems.push(item);
			recentItemIds.add(item.id);
		}

		const remainingItems: WorkbenchPaletteItem[] = [];
		for (const item of filteredItems) {
			if (!recentItemIds.has(item.id)) {
				remainingItems.push(item);
			}
		}

		remainingItems.sort((a, b) => {
			const aIsUncategorized = !a.category;
			const bIsUncategorized = !b.category;

			if (aIsUncategorized !== bIsUncategorized) {
				return aIsUncategorized ? -1 : 1;
			}

			return (
				a.displayLabel.localeCompare(b.displayLabel, undefined, {
					sensitivity: "base",
				}) || a.id.localeCompare(b.id)
			);
		});

		return {
			recentItems,
			remainingItems,
		};
	}, [commandList, recentCommands, search]);

	const renderCommandItem = (item: WorkbenchPaletteItem) => (
		<CommandItem
			key={item.id}
			value={item.id}
			onSelect={() => {
				executeCommandById(item.id);
			}}
		>
			<span className="min-w-0 truncate">{item.displayLabel}</span>
			{item.description ? (
				<span className="ml-auto shrink-0 pl-3 text-muted-foreground text-xs">
					{item.description}
				</span>
			) : null}
		</CommandItem>
	);

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

	const executeCommandById = (commandId: string): void => {
		handleOpenChange(false);
		executeCommand(commandId);
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
					className="**:[[cmdk-item]]:px-2 **:[[cmdk-item]]:py-1 **:[[cmdk-item]]:text-xs"
				>
					<CommandInput
						aria-label="Search workbench commands"
						placeholder="Search commands"
						value={search}
						onValueChange={setSearch}
					/>
					<CommandList className="max-h-[320px] p-1">
						<CommandEmpty>No Results Found</CommandEmpty>
						{commandSections.recentItems.length > 0 ? (
							<CommandGroup heading="Recents">
								{commandSections.recentItems.map(
									renderCommandItem,
								)}
							</CommandGroup>
						) : null}
						{commandSections.remainingItems.length > 0 ? (
							<CommandGroup heading="All">
								{commandSections.remainingItems.map(
									renderCommandItem,
								)}
							</CommandGroup>
						) : null}
					</CommandList>
				</Command>
			</DialogContent>
		</Dialog>
	);
};
