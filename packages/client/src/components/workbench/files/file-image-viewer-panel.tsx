import { useEffect } from "react";
import { useInsight, usePixel } from "@semoss/sdk/react";
import { getFileIconComponent } from "@semoss/shared";
import { Muted, Spinner } from "@semoss/ui/next";
import { useWorkbenchAccess, useWorkbenchControl } from "@/hooks";
import type {
	WorkbenchPanelConfig,
	WorkbenchPanelProps,
} from "@/stores/workbench";
import { WorkbenchAccessError } from "../core/workbench-access-error";
import { WorkbenchAccessLoading } from "../core/workbench-access-loading";
import { getImageMimeType } from "./file-editor.utility";
import {
	FileImageViewerControl,
	type FileImageViewerControlValue,
} from "./file-image-viewer-control";
import { getFileReadPixel } from "./file-panel.utility";

export interface FileImageViewerParams {
	type: "ENGINE" | "PROJECT" | "INSIGHT";
	id: string;
	name: string;
	path: string;
}

const FileImageViewerPanel = ({
	config,
	id,
	setValue,
}: WorkbenchPanelProps<FileImageViewerParams, FileImageViewerControlValue>) => {
	const insight = useInsight();
	const access = useWorkbenchAccess(config.type, config.id);
	const image = usePixel<string>(
		access.status === "ready" ? getFileReadPixel(config, true) : "",
		{ data: "" },
		config.type === "INSIGHT" ? config.id : insight.insightId,
	);

	useEffect(
		() => setValue({ refresh: image.refresh }),
		[image.refresh, setValue],
	);
	useWorkbenchControl(id, FileImageViewerControl);

	if (access.status === "loading") {
		return (
			<WorkbenchAccessLoading
				className="size-full"
				label="Loading resource access"
			/>
		);
	}

	if (access.status === "error") {
		return (
			<WorkbenchAccessError
				className="size-full"
				message={access.error}
				onRetry={() => void access.refresh()}
			/>
		);
	}

	if (image.status === "LOADING" || image.status === "INITIAL") {
		return (
			<output
				className="flex size-full items-center justify-center"
				aria-label="Loading image"
			>
				<Spinner />
			</output>
		);
	}

	if (image.status === "ERROR") {
		return (
			<div className="flex size-full items-center justify-center p-4">
				<Muted className="text-destructive" role="alert">
					{image.error?.message || "Failed to load image"}
				</Muted>
			</div>
		);
	}

	return (
		<div className="relative size-full items-center justify-center overflow-hidden bg-background p-4">
			<div className="flex size-full items-center justify-center">
				<img
					className="max-h-full max-w-full object-contain"
					src={`data:${getImageMimeType(config.path)};base64,${image.data}`}
					alt={`Preview of ${config.name}`}
				/>
			</div>
			{access.refreshing ? (
				<WorkbenchAccessLoading
					className="absolute inset-0 bg-background/80"
					label="Refreshing resource access"
				/>
			) : null}
			{access.refreshError ? (
				<WorkbenchAccessError
					className="absolute inset-0 bg-background/90"
					message={access.refreshError}
					onRetry={() => void access.refresh()}
				/>
			) : null}
		</div>
	);
};

/** Scope-aware image viewer blueprint shared by all workbenches. */
export const FILE_IMAGE_VIEWER_PANEL: WorkbenchPanelConfig<
	FileImageViewerParams,
	FileImageViewerControlValue
> = {
	name: "Image",
	canRename: false,
	mount: "keepAlive",
	matches: (a, b) => a.type === b.type && a.id === b.id && a.path === b.path,
	icon: ({ config, className }) => {
		const Icon = getFileIconComponent(config.path ?? "");
		return <Icon className={className} />;
	},
	content: FileImageViewerPanel,
};
