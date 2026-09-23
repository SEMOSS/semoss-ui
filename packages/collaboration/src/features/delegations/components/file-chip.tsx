import { FileText } from "lucide-react";
import { useToolWorkbench } from "@/features/tools/tool-workbench.context";

function formatSize(bytes?: number): string {
	if (bytes === undefined) return "";
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
	return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** A room file that opens in the side panel. */
export function FileChip({
	file,
}: {
	file: { path: string; name: string; size?: number };
}) {
	const { openFile } = useToolWorkbench();
	return (
		<button
			type="button"
			title={file.path}
			className="inline-flex max-w-64 items-center gap-1.5 rounded-md border bg-background px-2 py-1 text-xs hover:bg-accent"
			onClick={() => openFile(file.path, file.name)}
		>
			<FileText aria-hidden="true" className="size-3.5 shrink-0" />
			<span className="truncate">{file.name}</span>
			{file.size !== undefined && (
				<span className="shrink-0 text-muted-foreground">
					{formatSize(file.size)}
				</span>
			)}
		</button>
	);
}
