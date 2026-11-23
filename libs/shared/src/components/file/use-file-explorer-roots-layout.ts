import { useState } from "react";
import type { FileExplorerRootsLayout } from "./file-explorer-root.types";

interface UseFileExplorerRootsLayoutOptions {
	/** The roots, in their default order. */
	ids: readonly string[];
	/** The arrangement the host keeps; left out, the explorer keeps its own. */
	layout: FileExplorerRootsLayout | undefined;
	/** Keep a new arrangement. Called once per move and toggle. */
	onLayoutChange: ((layout: FileExplorerRootsLayout) => void) | undefined;
}

/** What {@link useFileExplorerRootsLayout} gives the explorer. */
interface UseFileExplorerRootsLayoutResult {
	/** The roots, in the order they show. */
	order: string[];
	/**
	 * Whether a root is open.
	 *
	 * @param id - The root.
	 * @returns False once the user closed it.
	 */
	isExpanded: (id: string) => boolean;
	/**
	 * Open or close a root.
	 *
	 * @param id - The root.
	 */
	toggle: (id: string) => void;
	/**
	 * Move a root to a place in the order.
	 *
	 * @param id - The root.
	 * @param index - Where it goes, counted without it.
	 */
	move: (id: string, index: number) => void;
}

/**
 * The order and open state of a `FileExplorer`'s roots: drag a root row to
 * move it, press it to close it.
 *
 * @param options - The roots, their saved arrangement, and where to keep a
 * new one.
 * @returns The arrangement and the actions that change it.
 */
export const useFileExplorerRootsLayout = ({
	ids,
	layout,
	onLayoutChange,
}: UseFileExplorerRootsLayoutOptions): UseFileExplorerRootsLayoutResult => {
	// a host that keeps no layout still gets one for as long as it is mounted
	const [ownLayout, setOwnLayout] = useState<FileExplorerRootsLayout>({});
	const current = layout ?? ownLayout;
	const commit = (next: FileExplorerRootsLayout) => {
		if (!layout) {
			setOwnLayout(next);
		}
		onLayoutChange?.(next);
	};

	const collapsed = current.collapsed ?? [];
	const saved = (current.order ?? []).filter((id) => ids.includes(id));
	const order = [...saved, ...ids.filter((id) => !saved.includes(id))];

	const move = (id: string, index: number) => {
		const rest = order.filter((other) => other !== id);
		const clamped = Math.max(0, Math.min(index, rest.length));
		const next = [...rest.slice(0, clamped), id, ...rest.slice(clamped)];
		if (next.every((other, position) => other === order[position])) {
			return;
		}

		commit({ ...current, order: next });
	};

	const toggle = (id: string) =>
		commit({
			...current,
			collapsed: collapsed.includes(id)
				? collapsed.filter((other) => other !== id)
				: [...collapsed, id],
		});

	return {
		order: order,
		isExpanded: (id) => !collapsed.includes(id),
		toggle: toggle,
		move: move,
	};
};
