import { useEffect, useMemo, useRef, useState } from "react";
import { InsightProvider } from "@semoss/sdk/react";
import { FlexLayout } from "@semoss/shared";
import { AppWorkspace } from "@/components/app-workspace/app-workspace";

interface AppFileManagerPageProps {
	appId?: string;
}

export const AppFileManagerPage: React.FC<AppFileManagerPageProps> = ({
	appId,
}) => {
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
							id: "APP_FILE_EXPLORER",
							name: "Files",
							component: "app-file-explorer",
							config: {},
							helpText: "File Explorer",
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
		<div className="h-[60vh] w-full overflow-hidden md:h-[calc(100vh-200px)]">
			<InsightProvider>
				<AppWorkspace app={appId || ""} model={model} />
			</InsightProvider>
		</div>
	);
};
