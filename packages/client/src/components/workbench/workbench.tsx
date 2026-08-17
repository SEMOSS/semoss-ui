import { XIcon } from "lucide-react";
import { type FC, type ReactNode, useLayoutEffect, useRef } from "react";
import { FlexLayout } from "@semoss/shared";
import { cn, Spinner } from "@semoss/ui/next";
import { useTabBarScroll, useWorkbench } from "@/hooks";
import type { WorkbenchPanelConfig } from "@/stores";
import { WorkbenchCommandPalette } from "./workbench-command-palette";

export interface WorkbenchProps {
	/** Initial layout used to create the FlexLayout model. */
	layout: FlexLayout.IJsonModel;

	/** Panel renderers and their static command definitions. */
	components: Record<string, WorkbenchPanelConfig>;

	/** Floating actions rendered over the bottom-left of the layout. */
	actions?: ReactNode;
}

/** Initialize and render one workbench inside the nearest scoped provider. */
export const Workbench: FC<WorkbenchProps> = ({
	layout,
	components,
	actions,
}) => {
	const model = useWorkbench((state) => state.model);
	const setModel = useWorkbench((state) => state.setModel);
	const onModelChange = useWorkbench((state) => state.onModelChange);

	const isLoading = useWorkbench((state) => state.isLoading);
	const layoutRef = useRef<FlexLayout.Layout | null>(null);
	const containerRef = useRef<HTMLDivElement | null>(null);

	useTabBarScroll(containerRef);

	// set the initial layout
	useLayoutEffect(() => {
		setModel(layout);
	}, [setModel, layout]);

	if (!model) {
		return (
			<div className="absolute inset-0 flex items-center justify-center">
				<Spinner />
			</div>
		);
	}

	const hasBottomBorder = model
		.getBorderSet()
		.getBorders()
		.some((border) => border.getLocation().getName() === "bottom");

	return (
		<>
			<WorkbenchCommandPalette />
			<div
				ref={containerRef}
				className="absolute inset-0 overflow-hidden"
			>
				{isLoading ? (
					<div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/50">
						<Spinner />
					</div>
				) : null}
				<div className="flexlayout__theme_smss relative h-full w-full overflow-hidden">
					<FlexLayout.Layout
						ref={layoutRef}
						model={model}
						onModelChange={onModelChange}
						onRenderTab={(node, renderValues) => {
							const componentName = node.getComponent();
							if (!componentName || !layoutRef.current) {
								return;
							}

							const component = components[componentName];
							if (component) {
								renderValues.leading = component.tab(
									node,
									layoutRef.current,
								);
							}
						}}
						factory={(node) => {
							const componentName = node.getComponent();
							if (!componentName || !layoutRef.current) {
								return;
							}

							const component = components[componentName];
							if (component) {
								return (
									<div className="h-full w-full">
										{component.view(
											node,
											layoutRef.current,
										)}
									</div>
								);
							}

							return null;
						}}
						icons={{
							close: <XIcon className="size-4" />,
						}}
					/>
					{actions ? (
						<div
							className={cn(
								"absolute left-2 z-10",
								hasBottomBorder ? "bottom-14" : "bottom-2",
							)}
						>
							{actions}
						</div>
					) : null}
				</div>
			</div>
		</>
	);
};
