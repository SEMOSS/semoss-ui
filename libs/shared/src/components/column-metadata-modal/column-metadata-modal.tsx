import type React from "react";
import {
	Badge,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	P,
} from "@semoss/ui/next";

export interface ColumnMetadataModalProps {
	open: boolean;
	onClose: () => void;
	tableName?: string;
	columnName?: string;
	physicalType?: string;
	logicalNames?: string[];
	description?: string;
}

export const ColumnMetadataModal: React.FC<ColumnMetadataModalProps> = ({
	open,
	onClose,
	tableName,
	columnName,
	physicalType,
	logicalNames,
	description,
}) => {
	return (
		<Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
			<DialogContent className="max-h-[85vh] overflow-hidden sm:max-w-xl">
				<DialogHeader>
					<DialogTitle>Column Metadata</DialogTitle>
					<DialogDescription>
						View logical names and description.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 overflow-y-auto pr-1">
					<div className="flex flex-wrap items-center gap-2">
						{tableName && (
							<Badge variant="outline">Table: {tableName}</Badge>
						)}
						{columnName && (
							<Badge variant="outline">Column: {columnName}</Badge>
						)}
						{physicalType && (
							<Badge variant="outline">Physical Type: {physicalType}</Badge>
						)}
					</div>

					<div className="space-y-2 rounded-md border border-border p-3">
						<div className="space-y-1">
							<P className="font-medium text-foreground text-sm">
								Logical Names
							</P>
							<div className="flex flex-wrap gap-1">
								{logicalNames?.length ? (
									logicalNames.map((name) => (
										<Badge
											key={name}
											variant="default"
											className="text-xs"
										>
											{name}
										</Badge>
									))
								) : (
									<P className="text-muted-foreground text-sm">
										No logical names provided.
									</P>
								)}
							</div>
						</div>

						<div className="space-y-1">
							<P className="font-medium text-foreground text-sm">
								Description
							</P>
							<P className="text-muted-foreground text-sm">
								{description || "No description provided."}
							</P>
						</div>
					</div>
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={onClose}
						data-testid="column-details-close-btn"
					>
						Close
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};