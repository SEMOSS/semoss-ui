import type { FC } from "react";
import { cn } from "@semoss/ui/next";
import { useWorkbench } from "@/hooks";
import type {
	WorkbenchHeaderLocation,
	WorkbenchPanelId,
} from "@/stores/workbench";
import { useWorkbenchPanel } from "./use-workbench-panel";
import { WORKBENCH_STYLES } from "./workbench.chrome";

/** The panel's glyph, at whatever size the caller has room for. */
const WorkbenchPanelIcon: FC<{
	pid: WorkbenchPanelId;
	location: WorkbenchHeaderLocation;
	className: string;
}> = ({ pid, location, className }) => {
	const chrome = useWorkbenchPanel(pid, location);
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
					chrome.status === "pending" && "animate-pulse",
					className,
				)}
			/>
		);
	}
	return <Icon {...chrome} className={cn("flex-none", className)} />;
};

/**
 * The tab or rail label. A blueprint that supplies no header gets its icon and
 * its name, which is what almost every panel wants. `location` reaches the
 * blueprint's own header too, so a panel can draw itself differently on a
 * vertical rail than in a tab.
 */
export const WorkbenchPanelHeaderContent: FC<{
	pid: WorkbenchPanelId;
	location: WorkbenchHeaderLocation;
}> = ({ pid, location }) => {
	const chrome = useWorkbenchPanel(pid, location);
	const name = useWorkbench((s) => s.layout.panels[pid]?.name);
	const Header = useWorkbench((s) => {
		const type = s.layout.panels[pid]?.type;
		return type ? s.layout.components[type]?.header : undefined;
	});
	if (Header) {
		return <Header {...chrome} />;
	}
	return (
		<>
			<WorkbenchPanelIcon
				pid={pid}
				location={location}
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
	location: WorkbenchHeaderLocation;
}> = ({ pid, location }) => {
	const safePid = pid ?? "";
	const chrome = useWorkbenchPanel(safePid, location);
	const control = useWorkbench((s) =>
		safePid ? s.control.controls[safePid] : undefined,
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
			<Content {...chrome} />
		</div>
	);
};
