import { XIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useMemo, useRef } from "react";
import { FlexLayout } from "@semoss/shared";
import { cn } from "@semoss/ui/next";
import { useTabBarScroll } from "@/hooks";

interface WorkbenchProps {
	/** Model */
	model: FlexLayout.Model;

	/** Components */
	components: Record<
		string,
		{
			tab: (
				node: FlexLayout.TabNode,
				layout: FlexLayout.Layout,
			) => React.ReactNode;
			panel: (
				node: FlexLayout.TabNode,
				layout: FlexLayout.Layout,
			) => React.ReactNode;
		}
	>;

	/** Floating actions rendered over the bottom-left of the layout */
	actions?: React.ReactNode;
}

export const Workbench: React.FC<WorkbenchProps> = observer(
	({ model, components, actions }) => {
		const layoutRef = useRef<FlexLayout.Layout | null>(null);
		const containerRef = useRef<HTMLDivElement | null>(null);

		useTabBarScroll(containerRef);

		// Offset the actions above the bottom border tab strip when one exists.
		const hasBottomBorder = useMemo(
			() =>
				model
					.toJson()
					.borders?.some((border) => border.location === "bottom") ??
				false,
			[model],
		);

		return (
			<div
				ref={containerRef}
				className="absolute inset-0 overflow-hidden"
			>
				<div className="flexlayout__theme_smss relative h-full w-full overflow-hidden">
					<FlexLayout.Layout
						ref={layoutRef}
						model={model}
						onRenderTab={(node, renderValues) => {
							const componentName = node.getComponent();
							if (!componentName) {
								return null;
							}

							if (!layoutRef.current) {
								return null;
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
							if (!componentName) {
								return null;
							}

							const component = components[componentName];
							if (!component) {
								return null;
							}

							if (!layoutRef.current) {
								return null;
							}

							return component.panel(node, layoutRef.current);
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
		);
	},
);
