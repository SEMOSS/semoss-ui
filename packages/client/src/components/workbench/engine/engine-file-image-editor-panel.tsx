import { useEffect, useRef } from "react";
import { useInsight, usePixel } from "@semoss/sdk/react";
import { getFileIconComponent } from "@semoss/shared";
import { Muted, Spinner } from "@semoss/ui/next";
import { useEngine, useWorkbenchControl } from "@/hooks";
import type {
	WorkbenchComponent,
	WorkbenchPanelConfig,
} from "@/stores/workbench";
import { getImageMimeType } from "../file-editor.utility";
import {
	EngineFileImageEditorControl,
	type EngineFileImageEditorControlValue,
} from "./engine-file-image-editor-control";

export interface EngineFileImageEditorConfig {
	name: string;
	path: string;
	fileMode?: "ENGINE" | "INSIGHT";
	insightId?: string;
}

const EngineFileImageEditorPanel: WorkbenchComponent<
	EngineFileImageEditorConfig
> = ({ config, id, setValue }) => {
	const { engine } = useEngine();
	const insight = useInsight();
	const targetInsightId =
		config.fileMode === "INSIGHT"
			? config.insightId || insight.insightId
			: insight.insightId;
	const image = usePixel<string>(
		config.fileMode === "INSIGHT"
			? `GetInsightAssetsBase64(filePath=[${JSON.stringify(config.path)}]);`
			: `GetEngineAssetsBase64(filePath=[${JSON.stringify(config.path)}], engine=[${JSON.stringify(engine.engine_id)}]);`,
		{ data: "" },
		targetInsightId,
	);
	const refreshRef = useRef(image.refresh);
	refreshRef.current = image.refresh;

	// setValue changes identity after writing the value.
	// biome-ignore lint/correctness/useExhaustiveDependencies: see above
	useEffect(() => {
		const value: EngineFileImageEditorControlValue = {
			refresh: () => refreshRef.current(),
		};
		setValue(value);
	}, []);
	useWorkbenchControl(id, EngineFileImageEditorControl);

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
		<div className="flex size-full items-center justify-center overflow-hidden bg-background p-4">
			<img
				className="max-h-full max-w-full object-contain"
				src={`data:${getImageMimeType(config.path)};base64,${image.data}`}
				alt={`Preview of ${config.name}`}
			/>
		</div>
	);
};

export const ENGINE_FILE_IMAGE_EDITOR_PANEL: WorkbenchPanelConfig<EngineFileImageEditorConfig> =
	{
		name: "Image",
		canRename: false,
		mount: "keepAlive",
		matches: (a, b) =>
			a.path === b.path &&
			a.fileMode === b.fileMode &&
			a.insightId === b.insightId,
		icon: ({ config, className }) => {
			const Icon = getFileIconComponent(config.path ?? "");
			return <Icon className={className} />;
		},
		content: EngineFileImageEditorPanel,
	};
