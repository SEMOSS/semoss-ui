import { Download as DownloadIcon } from "lucide-react";
import { useState } from "react";
import { download } from "@semoss/sdk/react";
import type { Project } from "@semoss/shared";
import {
	Button,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { useRootStore } from "@/hooks/useRootStore";

interface ProjectExportButtonProps {
	/** Project details */
	project: Project;
}

export const ProjectExportButton = ({ project }: ProjectExportButtonProps) => {
	const [isLoading, setIsLoading] = useState(false);
	const { configStore } = useRootStore();

	/**
	 * Export the project
	 */
	const exportProject = async () => {
		try {
			setIsLoading(true);

			const response = await configStore.runPixel(
				`ExportProjectApp(project=["${project.project_id}"]);`,
			);

			await download(
				response.insightId,
				response.pixelReturn[0].output as string,
			);
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to export project. Please try again.",
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					disabled={isLoading}
					variant="outline"
					size="icon"
					aria-label="Export"
					onClick={() => exportProject()}
					data-testid={"appDetail-export-btn"}
				>
					{isLoading ? (
						<Spinner className="size-4" />
					) : (
						<DownloadIcon className="size-4" />
					)}
				</Button>
			</TooltipTrigger>
			<TooltipContent>Export</TooltipContent>
		</Tooltip>
	);
};
