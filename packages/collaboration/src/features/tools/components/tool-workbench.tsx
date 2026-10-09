import { Command, FolderTree, Settings2 } from "lucide-react";
import { Activity, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Alert,
	AlertDescription,
	Button,
	DropdownMenuItem,
	useIsMobile,
} from "@semoss/ui/next";
import {
	Workbench,
	WorkbenchChromeButton,
	WorkbenchMenus,
	WorkbenchProvider,
} from "@semoss/workbench";
import { openToolWorkbenchFiles } from "../open-tool-workbench-files";
import {
	CALENDAR_PANEL_TYPE,
	EMAILS_PANEL_TYPE,
} from "../tool-workbench.constants";
import { useToolWorkbench } from "../tool-workbench.context";
import { ToolWorkbenchFocusContext } from "../tool-workbench-focus.context";
import { useWorkbenchCompactLayout } from "../use-workbench-compact-layout";

interface ToolWorkbenchProps {
	onOpenSettings?: () => void;
	/** Draft rooms bind an insight before exposing file operations. */
	onOpenFiles?: () => Promise<void> | void;
	isOpeningFiles?: boolean;
	filesDisabled?: boolean;
}

/** Room dock with file and settings actions plus a command palette shortcut. */
export function ToolWorkbench({
	onOpenSettings,
	onOpenFiles,
	isOpeningFiles = false,
	filesDisabled = false,
}: ToolWorkbenchProps) {
	const workbench = useToolWorkbench();
	const { snapshot, store, closeWorkbench, isOpen } = workbench;
	const { t } = useTranslation("sidebar");
	const [isPreparingFiles, setIsPreparingFiles] = useState(false);
	const [fileError, setFileError] = useState<string | null>(null);
	const backButton = useRef<HTMLButtonElement>(null);
	const dock = useRef<HTMLElement>(null);
	const isCompact = useWorkbenchCompactLayout(dock, isOpen);
	const focusWorkbench = useCallback(() => dock.current?.focus(), []);
	const isMobile = useIsMobile();
	useEffect(() => {
		const actions = store.getState().layout.actions;
		for (const [type, key] of [
			[EMAILS_PANEL_TYPE, "emails"],
			[CALENDAR_PANEL_TYPE, "calendar"],
		] as const) {
			for (const panel of actions.findPanels(
				(candidate) => candidate.type === type,
			)) {
				actions.updatePanel(panel.id, { name: t(`workbench.${key}`) });
			}
		}
	}, [store, t]);

	useEffect(() => {
		if (!isMobile || !isOpen) return;
		// Activity must reveal retained panels before the mobile control can focus.
		const frame = window.requestAnimationFrame(() =>
			backButton.current?.focus(),
		);
		return () => window.cancelAnimationFrame(frame);
	}, [isMobile, isOpen]);

	async function showFiles() {
		if (isPreparingFiles || isOpeningFiles || filesDisabled) return;
		setFileError(null);
		setIsPreparingFiles(true);
		try {
			if (onOpenFiles) await onOpenFiles();
			else openToolWorkbenchFiles(workbench);
		} catch (error) {
			setFileError(
				error instanceof Error
					? error.message
					: t("workbench.filesError"),
			);
		} finally {
			setIsPreparingFiles(false);
		}
	}

	return (
		<Activity mode={isOpen ? "visible" : "hidden"}>
			<ToolWorkbenchFocusContext.Provider value={focusWorkbench}>
				<WorkbenchProvider store={store}>
					<section
						ref={dock}
						aria-label={t("workbench.panels")}
						tabIndex={-1}
						className="focus-visible:-outline-offset-2 flex size-full min-h-0 flex-col focus-visible:outline-2 focus-visible:outline-ring"
					>
						<Button
							ref={backButton}
							type="button"
							variant="ghost"
							className="shrink-0 md:hidden"
							onClick={closeWorkbench}
						>
							{t("workbench.backToConversation")}
						</Button>
						{fileError && (
							<Alert
								variant="destructive"
								className="shrink-0 rounded-none"
							>
								<AlertDescription>{fileError}</AlertDescription>
							</Alert>
						)}
						<div className="relative min-h-0 flex-1">
							<Workbench
								snapshot={snapshot}
								layoutMode={isCompact ? "compact" : "auto"}
								mobileTopBorder="toolbar"
								borderSlots={{
									left: {
										after: ({ onNavigate }) => (
											<WorkbenchChromeButton
												icon={Command}
												label={t(
													"workbench.commandPalette",
												)}
												onClick={() => {
													onNavigate?.();
													requestAnimationFrame(() =>
														store
															.getState()
															.command.actions.setCommandOpen(
																true,
															),
													);
												}}
											/>
										),
									},
									top: {
										before: ({ onNavigate }) => (
											<WorkbenchMenus
												translate={(key) =>
													t(
														`workbench.${key === "view" ? "file" : key}`,
													)
												}
												textSize="xs"
												showChevron
												showNavigation={false}
												showLayoutActions={false}
												showCommandPalette={false}
												onNavigate={onNavigate}
												viewItems={
													<>
														<DropdownMenuItem
															className="pointer-coarse:min-h-11"
															disabled={
																filesDisabled ||
																isPreparingFiles ||
																isOpeningFiles
															}
															onSelect={() => {
																void showFiles();
																onNavigate?.();
															}}
														>
															<FolderTree aria-hidden="true" />
															{isPreparingFiles ||
															isOpeningFiles
																? t(
																		"workbench.openingFiles",
																	)
																: t(
																		"workbench.showFiles",
																	)}
														</DropdownMenuItem>
														{onOpenSettings && (
															<DropdownMenuItem
																className="pointer-coarse:min-h-11"
																onSelect={() => {
																	onOpenSettings();
																	onNavigate?.();
																}}
															>
																<Settings2 aria-hidden="true" />
																{t(
																	"workbench.openSettings",
																)}
															</DropdownMenuItem>
														)}
													</>
												}
											/>
										),
									},
								}}
							/>
						</div>
					</section>
				</WorkbenchProvider>
			</ToolWorkbenchFocusContext.Provider>
		</Activity>
	);
}
