import { type FC, useEffect, useMemo, useState } from "react";
import { useWorkbench } from "@/hooks";
import type { WorkbenchPanelId } from "@/stores/workbench";
import { WorkbenchPanelHost } from "./workbench-panel-host";

/**
 * The flat overlay that hosts every panel body. Which bodies exist follows
 * the mount policy: the visible ones always, `keepAlive` ones once they have
 * been shown, and `eager` ones as soon as the instance is docked anywhere.
 */
export const WorkbenchPanelLayer: FC = () => {
	const panels = useWorkbench((s) => s.layout.panels);
	const components = useWorkbench((s) => s.layout.components);
	const panelSlots = useWorkbench((s) => s.layout.panelSlots);
	const visiblePanelIds = useWorkbench((s) => s.layout.visiblePanelIds);
	const tabsets = useWorkbench((s) => s.layout.tabsets);

	// once shown, a panel is mounted; keepAlive/eager ones stay that way
	const [mounted, setMounted] = useState<Record<WorkbenchPanelId, true>>({});
	useEffect(() => {
		setMounted((current) => {
			let next = current;
			for (const pid of visiblePanelIds) {
				if (!next[pid]) {
					next = { ...next, [pid]: true };
				}
			}
			return next;
		});
	}, [visiblePanelIds]);

	/** Second viewports: same instance, drawn again over the split slot. */
	const splitViewports = useMemo(
		() =>
			tabsets
				.filter((tabset) => tabset.split && tabset.activeId)
				.map((tabset) => ({
					pid: tabset.activeId as WorkbenchPanelId,
					slot: `${tabset.id}::b`,
				})),
		[tabsets],
	);

	const rendered = useMemo(
		() =>
			Object.keys(panels).filter((pid) => {
				const slot = panelSlots[pid];
				if (!slot) {
					// closed panels keep their record but render nothing
					return false;
				}
				if (slot.active) {
					return true;
				}
				const mount = components[panels[pid].type]?.mount ?? "lazy";
				if (mount === "eager") {
					return true;
				}
				if (mount === "keepAlive") {
					return Boolean(mounted[pid]);
				}
				return false;
			}),
		[panels, panelSlots, components, mounted],
	);

	return (
		<div
			data-testid="workbench-panel-layer"
			className="pointer-events-none absolute inset-0"
		>
			{splitViewports.map(({ pid, slot }) => (
				<WorkbenchPanelHost
					key={`${pid}::b`}
					pid={pid}
					slotKeyOverride={slot}
					secondary
				/>
			))}
			{rendered.map((pid) => (
				<WorkbenchPanelHost key={pid} pid={pid} />
			))}
		</div>
	);
};
