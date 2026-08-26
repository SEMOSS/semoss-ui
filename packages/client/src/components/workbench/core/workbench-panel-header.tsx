import type { FC } from "react";
import { cn } from "@semoss/ui/next";
import { useWorkbench } from "@/hooks";
import type {
	WorkbenchHeaderLocation,
	WorkbenchPanelId,
} from "@/stores/workbench";
import { useWorkbenchPanel } from "./use-workbench-panel";
import { CHROME_ICON } from "./workbench.chrome";

/** The panel's glyph, at whatever size the caller has room for. */
export const WorkbenchPanelIcon: FC<{
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
				className={CHROME_ICON}
			/>
			<span className="min-w-0 truncate whitespace-nowrap">{name}</span>
		</>
	);
};

/** Header controls a blueprint contributes, if any. */
export const WorkbenchPanelControls: FC<{
	pid: WorkbenchPanelId | null | undefined;
}> = ({ pid }) => {
	const safePid = pid ?? "";
	const chrome = useWorkbenchPanel(safePid, "tab");
	const Controls = useWorkbench((s) => {
		const type = safePid ? s.layout.panels[safePid]?.type : undefined;
		return type ? s.layout.components[type]?.controls : undefined;
	});
	if (!pid || !Controls) {
		return null;
	}
	return <Controls {...chrome} />;
};
