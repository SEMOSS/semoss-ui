import { Badge, Muted, Spinner } from "@semoss/ui/next";

interface OfficeSurfaceStatusProps {
	fileName: string;
	readOnly: boolean;
	isLoading: boolean;
}

/** Document identity and effective access, without a second file-management menu. */
export const OfficeSurfaceStatus = ({
	fileName,
	readOnly,
	isLoading,
}: OfficeSurfaceStatusProps) => (
	<div className="flex shrink-0 flex-wrap items-center gap-2 border-border border-b px-3 py-2">
		<Muted className="min-w-0 truncate text-sm" title={fileName}>
			{fileName}
		</Muted>
		<Badge variant="outline">{readOnly ? "Read-only" : "Editing"}</Badge>
		{isLoading && <Spinner aria-label="Loading document" />}
	</div>
);
