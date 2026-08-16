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
	// list of all the currently registered commands in the workbench
	const commandList = useWorkbench((state) => Object.values(state.commands));

	// method to execute a command by its ID
	const executeCommand = useWorkbench((state) => state.executeCommand);
	const isCommandOpen = useWorkbench((state) => state.isCommandOpen);
	const setCommandOpen = useWorkbench((state) => state.setCommandOpen);

	const [search, setSearch] = useState("");

	const filteredItems = useMemo<WorkbenchPaletteItem[]>(() => {
		const query = search.trim().toLowerCase();

		return [...commandList]
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
	}, [commandList, search]);

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
						value={item.label}
						keywords={[item.id, item.description ?? ""]}
						onSelect={() => {
							handleOpenChange(false);
							executeCommand(item.id);
						}}
					>
						{item.icon}

						<span className="min-w-0 truncate">{item.label}</span>
					</CommandItem>
				))}
			</CommandList>
		</CommandDialog>
	);
};
