import { useEffect, useId, useState } from "react";
import type { ColumnInterface } from "@semoss/sdk/react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Field,
	FieldGroup,
	FieldLabel,
	FileDropzone,
	RadioGroup,
	RadioGroupItem,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Spinner,
	toast,
} from "@semoss/ui/next";
import { uploadFile } from "@/api";
import { useRootStore } from "@/hooks";

interface QueryUploadCsvProps {
	/** Engine (database) id to query */
	engine: string;

	/** usePixel return to get the table structure */
	structure: {
		table: string;
		columns: ColumnInterface[];
	}[];

	/** Selected table */
	table: string;

	/** Track if open */
	open: boolean;

	/** Callback when the dialog is closed */
	onClose: (success: boolean) => void;
}

export const QueryUploadCsv = ({
	engine,
	structure,
	table,
	open,
	onClose,
}: QueryUploadCsvProps) => {
	const { configStore } = useRootStore();

	const targetTableId = useId();
	const appendModeId = useId();
	const replaceModeId = useId();

	const [target, setTarget] = useState("");
	const [upload, setUpload] = useState<File | null>(null);
	const [method, setMethod] = useState<"append" | "replace">("append");
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		if (!open) {
			return;
		}

		setTarget(table);
		setUpload(null);
		setMethod("append");
	}, [open, table]);

	const handleUploadTableData = async () => {
		if (!engine) {
			toast.error("No active database selected.");
			return;
		}

		if (!target) {
			toast.error("Please select a target table.");
			return;
		}

		if (!upload) {
			toast.error("Please choose a CSV file.");
			return;
		}

		setIsLoading(true);

		try {
			// upload the file
			const uploaded = await uploadFile(
				[upload],
				configStore.store.insightID,
			);

			if (!uploaded?.length || !uploaded[0]?.fileLocation) {
				toast.error("File upload failed.");
				return;
			}

			const filePath = uploaded[0].fileLocation;
			const clearTablePixel =
				method === "replace"
					? `SqlQuery(database=[${JSON.stringify(engine)}], query=["<encode>DELETE FROM ${target};</encode>"], commit=[true]);`
					: "";
			const uploadPixel = `newDbInfo=RdbmsUploadTableData(database=[${JSON.stringify(engine)}],filePath=[${JSON.stringify(filePath)}],delimiter=[","],dataTypeMap=[{}],newHeaders=[{}],additionalDataTypes=[{}],descriptionMap=[{}],logicalNamesMap=[{}],existing=[true],table=[${JSON.stringify(target)}]);SyncDatabaseWithLocalMaster(database=[newDbInfo]);`;

			const response = await configStore.runPixel(
				`${clearTablePixel}${uploadPixel}`,
			);

			if (response.errors?.length > 0) {
				throw new Error(response.errors?.join("\n"));
			}

			toast.success(
				method === "replace"
					? `Replaced table ${target} from CSV.`
					: `Appended CSV rows to ${target}.`,
			);

			onClose(true);
		} catch (err) {
			toast.error(
				err instanceof Error
					? err.message
					: "An error occurred while uploading.",
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={() => {
				if (isLoading) {
					return;
				}

				onClose(false);
			}}
		>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Upload to Table</DialogTitle>
					<DialogDescription>
						Append rows to a table or replace its current rows.
					</DialogDescription>
				</DialogHeader>

				<FieldGroup>
					<Field>
						<FieldLabel htmlFor={targetTableId}>Table</FieldLabel>
						<Select value={target} onValueChange={setTarget}>
							<SelectTrigger
								id={targetTableId}
								className="w-full"
							>
								<SelectValue placeholder="Select a table" />
							</SelectTrigger>
							<SelectContent>
								{structure.map((table) => (
									<SelectItem
										key={table.table}
										value={table.table}
									>
										{table.table}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</Field>

					<Field>
						<FieldLabel>File</FieldLabel>
						<FileDropzone
							multiple={false}
							value={upload}
							onChange={(v) => {
								setUpload(v as File | null);
							}}
						/>
					</Field>

					<Field>
						<FieldLabel>Method</FieldLabel>
						<RadioGroup
							value={method}
							onValueChange={(value) => {
								if (value === "append" || value === "replace") {
									setMethod(value);
								}
							}}
							className="gap-2"
						>
							<Field
								orientation="horizontal"
								className="items-center"
							>
								<RadioGroupItem
									id={appendModeId}
									value="append"
								/>
								<FieldLabel
									htmlFor={appendModeId}
									className="font-normal"
								>
									Append rows
								</FieldLabel>
							</Field>
							<Field
								orientation="horizontal"
								className="items-center"
							>
								<RadioGroupItem
									id={replaceModeId}
									value="replace"
								/>
								<FieldLabel
									htmlFor={replaceModeId}
									className="font-normal"
								>
									Replace rows
								</FieldLabel>
							</Field>
						</RadioGroup>
					</Field>
				</FieldGroup>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onClose(false)}
						disabled={isLoading}
					>
						Cancel
					</Button>
					<Button
						onClick={handleUploadTableData}
						disabled={isLoading}
					>
						{isLoading ? <Spinner /> : "Upload"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
