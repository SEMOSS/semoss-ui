import {
	ChevronDown,
	Command,
	FilePlus2,
	FolderOpen,
	FolderPlus,
	Upload,
} from "lucide-react";
import { type ComponentProps, useEffect, useRef, useState } from "react";
import {
	FILE_PANEL_EVENTS,
	type FilePanelMode,
	getFilePanelScope,
} from "@semoss/panels";
import { NewFileOverlay } from "@semoss/shared";
import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@semoss/ui/next";
import { useWorkbench } from "@semoss/workbench";
import { useToolWorkbench } from "@/features/tools/tool-workbench.context";
import { useWorkPanelActions } from "./use-work-panel-actions";
import { useWorkThread } from "./work-thread-context";

interface CreationRequest
	extends Pick<ComponentProps<typeof NewFileOverlay>, "path" | "action"> {
	mode: FilePanelMode;
}

const FIXED_PANELS = [
	{ id: "emails", label: "Emails" },
	{ id: "context", label: "Context" },
	{ id: "tools", label: "Tools" },
	{ id: "activity", label: "Activity" },
	{ id: "settings", label: "Settings" },
];
const MENU_ITEM_CLASS = "min-h-11 py-1 text-xs md:min-h-7";

/** Fixed workspace actions, independent of the selected file or panel. */
export function WorkPanelMenu() {
	const panelActions = useWorkPanelActions();
	const workbench = useToolWorkbench();
	const { snapshot } = useWorkThread();
	const emit = useWorkbench((state) => state.events.actions.emit);
	const setCommandOpen = useWorkbench(
		(state) => state.command.actions.setCommandOpen,
	);
	const isCommandOpen = useWorkbench((state) => state.command.isCommandOpen);
	const [isOpen, setIsOpen] = useState(false);
	const [creation, setCreation] = useState<CreationRequest | null>(null);
	const trigger = useRef<HTMLButtonElement>(null);
	const isOpeningOverlay = useRef(false);
	const commandsFromMenu = useRef(false);
	// The shared palette has no trigger of its own; restore this menu’s focus only when it opened it.
	useEffect(() => {
		if (isCommandOpen || !commandsFromMenu.current) return;
		commandsFromMenu.current = false;
		if (!workbench.isOpen) return;
		const frame = requestAnimationFrame(() => trigger.current?.focus());
		return () => cancelAnimationFrame(frame);
	}, [isCommandOpen, workbench.isOpen]);
	const isReady = snapshot.isReady && Boolean(workbench.insightId);
	const browse = panelActions.find((action) => action.id === "files");
	const openCreation = (action: CreationRequest["action"]) => {
		if (!isReady) return;
		isOpeningOverlay.current = true;
		setCreation({
			action,
			mode: { type: "INSIGHT", insightId: workbench.insightId },
			path: "/",
		});
	};
	const closeCreation = (success: boolean) => {
		if (success && creation)
			emit(FILE_PANEL_EVENTS.FILES_CHANGED, {
				scope: getFilePanelScope(creation.mode),
			});
		setCreation(null);
		requestAnimationFrame(() => trigger.current?.focus());
	};
	return (
		<>
			<DropdownMenu
				open={isOpen && workbench.isOpen}
				onOpenChange={setIsOpen}
			>
				<DropdownMenuTrigger asChild>
					<Button
						ref={trigger}
						type="button"
						variant="ghost"
						size="sm"
						className="h-11 min-w-11 gap-1 px-2 text-muted-foreground text-xs data-[state=open]:bg-accent data-[state=open]:text-foreground md:h-7"
					>
						File
						<ChevronDown aria-hidden="true" className="size-3.5" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent
					align="start"
					className="w-56"
					onCloseAutoFocus={(event) => {
						if (isOpeningOverlay.current) event.preventDefault();
						isOpeningOverlay.current = false;
					}}
				>
					<DropdownMenuGroup>
						<DropdownMenuItem
							className={MENU_ITEM_CLASS}
							disabled={browse?.disabled || !isReady}
							onSelect={browse?.onSelect}
						>
							<FolderOpen
								aria-hidden="true"
								className="size-3.5"
							/>
							Browse files…
						</DropdownMenuItem>
						<DropdownMenuItem
							className={MENU_ITEM_CLASS}
							disabled={!isReady}
							onSelect={() => openCreation("add_file")}
						>
							<FilePlus2
								aria-hidden="true"
								className="size-3.5"
							/>
							New file…
						</DropdownMenuItem>
						<DropdownMenuItem
							className={MENU_ITEM_CLASS}
							disabled={!isReady}
							onSelect={() => openCreation("add_directory")}
						>
							<FolderPlus
								aria-hidden="true"
								className="size-3.5"
							/>
							New folder…
						</DropdownMenuItem>
						<DropdownMenuItem
							className={MENU_ITEM_CLASS}
							disabled={!isReady}
							onSelect={() => openCreation("upload")}
						>
							<Upload aria-hidden="true" className="size-3.5" />
							Upload files…
						</DropdownMenuItem>
					</DropdownMenuGroup>
					<DropdownMenuSeparator />
					<DropdownMenuGroup>
						{FIXED_PANELS.map((panel) => {
							const action = panelActions.find(
								(candidate) => candidate.id === panel.id,
							);
							if (!action) return null;
							return (
								<DropdownMenuItem
									key={panel.id}
									className={MENU_ITEM_CLASS}
									disabled={action.disabled}
									onSelect={action.onSelect}
								>
									<action.icon
										aria-hidden="true"
										className="size-3.5"
									/>
									{panel.label}
								</DropdownMenuItem>
							);
						})}
					</DropdownMenuGroup>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						className={MENU_ITEM_CLASS}
						onSelect={() => {
							isOpeningOverlay.current = true;
							commandsFromMenu.current = true;
							setCommandOpen(true);
						}}
					>
						<Command aria-hidden="true" className="size-3.5" />
						Commands…
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
			{creation && workbench.isOpen && (
				<NewFileOverlay {...creation} open onClose={closeCreation} />
			)}
		</>
	);
}
