import { FileText } from "lucide-react";
import { Button } from "@semoss/ui/next";
import { formatByteSize } from "@semoss/utility";
import { useToolWorkbench } from "@/features/tools/tool-workbench.context";

/** A room file that opens in the side panel. */
export function FileChip({
	file,
}: {
	file: { path: string; name: string; size?: number };
}) {
	const { openFile } = useToolWorkbench();
	return (
		<Button
			type="button"
			variant="outline"
			size="sm"
			title={file.path}
			className="h-auto max-w-64 gap-1.5 px-2 py-1 text-xs"
			onClick={() => openFile(file.path, file.name)}
		>
			<FileText aria-hidden="true" className="size-3.5 shrink-0" />
			<span className="truncate">{file.name}</span>
			{file.size !== undefined && (
				<span className="shrink-0 text-muted-foreground">
					{formatByteSize(file.size)}
				</span>
			)}
		</Button>
	);
}
