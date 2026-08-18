import { FlexLayout } from "@semoss/shared";
import { getWorkbenchCacheKey } from "../workbench.constants";
import type { WorkbenchCacheOptions, WorkbenchSlice } from "../workbench.types";

/** FlexLayout state owned by each workbench instance. */
export interface WorkbenchLayoutSliceState {
	/** Unique identity for this workbench instance. */
	id: string;

	/** Mutable FlexLayout model owned by this workbench. */
	model: FlexLayout.Model;

	/** Revision incremented after every change to the mutable FlexLayout model. */
	key: number;

	/** Current active panel */
	activePanel: string;

	/** localStorage key holding this workbench's persisted layout. */
	cacheKey: string;

	/**
	 * Sets the FlexLayout model for this workbench and persists it. The Model is
	 * recreated here, so FlexLayout's `onModelChange` never fires for this path.
	 */
	setModel: (layout: FlexLayout.IJsonModel) => void;

	/**
	 * Restores this workbench's cached layout, falling back to the supplied
	 * default when nothing usable is cached.
	 *
	 * @param layout - Default layout used when the cache is empty or unusable.
	 */
	loadLayout: (layout: FlexLayout.IJsonModel) => void;

	/** Persists the current FlexLayout model to localStorage. */
	saveToCache: () => void;

	/**
	 * Callback invoked when the FlexLayout model changes.
	 *
	 * @param model - The updated FlexLayout model.
	 * @param action - The action that caused the model change.
	 */
	onModelChange: (model: FlexLayout.Model, action: FlexLayout.Action) => void;

	/**
	 * Registers a listener invoked with every FlexLayout action after it is
	 * applied to the model (e.g. to react to a native tab rename or close).
	 * Domain slices use this instead of reading `model` from components.
	 *
	 * @param listener - Callback invoked with the applied action.
	 * @return Cleanup callback that unregisters the listener.
	 */
	onModelAction: (
		listener: (model: FlexLayout.Model, action: FlexLayout.Action) => void,
	) => () => void;

	/**
	 * Opens an existing panel or select it
	 *
	 * @param id - Unique ID of the panel to open.
	 * @param options - Optional FlexLayout tab configuration to restore the panel.
	 * @param targetId - Optional FlexLayout tabset ID to open the panel in.
	 */
	openPanel: (
		id: string,
		options?: FlexLayout.IJsonTabNode,
		target?:
			| {
					type: "TAB";
					id?: string;
			  }
			| {
					type: "BORDER";
					location: FlexLayout.IBorderLocation;
			  },
	) => void;

	/**
	 *  Closes a panel identified by node
	 *	@param id - id of the panel to close
	 */
	closePanel: (id: string) => void;

	/**
	 *  Rename a panel's tab
	 *	@param id - id of the panel to rename
	 */
	renamePanel: (id: string, name: string) => void;

	/**
	 * Updates a panel's tab configuration
	 * @param nodeId - id of the tab to update
	 * @param options - new options to apply
	 */
	updatePanel: (nodeId: string, options: FlexLayout.IJsonTabNode) => void;
}

/**
 * Creates the FlexLayout model slice for one workbench.
 *
 * @name createWorkbenchLayoutSlice
 * @param id - Unique workbench ID used to isolate the cache.
 * @return Zustand state creator for the workbench layout slice.
 */
