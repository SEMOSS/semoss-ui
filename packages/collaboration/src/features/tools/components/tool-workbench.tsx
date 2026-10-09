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
	const [containerWidth, setContainerWidth] = useState<number | null>(null);
	const isCompact = containerWidth === null ? isMobile : containerWidth < 768;
	useEffect(() => {
		if (!isOpen || !dock.current) return;
		const element = dock.current;
		const measure = () => {
			const width = element.getBoundingClientRect().width;
			if (width > 0) setContainerWidth(width);
		};
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(element);
		return () => observer.disconnect();
	}, [isOpen]);
	useEffect(() => {
		if (!isCompact || !isOpen) return;
		// Activity must reveal retained panels before the mobile control can focus.
		const frame = window.requestAnimationFrame(() => {
			if (!dock.current?.contains(document.activeElement)) {
				backButton.current?.focus();
			}
		});
		return () => window.cancelAnimationFrame(frame);
	}, [isCompact, isOpen]);

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
						data-compact={isCompact}
						aria-label="Workbench panels"
						tabIndex={-1}
						className="focus-visible:-outline-offset-2 flex size-full min-h-0 min-w-0 flex-col focus-visible:outline-2 focus-visible:outline-ring"
					>
						{isCompact && (
							<Button
								ref={backButton}
								type="button"
								variant="ghost"
								className="shrink-0"
								onClick={closeWorkbench}
							>
								Back to conversation
							</Button>
						)}
						{fileError && (
							<p
								role="alert"
								className="shrink-0 px-3 py-2 text-destructive text-sm"
							>
								{fileError}
							</p>
						)}
						<div className="relative min-h-0 min-w-0 flex-1">
							<Workbench
								layoutMode={isCompact ? "compact" : "auto"}
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
