import { Command, FolderTree, Settings2 } from "lucide-react";
import { Activity, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { Button, DropdownMenuItem, useIsMobile } from "@semoss/ui/next";
import {
	Workbench,
	WorkbenchChromeButton,
	WorkbenchMenus,
	WorkbenchProvider,
} from "@semoss/workbench";
import { openToolWorkbenchFiles } from "../open-tool-workbench-files";
import { useToolWorkbench } from "../tool-workbench.context";
import { ToolWorkbenchFocusContext } from "../tool-workbench-focus.context";

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
	const focusWorkbench = useCallback(() => dock.current?.focus(), []);
	const isMobile = useIsMobile();
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
					: "Unable to open room files. Try again.",
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
						aria-label="Workbench panels"
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
							Back to conversation
						</Button>
						{fileError && (
							<p
								role="alert"
								className="shrink-0 px-3 py-2 text-destructive text-sm"
							>
								{fileError}
							</p>
						)}
						<div className="relative min-h-0 flex-1">
							<Workbench
								snapshot={snapshot}
								borderSlots={{
									left: {
										after: ({ onNavigate }) => (
											<WorkbenchChromeButton
												icon={Command}
												label="Open command palette"
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
																? "Opening chat files…"
																: "Show chat files"}
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
																Open settings
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
