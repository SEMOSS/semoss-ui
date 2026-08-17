import type { ReactNode } from "react";
import type { StateCreator } from "zustand";
import type { FlexLayout } from "@semoss/shared";
import type { WorkbenchState } from "./workbench.store";

/** Declarative command exposed by a workbench panel. */
export interface WorkbenchCommand {
	id: string;
	label: string;
	description?: string;
	icon?: ReactNode;
	handler: (get: () => WorkbenchState) => void;
}

/** Components registered with a workbench instance. */
export type WorkbenchPanelConfig = {
	tab: (node: FlexLayout.TabNode, layout: FlexLayout.Layout) => ReactNode;
	view: (node: FlexLayout.TabNode, layout: FlexLayout.Layout) => ReactNode;
};

/** Zustand state creator for one workbench slice, optionally against a wider store shape. */
export type WorkbenchSlice<
	Output,
	FullState extends WorkbenchState = WorkbenchState,
> = StateCreator<FullState, [], [], Output>;
