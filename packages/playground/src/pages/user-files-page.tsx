import { FolderOpenIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import type { FileItem } from "@semoss/shared";
import { FileEditor, FileExplorer } from "@semoss/shared";
import { Muted, Separator, Spinner } from "@semoss/ui/next";
import { useGlobalBreadcrumbs } from "@/hooks";

const USER_ROOT = "/version/assets";
const REQUIRED_DIRS = ["version/assets/memory", "version/assets/skills"];

export const UserFilesPage = () => {
	useGlobalBreadcrumbs({
		breadcrumbs: [{ name: "Files", path: "/files" }],
	});

	const insight = useInsight();
	const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
	const [isReady, setIsReady] = useState(false);

	// Ensure required directories exist before showing the explorer
	useEffect(() => {
		if (!insight.insightId) {
			return;
		}

		const ensureDirs = async () => {
			for (const dir of REQUIRED_DIRS) {
				try {
					await insight.actions.run(
						`NewDir(relativePath=["${dir}"]);`,
					);
				} catch {
					// Directory likely already exists — ignore
				}
			}
			setIsReady(true);
		};

		ensureDirs();
	}, [insight.insightId]);

	return (
		<div className="flex h-full w-full overflow-hidden">
			{/* Left panel — file tree */}
			<div className="flex h-full w-72 shrink-0 flex-col overflow-hidden border-border border-r bg-background">
				<div className="flex shrink-0 items-center px-3 py-2">
					<span className="font-medium text-sm">My Files</span>
				</div>
				<Separator />
				<div className="min-h-0 flex-1 overflow-hidden">
					{isReady ? (
						<FileExplorer
							mode={{ type: "USER" }}
							initialPath={USER_ROOT}
							minPath={USER_ROOT}
							rootLabel="/"
							onItemSelect={(item) => {
								if (item.type !== "directory") {
									setSelectedFile(item);
								}
							}}
						/>
					) : (
						<div className="flex h-full items-center justify-center">
							<Spinner />
						</div>
					)}
				</div>
			</div>

			{/* Right panel — editor */}
			<div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-background">
				{selectedFile ? (
					<FileEditor
						key={selectedFile.path}
						mode={{ type: "USER" }}
						path={selectedFile.path}
					/>
				) : (
					<div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
						<FolderOpenIcon className="size-12 opacity-30" />
						<Muted>Select a file to view or edit</Muted>
					</div>
				)}
			</div>
		</div>
	);
};
