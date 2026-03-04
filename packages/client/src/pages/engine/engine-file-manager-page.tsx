import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { InsightProvider } from "@semoss/sdk/react";
import { FlexLayout } from "@semoss/shared";
import { EngineWorkspace } from "@/components/engine-workspace/engine-workspace";

const DEFAULT_BORDER_SIZE = 300;

export const EngineFileManagerPage = () => {
	const { engineId } = useParams<{ engineId: string }>();

	const model = useMemo(() => {
		return FlexLayout.Model.fromJson({
			global: {},
			borders: [
				{
					type: "border",
					location: "left",
					size: DEFAULT_BORDER_SIZE,
					selected: 0,
					children: [
						{
							type: "tab",
							id: "ENGINE_FILE_EXPLORER",
							name: "Files",
							component: "engine-file-explorer",
							config: {},
							helpText: "File Explorer",
							enableClose: false,
						},
					],
				},
			],
			layout: {
				type: "row",
				weight: 0,
				children: [],
			},
		});
	}, []);

	return (
		<div className="h-[60vh] w-full overflow-hidden">
			<InsightProvider>
				<EngineWorkspace engine={engineId || ""} model={model} />
			</InsightProvider>
		</div>
	);
};
