import { File, LayoutPanelTop } from "lucide-react";
import { FILE_PANEL_TYPES, isFilePanelType } from "@semoss/panels";
import {
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
} from "@semoss/ui/next";
import { useWorkbench } from "@semoss/workbench";
import { useWorkPanelActions } from "./use-work-panel-actions";
import { WORK_PANEL_TYPES } from "./work-panel.constants";

const FIXED_PANELS = [
	{ id: "context", type: WORK_PANEL_TYPES.CONTEXT, name: "Context" },
	{ id: "settings", type: WORK_PANEL_TYPES.SETTINGS, name: "Settings" },
	{ id: "tools", type: WORK_PANEL_TYPES.TOOLS, name: "Tools" },
	{ id: "activity", type: WORK_PANEL_TYPES.ACTIVITY, name: "Activity" },
	{ id: "files", type: FILE_PANEL_TYPES.FILE_EXPLORER, name: "Files" },
];

/** Fixed destinations first, then each file and result opened during the conversation. */
export function WorkPanelSwitcher() {
	const panelActions = useWorkPanelActions();
	const panels = useWorkbench((state) => state.layout.panels);
	const stacks = useWorkbench((state) => state.layout.stacks);
	const actions = useWorkbench((state) => state.layout.actions);
	const selectedId = useWorkbench(
		(state) =>
			(state.layout.isMobileLayout
				? state.layout.mobileActivePanelId
				: state.layout.selection.panel) ?? "",
	);
	const dynamic = stacks.flatMap((stack) =>
		stack.panelIds.flatMap((id) => {
			const panel = panels[id];
			return panel &&
				!FIXED_PANELS.some((fixed) => fixed.type === panel.type)
				? [{ panel, stack }]
				: [];
		}),
	);
	const groups = [
		{
			label: "Open files",
			items: dynamic.filter(({ panel }) => isFilePanelType(panel.type)),
		},
		{
			label: "Results and runs",
			items: dynamic.filter(({ panel }) => !isFilePanelType(panel.type)),
		},
	].filter((group) => group.items.length > 0);
	return (
		<DropdownMenuRadioGroup value={selectedId}>
			<DropdownMenuLabel className="py-1 text-muted-foreground text-xs">
				Panels
			</DropdownMenuLabel>
			{FIXED_PANELS.map((fixed) => {
				const action = panelActions.find(
					(candidate) => candidate.id === fixed.id,
				);
				if (!action) return null;
				const existing = Object.values(panels).find(
					(panel) => panel.type === fixed.type,
				);
				return (
					<DropdownMenuRadioItem
						key={fixed.id}
						value={existing?.id ?? `open-${fixed.id}`}
						className="min-h-8 py-1 text-xs md:min-h-7"
						disabled={action.disabled}
						onSelect={action.onSelect}
					>
						<action.icon aria-hidden="true" className="size-3.5" />
						{fixed.name}
					</DropdownMenuRadioItem>
				);
			})}
			{groups.map((group) => (
				<div key={group.label}>
					<DropdownMenuSeparator />
					<DropdownMenuLabel className="py-1 text-muted-foreground text-xs">
						{group.label}
					</DropdownMenuLabel>
					{group.items.map(({ panel, stack }) => (
						<DropdownMenuRadioItem
							key={panel.id}
							value={panel.id}
							className="min-h-8 py-1 text-xs md:min-h-7"
							title={
								typeof panel.config?.path === "string"
									? panel.config.path
									: panel.name
							}
							onSelect={() =>
								actions.activatePanel(stack, panel.id)
							}
						>
							{isFilePanelType(panel.type) ? (
								<File aria-hidden="true" className="size-3.5" />
							) : (
								<LayoutPanelTop
									aria-hidden="true"
									className="size-3.5"
								/>
							)}
							<span className="min-w-0 truncate">
								{panel.name}
							</span>
						</DropdownMenuRadioItem>
					))}
				</div>
			))}
		</DropdownMenuRadioGroup>
	);
}
