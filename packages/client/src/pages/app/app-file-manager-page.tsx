import { useMemo } from "react";
import { InsightProvider } from "@semoss/sdk/react";
import { FlexLayout } from "@semoss/shared";
import { AppWorkspace } from "@/components/app-workspace/app-workspace";

const DEFAULT_BORDER_SIZE = 300;

interface AppFileManagerPageProps {
	appId?: string;
	showNavbar?: boolean;
}

export const AppFileManagerPage: React.FC<AppFileManagerPageProps> = ({
	appId,
	showNavbar,
}) => {
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
				<AppWorkspace
					app={appId || ""}
					model={model}
					showNavbar={showNavbar}
				/>
			</InsightProvider>
		</div>
	);
};
