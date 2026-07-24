import { XIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useRef } from "react";
import { FlexLayout } from "@semoss/shared";
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
}

export const Workbench: React.FC<WorkbenchProps> = observer(
	({ model, components }) => {
		const layoutRef = useRef<FlexLayout.Layout | null>(null);
		const containerRef = useRef<HTMLDivElement | null>(null);

		useTabBarScroll(containerRef);

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
				</div>
			</div>
		);
	},
);