export const createWorkbenchLayoutSlice = (
	id: string,
): WorkbenchSlice<WorkbenchLayoutSliceState> => {
	// Not part of the public state shape - listeners don't need to trigger re-renders.
	const listeners = new Set<
		(model: FlexLayout.Model, action: FlexLayout.Action) => void
	>();

	// `id` never changes for a store instance, so the key can be built once.
	const cacheKey = getWorkbenchCacheKey(id);

	return (set, get) => ({
		id: id,
		model: FlexLayout.Model.fromJson({
			global: {},
			layout: {
				type: "row",
				children: [],
			},
		}),
		key: 0,
		activePanel: "",
		cacheKey: cacheKey,
		setModel: (layout) => {
			set((state) => ({
				model: FlexLayout.Model.fromJson(layout),
				key: state.key + 1,
			}));

			// trigger the save manually as the Model is recreated
			get().saveToCache();
		},
		loadLayout: (layout) => {
			let cached: FlexLayout.IJsonModel | null = null;
			try {
				const item = localStorage.getItem(cacheKey);
				if (item) {
					const options = JSON.parse(item) as WorkbenchCacheOptions;

					// a parseable entry with no layout would otherwise leave the
					// model empty and render a blank workbench
					if (options?.layout) {
						cached = options.layout;
					}
				}
			} catch (e) {
				console.error(e);
			}

			if (cached) {
				try {
					get().setModel(cached);
					return;
				} catch (e) {
					// a cached layout can reference a component that no longer exists
					console.error(e);
				}
			}

			// Deep-copy so the shared default layout is untouched - Model.fromJson
			// keeps references into the JSON it is given.
			get().setModel(JSON.parse(JSON.stringify(layout)));
		},
		saveToCache: () => {
			try {
				const options: WorkbenchCacheOptions = {
					version: "",
					layout: get().model.toJson(),
				};

				localStorage.setItem(cacheKey, JSON.stringify(options));
			} catch (e) {
				console.error(e);
			}
		},
		onModelChange: (model, action) => {
			// Find the currently active tabset or check specific nodes
			const activeTabset = model.getActiveTabset();
			const selectedIndex = activeTabset?.getSelected();
			const activeNode =
				selectedIndex === undefined
					? undefined
					: activeTabset?.getChildren()[selectedIndex];

			set((state) => ({
				key: state.key + 1,
				activePanel: activeNode?.getId() ?? "",
			}));

			// trigger the listeners
			for (const listener of listeners) {
				listener(model, action);
			}

			get().saveToCache();
		},
		openPanel: (
			id,
			options = {},
			target = {
				type: "TAB",
			},
		) => {
			const model = get().model;
			if (!model) {
				return;
			}

			// select the node if there. A tab keeps the node id it was created
			// with, so after a file moves its id still encodes the *old* path —
			// fall back to matching on component + config.path so a renamed file
			// re-selects its open editor instead of opening a duplicate.
			let selectedNode = model.getNodeById(id);
			if (!selectedNode && options.component && options.config?.path) {
				model.visitNodes((node) => {
					if (selectedNode || !(node instanceof FlexLayout.TabNode)) {
						return;
					}

					if (
						node.getComponent() === options.component &&
						node.getConfig()?.path === options.config?.path
					) {
						selectedNode = node;
					}
				});
			}

			if (selectedNode instanceof FlexLayout.TabNode) {
				const parent = selectedNode.getParent();
				// may differ from `id` when matched by config.path above
				const selectedId = selectedNode.getId();

				// Border tabs TOGGLE on SELECT_TAB (flexlayout-react), so re-selecting an
				// already-selected border tab would hide/close it - skip the dispatch.
				const alreadySelected =
					parent instanceof FlexLayout.BorderNode
						? parent.getSelected() ===
							parent.getChildren().indexOf(selectedNode)
						: parent instanceof FlexLayout.TabSetNode
							? parent.getSelectedNode()?.getId() === selectedId
							: false;

				if (!alreadySelected) {
					model.doAction(FlexLayout.Actions.selectTab(selectedId));
				}

				return;
			}

			if (target.type === "TAB") {
				let targetId = target.id;
				if (!targetId) {
					targetId =
						model.getActiveTabset()?.getId() ||
						model.getRoot().getChildren()[0]?.getId() ||
						"";
				}

				// actually add the node to the model
				model.doAction(
					FlexLayout.Actions.addNode(
						{
							...options,
							id: id,
						},
						targetId,
						FlexLayout.DockLocation.CENTER,
						-1,
						true,
					),
				);
			} else if (target.type === "BORDER") {
				// Find the border with the requested location
				const borders = model.getBorderSet().getBorders();
				const border = borders.find(
					(candidate) =>
						candidate.getLocation().getName() === target.location,
				);

				if (!border) {
					throw new Error(
						`No border found for location ${target.location}`,
					);
				}
				// Add the node to the existing border
				model.doAction(
					FlexLayout.Actions.addNode(
						{
							...options,
							id: id,
						},
						border.getId(),
						FlexLayout.DockLocation.CENTER,
						-1,
						true,
					),
				);
			}
		},
		closePanel: (id) => {
			const model = get().model;
			const node = model.getNodeById(id);

			if (!(node instanceof FlexLayout.TabNode)) {
				return;
			}

			const parent = node.getParent();

			// Close removable panels permanently.
			if (node.isEnableClose()) {
				model.doAction(FlexLayout.Actions.deleteTab(id));
				return;
			}

			// Hide non-closeable border panels.
			if (parent instanceof FlexLayout.BorderNode) {
				model.doAction(
					FlexLayout.Actions.updateNodeAttributes(parent.getId(), {
						selected: -1,
					}),
				);
				return;
			}

			// Non-closeable tab panels cannot be deselected in FlexLayout,
			// so select another tab when one exists.
			if (parent instanceof FlexLayout.TabSetNode) {
				const nextNode = parent
					.getChildren()
					.find((child) => child.getId() !== id);

				if (nextNode) {
					model.doAction(
						FlexLayout.Actions.selectTab(nextNode.getId()),
					);
				}
			}
		},
		renamePanel: (id, name) => {
			const model = get().model;
			if (!model) {
				return;
			}

			const node = model.getNodeById(id);
			if (node instanceof FlexLayout.TabNode) {
				model.doAction(FlexLayout.Actions.renameTab(id, name));
			}
		},
		updatePanel: (nodeId, options) => {
			const model = get().model;
			if (!model) {
				return;
			}

			model.doAction(
				FlexLayout.Actions.updateNodeAttributes(nodeId, options),
			);
		},
		onModelAction: (listener) => {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},
	});
};
