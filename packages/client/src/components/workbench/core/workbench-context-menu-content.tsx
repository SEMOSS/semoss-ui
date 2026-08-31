import { type FC, Fragment, type ReactNode } from "react";
import {
	ContextMenuContent,
	ContextMenuGroup,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuSub,
	ContextMenuSubContent,
	ContextMenuSubTrigger,
} from "@semoss/ui/next";
import { useWorkbench, useWorkbenchStoreApi } from "@/hooks";
import type {
	WorkbenchPanelId,
	WorkbenchPanelMenuItem,
	WorkbenchSide,
} from "@/stores/workbench";
import {
	findTabsetOf,
	WORKBENCH_SIDES,
	workbenchPanelProps,
} from "@/stores/workbench";

const sideLabel = (side: WorkbenchSide): string =>
	`${side[0].toUpperCase()}${side.slice(1)} Border`;

/** The dock splits, in reading order. */
const SPLIT_DIRECTIONS: Array<{ dir: WorkbenchSide; label: string }> = [
	{ dir: "top", label: "Up" },
	{ dir: "bottom", label: "Down" },
	{ dir: "left", label: "Left" },
	{ dir: "right", label: "Right" },
];

/**
 * The menu body. The menu depends on where the panel lives: a rail icon has no
 * tab strip behind it, so pinning, splits, and "close others" are meaningless
 * there — it gets moves and collapse instead. Unavailable commands are dropped
 * entirely rather than rendered greyed out, and a group whose commands are all
 * gone takes its separator with it.
 */
