import { type FC, useEffect, useMemo, useState } from "react";
import {
	CommandDialog,
	CommandEmpty,
	CommandInput,
	CommandItem,
	CommandList,
} from "@semoss/ui/next";
import { useWorkbench } from "@/hooks";

interface WorkbenchPaletteItem {
	id: string;
	label: string;
	description?: string;
	icon?: React.ReactNode;
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
			.filter((command) => {
				if (!query) {
					return true;
				}

				const searchContent =
					`${command.label} ${command.id} ${command.description ?? ""}`
						.toLowerCase()
						.trim();
				return searchContent.includes(query);
			})
			.sort((a, b) => a.label.localeCompare(b.label))
			.map((command) => ({
				id: command.id,
				label: command.label,
				description: command.description,
				icon: command.icon,
			}));
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
		<CommandDialog
			open={isCommandOpen}
			onOpenChange={handleOpenChange}
			title="Workbench Command Palette"
			description="Search commands"
			showCloseButton={false}
			className="max-w-sm rounded-lg border"
		>
			<CommandInput
				aria-label="Search workbench commands"
				placeholder="Search commands"
				value={search}
				onValueChange={setSearch}
			/>
			<CommandList>
				<CommandEmpty>No Results Found</CommandEmpty>
				{filteredItems.map((item) => (
					<CommandItem
						key={item.id}
						value={`${item.label} ${item.id}`}
						keywords={[item.id, item.description ?? ""]}
						onSelect={() => {
							runCommand(item.id);
						}}
					>
						{item.icon}

						<span className="min-w-0 truncate">{item.label}</span>
						{item.description ? (
							<span className="ml-auto min-w-0 truncate text-muted-foreground text-xs">
								{item.description}
							</span>
						) : null}
					</CommandItem>
				))}
			</CommandList>
		</CommandDialog>
	);
};
