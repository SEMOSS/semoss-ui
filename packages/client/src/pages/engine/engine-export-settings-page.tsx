import { DownloadIcon } from "lucide-react";
import { useId, useState } from "react";
import {
	Button,
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Field,
	FieldContent,
	FieldDescription,
	FieldLabel,
	Spinner,
	Switch,
} from "@semoss/ui/next";
import {
	ENGINE_SUBTYPES_WITH_DATA,
	useEngineExport,
} from "@/features/engine-export/use-engine-export";
import { useEngine } from "@/hooks/useEngine";

/**
 * The Export section of an engine's Settings: download the engine as a zip to
 * upload on another server. An engine that holds its data in a file, such as
 * an H2 database, can include the data or leave it out.
 */
export const EngineExportSettingsPage = () => {
	const { catalog, engine } = useEngine();
	const { isExporting, exportEngine } = useEngineExport(engine.engine_id);
	const [includeData, setIncludeData] = useState(false);
	const includeDataId = useId();
	const canIncludeData = ENGINE_SUBTYPES_WITH_DATA.includes(
		engine.engine_subtype ?? "",
	);
	const label = catalog.name.toLowerCase();

	return (
		<Card>
			<CardHeader className={canIncludeData ? "border-b" : undefined}>
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
						onClick={() =>
							exportEngine(canIncludeData && includeData)
						}
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
			{canIncludeData ? (
				<CardContent>
					<Field orientation="horizontal">
						<Switch
							id={includeDataId}
							checked={includeData}
							onCheckedChange={setIncludeData}
							disabled={isExporting}
						/>
						<FieldContent>
							<FieldLabel htmlFor={includeDataId}>
								Include the Data
							</FieldLabel>
							<FieldDescription>
								Export the database's rows along with its
								structure.
							</FieldDescription>
						</FieldContent>
					</Field>
				</CardContent>
			) : null}
		</Card>
	);
};