export const WorkbenchPanelMenuContent: FC<{ pid: WorkbenchPanelId }> = ({
	pid,
}) => {
	const store = useWorkbenchStoreApi();
	const actions = useWorkbench((s) => s.layout.actions);
	const readOnly = useWorkbench((s) => s.layout.readOnly);
	const panels = useWorkbench((s) => s.layout.panels);
	const tree = useWorkbench((s) => s.layout.tree);
	const borders = useWorkbench((s) => s.layout.borders);
	const main = useWorkbench((s) => s.layout.tabsets[0]);

	const record = panels[pid];
	if (!record) {
		return null;
	}

	const closable = actions.canClose(pid);
	const draggable = actions.canDrag(pid) && !readOnly;
	const renamable = actions.canRename(pid) && !readOnly;

	// whatever the panel's own blueprint contributes, guarded so a broken
	// panel can't take the menu down with it
	let contributed: WorkbenchPanelMenuItem[] = [];
	const make = store.getState().layout.components[record.type]?.menuItems;
	if (typeof make === "function") {
		try {
			contributed = (
				make(
					workbenchPanelProps(store.getState().layout, pid),
					store.getState,
				) ?? []
			).filter((item) => !item.disabled);
		} catch {
			// ignore a broken contributor
		}
	}

	// the panel's own commands lead; the shell's built-ins follow
	const customGroup = contributed.length ? (
		<ContextMenuGroup>
			{contributed.map((item) => (
				<ContextMenuItem key={item.id} onSelect={() => item.run()}>
					{item.label}
				</ContextMenuItem>
			))}
		</ContextMenuGroup>
	) : null;

	const render = (groups: Array<[string, ReactNode]>) => {
		const visible = groups.filter(([, node]) => node);
		if (!visible.length) {
			return null;
		}
		return (
			<ContextMenuContent
				className="w-52"
				data-testid="workbench-context-menu"
				onCloseAutoFocus={(e) => e.preventDefault()}
			>
				{visible.map(([key, node], index) => (
					<Fragment key={key}>
						{index > 0 ? <ContextMenuSeparator /> : null}
						{node}
					</Fragment>
				))}
			</ContextMenuContent>
		);
	};

	const side = WORKBENCH_SIDES.find((candidate) =>
		borders[candidate].panelIds.includes(pid),
	);

	if (side) {
		const open = borders[side].activeId === pid;
		const editGroup = (
			<ContextMenuGroup>
				{renamable ? (
					<ContextMenuItem
						onSelect={() => actions.setEditingPanel(pid)}
					>
						Rename
					</ContextMenuItem>
				) : null}
				<ContextMenuItem
					onSelect={() => actions.toggleBorderPanel(side, pid)}
				>
					{open ? "Collapse to rail" : "Open"}
				</ContextMenuItem>
			</ContextMenuGroup>
		);
		const moveGroup = draggable ? (
			<ContextMenuGroup>
				<ContextMenuSub>
					<ContextMenuSubTrigger>Move</ContextMenuSubTrigger>
					<ContextMenuSubContent>
						{main ? (
							<ContextMenuItem
								onSelect={() =>
									actions.movePanel(pid, {
										kind: "join",
										tabsetId: main.id,
									})
								}
							>
								Main Area
							</ContextMenuItem>
						) : null}
						{WORKBENCH_SIDES.filter(
							(target) => target !== side,
						).map((target) => (
							<ContextMenuItem
								key={target}
								onSelect={() =>
									actions.movePanel(pid, {
										kind: "border",
										side: target,
									})
								}
							>
								{sideLabel(target)}
							</ContextMenuItem>
						))}
					</ContextMenuSubContent>
				</ContextMenuSub>
			</ContextMenuGroup>
		) : null;
		const closeGroup = closable ? (
			<ContextMenuGroup>
				<ContextMenuItem onSelect={() => actions.closePanel(pid)}>
					Close
				</ContextMenuItem>
			</ContextMenuGroup>
		) : null;
		return render([
			["custom", customGroup],
			["edit", editGroup],
			["layout", moveGroup],
			["close", closeGroup],
		]);
	}

	const host = findTabsetOf(tree, pid);
	const closableSibling = (candidate: WorkbenchPanelId) =>
		actions.canClose(candidate) && !panels[candidate]?.pinned;
	const others = host
		? host.panelIds.filter((x) => x !== pid && closableSibling(x))
		: [];
	const rightOf = host
		? host.panelIds
				.slice(host.panelIds.indexOf(pid) + 1)
				.filter(closableSibling)
		: [];

	const editGroup =
		renamable || !readOnly ? (
			<ContextMenuGroup>
				{renamable ? (
					<ContextMenuItem
						onSelect={() => actions.setEditingPanel(pid)}
					>
						Rename
					</ContextMenuItem>
				) : null}
				{!readOnly ? (
					<ContextMenuItem
						onSelect={() => actions.setPinned(pid, !record.pinned)}
					>
						{record.pinned ? "Unpin" : "Pin"}
					</ContextMenuItem>
				) : null}
			</ContextMenuGroup>
		) : null;

	const closeGroup =
		closable || others.length || rightOf.length ? (
			<ContextMenuGroup>
				{closable ? (
					<ContextMenuItem onSelect={() => actions.closePanel(pid)}>
						Close
					</ContextMenuItem>
				) : null}
				{others.length ? (
					<ContextMenuItem
						onSelect={() => {
							for (const other of others) {
								actions.closePanel(other);
							}
						}}
					>
						Close Others
					</ContextMenuItem>
				) : null}
				{rightOf.length ? (
					<ContextMenuItem
						onSelect={() => {
							for (const other of rightOf) {
								actions.closePanel(other);
							}
						}}
					>
						Close to the Right
					</ContextMenuItem>
				) : null}
			</ContextMenuGroup>
		) : null;

	// splitting a lone tab out of its own dock is a tree no-op, so a
	// single-tab dock offers no Split at all
	const canSplit = draggable && (host?.panelIds.length ?? 0) > 1;
	// the in-place viewport split is opt-in per panel type
	const canSplitTab = !readOnly && actions.canSplitTab(pid);

	const layoutGroup =
		host && (canSplit || canSplitTab || draggable) ? (
			<ContextMenuGroup>
				{canSplit ? (
					<ContextMenuSub>
						<ContextMenuSubTrigger>Split</ContextMenuSubTrigger>
						<ContextMenuSubContent>
							{SPLIT_DIRECTIONS.map(({ dir, label }) => (
								<ContextMenuItem
									key={dir}
									onSelect={() =>
										actions.movePanel(pid, {
											kind: "split",
											tabsetId: host.id,
											dir,
										})
									}
								>
									{label}
								</ContextMenuItem>
							))}
						</ContextMenuSubContent>
					</ContextMenuSub>
				) : null}
				{canSplitTab ? (
					<ContextMenuSub>
						<ContextMenuSubTrigger>Split Tab</ContextMenuSubTrigger>
						<ContextMenuSubContent>
							{host.split?.dir !== "row" ? (
								<ContextMenuItem
									onSelect={() =>
										actions.splitInTab(host.id, "row")
									}
								>
									Right
								</ContextMenuItem>
							) : null}
							{host.split?.dir !== "col" ? (
								<ContextMenuItem
									onSelect={() =>
										actions.splitInTab(host.id, "col")
									}
								>
									Down
								</ContextMenuItem>
							) : null}
							{host.split ? (
								<ContextMenuItem
									onSelect={() =>
										actions.splitInTab(host.id, "off")
									}
								>
									Unsplit
								</ContextMenuItem>
							) : null}
						</ContextMenuSubContent>
					</ContextMenuSub>
				) : null}
				{draggable ? (
					<ContextMenuSub>
						<ContextMenuSubTrigger>Move</ContextMenuSubTrigger>
						<ContextMenuSubContent>
							{WORKBENCH_SIDES.map((target) => (
								<ContextMenuItem
									key={target}
									onSelect={() =>
										actions.movePanel(pid, {
											kind: "border",
											side: target,
										})
									}
								>
									{sideLabel(target)}
								</ContextMenuItem>
							))}
						</ContextMenuSubContent>
					</ContextMenuSub>
				) : null}
			</ContextMenuGroup>
		) : null;

	return render([
		["custom", customGroup],
		["edit", editGroup],
		["close", closeGroup],
		["layout", layoutGroup],
	]);
};
