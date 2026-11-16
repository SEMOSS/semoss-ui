import { DownloadIcon } from "lucide-react";
import {
	Button,
	Card,
	CardAction,
	CardDescription,
	CardHeader,
	CardTitle,
	Spinner,
} from "@semoss/ui/next";
import { useEngineExport } from "@/features/engine-export/use-engine-export";
import { useEngine } from "@/hooks/useEngine";

/**
 * The Export section of an engine's Settings: download the engine as a zip to
 * upload on another server. An engine that keeps its data in files, such as
 * an H2 or RDF database, comes with its data.
 */
export const EngineExportSettingsPage = () => {
	const { catalog, engine } = useEngine();
	const { isExporting, exportEngine } = useEngineExport(engine.engine_id);
	const label = catalog.name.toLowerCase();

	return (
		<Card>
			<CardHeader>
				<CardTitle>Export {catalog.name}</CardTitle>
				<CardDescription>
					Download the {label} as a zip with its settings, files and
					metadata, to upload on another server.
				</CardDescription>
				<CardAction className="self-center">
					<Button
						type="button"
						variant="outline"
						size="sm"
						disabled={isExporting}
						onClick={() => exportEngine()}
						data-testid="engineExport-export-btn"
					>
						{isExporting ? (
							<Spinner className="size-4" />
						) : (
							<DownloadIcon aria-hidden />
						)}
						{isExporting ? "Exporting..." : "Export"}
					</Button>
				</CardAction>
			</CardHeader>
		</Card>
	);
};
