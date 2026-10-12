import { Command } from "lucide-react";
import { Activity, useCallback, useEffect, useRef, useState } from "react";
import { Button, useIsMobile } from "@semoss/ui/next";
import {
	Workbench,
	WorkbenchChromeButton,
	WorkbenchProvider,
} from "@semoss/workbench";
import { useToolWorkbench } from "../tool-workbench.context";
import { ToolWorkbenchFocusContext } from "../tool-workbench-focus.context";

/** Room dock with panel navigation and a command palette shortcut. */
export function ToolWorkbench() {
	const workbench = useToolWorkbench();
	const { snapshot, store, closeWorkbench, isOpen } = workbench;
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
								}}
							/>
						</div>
					</section>
				</WorkbenchProvider>
			</ToolWorkbenchFocusContext.Provider>
		</Activity>
	);
}
