import { XIcon } from "lucide-react";
import { type FC, useEffect, useMemo, useRef, useState } from "react";
import {
	Button,
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@semoss/ui/next";
import { useWorkbench } from "../../hooks/use-workbench";
import { useWorkbenchStoreApi } from "../../hooks/use-workbench-store-api";
import { buildWorkbenchLayoutCommands } from "../../stores/slices/workbench-layout.commands";

interface WorkbenchPaletteItem {
	id: string;
	category?: string;
	/** Full command name, with the category added only when not already present. */
	displayLabel: string;
	description?: string;
}

/** Render and control the command palette for the nearest workbench. */
export const WorkbenchCommandPalette: FC = () => {
	// Read through the store api, not a selector: `commit` returns a fresh
	// `layout` object on every write, so subscribing to the slice re-rendered
	// this dialog — mounted unconditionally, open or closed — on every store
	// write, including ~120 times a second during a splitter drag. The layout
	// is only ever read to build the commands below, and only while open.
	const store = useWorkbenchStoreApi();

	// list of all the currently registered commands in the workbench
	const commands = useWorkbench((state) => state.command.commands);
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
	const returnFocusRef = useRef<HTMLElement | null>(null);

	// Layout commands use the reserved workbench.layout.* namespace, so they
	// can be registered directly without checking the registry first.
	useEffect(() => {
		if (!isCommandOpen) {
			return;
		}

		// Built once per open. The dock is behind a modal while the palette is
		// up, so its layout cannot change under the user.
		const layoutCommands = buildWorkbenchLayoutCommands(
			store.getState().layout,
		);

		return registerCommand(layoutCommands);
	}, [isCommandOpen, registerCommand, store]);

	const commandSections = useMemo(() => {
		const query = search.trim().toLowerCase();

		const filteredItems: WorkbenchPaletteItem[] = [];
		const itemsById = new Map<string, WorkbenchPaletteItem>();
		for (const c in commands) {
			const command = commands[c];
			if (command.visible === false) {
				continue;
			}
			// Some hosts supply complete action labels (e.g. "Go to Next Panel").
			// Preserve the label verbatim without repeating its category prefix.
			const labelIncludesCategory =
				command.category &&
				[`${command.category} `, `${command.category}:`].some(
					(prefix) =>
						command.label
							.toLowerCase()
							.startsWith(prefix.toLowerCase()),
				);
			const item: WorkbenchPaletteItem = {
				id: command.id,
				category: command.category,
				displayLabel:
					command.category && !labelIncludesCategory
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
	}, [commands, recentCommands, search]);

	const renderCommandItem = (item: WorkbenchPaletteItem) => (
		<CommandItem
			key={item.id}
			value={item.id}
			className="min-h-9 gap-2 rounded-md px-2 py-1 sm:min-h-8"
			title={[item.displayLabel, item.description]
				.filter(Boolean)
				.join(" — ")}
			onSelect={() => {
				executeCommandById(item.id);
			}}
		>
			<span className="min-w-0 flex-1 truncate">{item.displayLabel}</span>
			{item.description ? (
				<span className="max-w-24 truncate text-muted-foreground text-xs sm:max-w-40">
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
				className="gap-0 overflow-hidden bg-popover p-0 text-popover-foreground [scrollbar-gutter:auto] sm:max-w-lg"
				showCloseButton={false}
				onOpenAutoFocus={() => {
					// The palette opens through store actions, without a DialogTrigger.
					returnFocusRef.current =
						document.activeElement instanceof HTMLElement
							? document.activeElement
							: null;
				}}
				onCloseAutoFocus={(event) => {
					if (returnFocusRef.current?.isConnected) {
						event.preventDefault();
						returnFocusRef.current.focus();
					}
				}}
			>
				<DialogHeader className="sr-only">
					<DialogTitle>Workbench Command Palette</DialogTitle>
					<DialogDescription>
						Search commands, then use the arrow keys and Enter to
						run one.
					</DialogDescription>
				</DialogHeader>
				{/* shouldFilter off: the memo above is the only filter, so the
				    alphabetical sort holds while typing instead of cmdk's
				    fuzzy re-ranking */}
				<Command
					shouldFilter={false}
					className="min-h-0 rounded-none [&_[data-slot=command-input-wrapper]]:h-10 [&_[data-slot=command-input-wrapper]]:pe-10"
				>
					<CommandInput
						aria-label="Search workbench commands"
						placeholder="Search commands"
						value={search}
						onValueChange={setSearch}
					/>
					<CommandList className="max-h-80 min-h-0 p-1">
						<CommandEmpty>No commands found.</CommandEmpty>
						{commandSections.recentItems.length > 0 ? (
							<CommandGroup heading="Recent commands">
								{commandSections.recentItems.map(
									renderCommandItem,
								)}
							</CommandGroup>
						) : null}
						{commandSections.remainingItems.length > 0 ? (
							<CommandGroup heading="All commands">
								{commandSections.remainingItems.map(
									renderCommandItem,
								)}
							</CommandGroup>
						) : null}
					</CommandList>
				</Command>
				<DialogClose asChild>
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						className="absolute end-1 top-1 text-muted-foreground"
						aria-label="Close command palette"
					>
						<XIcon aria-hidden="true" />
					</Button>
				</DialogClose>
			</DialogContent>
		</Dialog>
	);
};
