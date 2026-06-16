import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { InsightProvider } from "@semoss/sdk/react";
import { FlexLayout } from "@semoss/shared";
import { EngineWorkspace } from "@/components/engine-workspace/engine-workspace";

export const EngineStorageViewerPage = () => {
	const { engineId } = useParams<{ engineId: string }>();

	const [isMobile, setIsMobile] = useState(
		() => typeof window !== "undefined" && window.innerWidth < 768,
	);

	useEffect(() => {
		const handleResize = () => setIsMobile(window.innerWidth < 768);
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	const modelRef = useRef<FlexLayout.Model | null>(null);

	const model = useMemo(() => {
		const savedLayout = modelRef.current
			? modelRef.current.toJson().layout
			: {
					type: "row",
					weight: 100,
					children: [
						{
							type: "tabset",
							weight: 100,
							enableDeleteWhenEmpty: false,
							children: [],
						},
					],
				};

		const newModel = FlexLayout.Model.fromJson({
			global: { tabSetEnableDeleteWhenEmpty: true },
			borders: [
				{
					type: "border",
					location: isMobile ? "top" : "left",
					size: isMobile ? 250 : 300,
					selected: 0,
					children: [
						{
							type: "tab",
							id: "ENGINE_STORAGE_VIEWER_EXPLORER",
							name: "Storage Viewer",
							component: "engine-file-explorer",
							config: {
								explorerMode: "STORAGE",
							},
							helpText: "Storage Viewer",
							enableClose: false,
						},
					],
				},
			],
			layout: savedLayout,
		});
		modelRef.current = newModel;
		return newModel;
	}, [isMobile]);

	return (
		<div className="h-[calc(100vh-200px)] w-full overflow-hidden">
			<InsightProvider>
				<EngineWorkspace engine={engineId || ""} model={model} />
			</InsightProvider>
		</div>
	);
};
