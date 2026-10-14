import type { FC } from "react";
import { cn } from "@semoss/ui/next";
import { WORKBENCH_STYLES } from "../../constants/workbench.constants";
import { useWorkbench } from "../../hooks";
import type { WorkbenchPanelId } from "../../types";

/** The panel's glyph, at whatever size the caller has room for. */
const WorkbenchPanelIcon: FC<{
	pid: WorkbenchPanelId;
	className: string;
}> = ({ pid, className }) => {
	// one narrow selector, not `useWorkbenchPanel(pid)`: that returns a fresh
	// object whenever any field of the panel changes, which re-rendered every
	// tab's icon on every setValue, rename and config write
	const status = useWorkbench(
		(s) =>
			s.layout.componentStatuses[s.layout.panels[pid]?.type ?? ""] ??
			"pending",
	);
	const Icon = useWorkbench((s) => {
		const type = s.layout.panels[pid]?.type;
		return type ? s.layout.components[type]?.icon : undefined;
	});

	if (!Icon) {
		// until a blueprint supplies a glyph, a neutral mark — so an unstyled
		// panel reads as unstyled rather than mislabelled
		return (
			<span
				aria-hidden
				className={cn(
					"flex-none rounded-sm border border-border",
					status === "pending" && "animate-pulse",
					className,
				)}
			/>
		);
	}
	return <Icon id={pid} className={cn("flex-none", className)} />;
};

/**
 * The tab or rail label. A blueprint that supplies no header gets its icon and
 * its name, which is what almost every panel wants.
 */
export const WorkbenchPanelHeaderContent: FC<{
	pid: WorkbenchPanelId;
}> = ({ pid }) => {
	const name = useWorkbench((s) => s.layout.panels[pid]?.name);
	const Header = useWorkbench((s) => {
		const type = s.layout.panels[pid]?.type;
		return type ? s.layout.components[type]?.header : undefined;
	});
	if (Header) {
		return <Header id={pid} />;
	}
	return (
		<>
			<WorkbenchPanelIcon
				pid={pid}
				className={WORKBENCH_STYLES.chromeIcon}
			/>
			<span className="min-w-0 truncate whitespace-nowrap">{name}</span>
		</>
	);
};

/**
 * The active panel's registered chrome control, if any. Panels contribute one
 * via `useWorkbenchControl`; each stack draws only its front tab's control.
 */
export const WorkbenchPanelControls: FC<{
	pid: WorkbenchPanelId | null | undefined;
}> = ({ pid }) => {
	const control = useWorkbench((s) =>
		pid ? s.control.controls[pid] : undefined,
	);
	if (!pid || !control) {
		return null;
	}
	const Content = control.content;
	return (
		// swallow pointerdown so a control click cannot start a tab drag or
		// toggle a rail shut out from under it
		<div
			onPointerDown={(e) => e.stopPropagation()}
			className="flex flex-none items-center gap-1"
		>
			<Content id={pid} />
		</div>
	);
};
