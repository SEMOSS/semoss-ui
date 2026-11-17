import { useRef, useState } from "react";

/**
 * How the user arranged the Files panel's sections, kept in the panel's
 * config so it lasts as long as the layout does.
 */
export interface FileExplorerSectionsLayout {
	/** Section keys, top first. A key not listed goes after the rest. */
	order?: readonly string[];
	/** Each section's share of the height, relative to the others. */
	sizes?: Readonly<Record<string, number>>;
}

/** The shortest a section can be dragged to, in px; matches `min-h-32`. */
export const MIN_SECTION_HEIGHT = 128;

interface UseFileExplorerSectionsOptions {
	/** The sections the panel shows, in their default order. */
	keys: readonly string[];
	/** What the user arranged before, if anything. */
	layout: FileExplorerSectionsLayout | undefined;
	/** Keep a new arrangement. Called once per move and once per resize. */
	onLayoutChange: (layout: FileExplorerSectionsLayout) => void;
}

/** What {@link useFileExplorerSections} gives the panel. */
interface UseFileExplorerSectionsResult {
	/** The sections, in the order they show. */
	order: string[];
	/**
	 * A section's share of the height.
	 *
	 * @param key - The section.
	 * @returns Its flex weight; 1 until the user resizes it.
	 */
	getSize: (key: string) => number;
	/**
	 * Move a section to a place in the order.
	 *
	 * @param key - The section.
	 * @param index - Where it goes, counted without it.
	 */
	move: (key: string, index: number) => void;
	/**
	 * Start resizing two neighbouring sections against each other.
	 *
	 * @param above - The upper section.
	 * @param below - The lower section.
	 * @param heights - Their heights now, in px.
	 */
	startResize: (
		above: string,
		below: string,
		heights: { above: number; below: number },
	) => void;
	/**
	 * Move the line between them.
	 *
	 * @param delta - How far from where the resize started, in px; down is
	 * positive.
	 */
	updateResize: (delta: number) => void;
	/** Keep the sizes the resize ended on. */
	endResize: () => void;
}

/**
 * The order and heights of the Files panel's sections: drag one to move it,
 * drag the line between two to resize them. Sizes are flex weights, so they
 * survive the panel itself being resized.
 *
 * @param options - The sections, their saved arrangement, and where to keep
 * a new one.
 * @returns The order, the sizes, and the actions that change them.
 */
export const useFileExplorerSections = ({
	keys,
	layout,
	onLayoutChange,
}: UseFileExplorerSectionsOptions): UseFileExplorerSectionsResult => {
	// sizes mid-drag stay local, so a resize writes the layout once
	const [draftSizes, setDraftSizes] = useState<Readonly<
		Record<string, number>
	> | null>(null);
	const resizeRef = useRef<{
		above: string;
		below: string;
		heights: { above: number; below: number };
		base: Readonly<Record<string, number>>;
		latest: Readonly<Record<string, number>> | null;
	} | null>(null);

	const sizes = draftSizes ?? layout?.sizes ?? {};
	const saved = (layout?.order ?? []).filter((key) => keys.includes(key));
	const order = [...saved, ...keys.filter((key) => !saved.includes(key))];
	const getSize = (key: string): number => sizes[key] ?? 1;

	const move = (key: string, index: number) => {
		const rest = order.filter((other) => other !== key);
		const clamped = Math.max(0, Math.min(index, rest.length));
		const next = [...rest.slice(0, clamped), key, ...rest.slice(clamped)];
		if (next.every((other, position) => other === order[position])) {
			return;
		}

		onLayoutChange({ ...layout, order: next });
	};

	const startResize = (
		above: string,
		below: string,
		heights: { above: number; below: number },
	) => {
		resizeRef.current = {
			above: above,
			below: below,
			heights: heights,
			base: sizes,
			latest: null,
		};
	};

	const updateResize = (delta: number) => {
		const resize = resizeRef.current;
		if (!resize) {
			return;
		}

		const total = resize.heights.above + resize.heights.below;
		if (total <= 2 * MIN_SECTION_HEIGHT) {
			return;
		}

		const above = Math.max(
			MIN_SECTION_HEIGHT,
			Math.min(total - MIN_SECTION_HEIGHT, resize.heights.above + delta),
		);
		// the pair keeps its combined weight, so the other sections stay put
		const weight =
			(resize.base[resize.above] ?? 1) + (resize.base[resize.below] ?? 1);
		const next = {
			...resize.base,
			[resize.above]: (weight * above) / total,
			[resize.below]: (weight * (total - above)) / total,
		};
		resize.latest = next;
		setDraftSizes(next);
	};

	const endResize = () => {
		const latest = resizeRef.current?.latest;
		resizeRef.current = null;
		setDraftSizes(null);
		if (latest) {
			onLayoutChange({ ...layout, sizes: latest });
		}
	};

	return {
		order: order,
		getSize: getSize,
		move: move,
		startResize: startResize,
		updateResize: updateResize,
		endResize: endResize,
	};
};
