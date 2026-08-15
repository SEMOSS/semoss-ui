import { type FC, useEffect, useMemo, useState } from "react";
import {
	CommandDialog,
	CommandEmpty,
	CommandInput,
	CommandItem,
	CommandList,
} from "@semoss/ui/next";
import { useWorkbench } from "@/hooks";

type WorkbenchPaletteItem =
	| {
			kind: "COMMAND";
			id: string;
			label: string;
			description?: string;
			icon?: React.ReactNode;
	  }
	| {
			kind: "FILE";
			id: string;
			label: string;
			path: string;
			componentId: string;
			config?: Record<string, unknown>;
	  };

/** Render and control the command palette for the nearest workbench. */
export const WorkbenchCommandPalette: FC = () => {
	// list of all the currently registered commands in the workbench
	const commandList = useWorkbench((state) => Object.values(state.commands));

	// method to execute a command by its ID
	const executeCommand = useWorkbench((state) => state.executeCommand);

	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");

	const isCommandMode = search.trimStart().startsWith(">");
	const commandQuery = isCommandMode
		? search.trimStart().slice(1).trim().toLowerCase()
		: "";
	const fileQuery = isCommandMode ? "" : search.trim().toLowerCase();

	const fileEntries = useMemo(() => {
		const entries: Array<{
			id: string;
			name: string;
			path: string;
			componentId: string;
			config?: Record<string, unknown>;
		}> = [];

		return entries;
	}, []);

	const filteredItems = useMemo<WorkbenchPaletteItem[]>(() => {
		if (isCommandMode) {
			return [...commandList]
				.filter((command) => {
					if (!commandQuery) {
						return true;
					}

					const searchContent =
						`${command.label} ${command.id} ${command.description ?? ""}`
							.toLowerCase()
							.trim();
					return searchContent.includes(commandQuery);
				})
				.sort((a, b) => a.label.localeCompare(b.label))
				.map((command) => ({
					kind: "COMMAND",
					id: command.id,
					label: command.label,
					description: command.description,
					icon: command.icon,
				}));
		}

		return [...fileEntries]
			.filter((entry) => {
				if (!fileQuery) {
					return true;
				}

				const searchContent = `${entry.name} ${entry.path}`
					.toLowerCase()
					.trim();
				return searchContent.includes(fileQuery);
			})
			.sort((a, b) =>
				a.name === b.name
					? a.path.localeCompare(b.path)
					: a.name.localeCompare(b.name),
			)
			.slice(0, 10)
			.map((entry) => ({
				kind: "FILE",
				key: `file:${entry.id}`,
				id: entry.id,
				label: entry.name,
				path: entry.path,
				componentId: entry.componentId,
				config: entry.config,
			}));
	}, [commandQuery, commandList, fileEntries, fileQuery, isCommandMode]);

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
			setOpen(true);
		};

		window.addEventListener("keydown", handleKeyDown, { capture: true });

		return () => {
			window.removeEventListener("keydown", handleKeyDown, {
				capture: true,
			});
		};
	}, []);

	const handleOpenChange = (nextOpen: boolean): void => {
		setOpen(nextOpen);
		if (!nextOpen) {
			setSearch("");
		}
	};

	return (
		<CommandDialog
			open={open}
			onOpenChange={handleOpenChange}
			title="Workbench Command Palette"
			description="Search files, or start with > to run commands"
			showCloseButton={false}
			className="max-w-sm rounded-lg border"
		>
			<CommandInput
				aria-label="Search workbench files or commands"
				placeholder="Search files or type > for commands"
				value={search}
				onValueChange={setSearch}
			/>
			<CommandList>
				<CommandEmpty>No Results Found</CommandEmpty>
				{filteredItems.map((item) => {
					if (item.kind === "COMMAND") {
						return (
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

								<span className="min-w-0 truncate">
									{item.label}
								</span>
							</CommandItem>
						);
					}

					return (
						<CommandItem
							key={item.id}
							value={item.label}
							keywords={[item.path]}
							onSelect={() => {
								handleOpenChange(false);
								console.error("TODO");
							}}
						>
							<span className="min-w-0 truncate">
								{item.label}
							</span>
						</CommandItem>
					);
				})}
			</CommandList>
		</CommandDialog>
	);
};
