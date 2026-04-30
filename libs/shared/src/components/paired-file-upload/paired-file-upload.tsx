import { Upload, X } from "lucide-react";
import { useMemo, useRef } from "react";

export interface PairedFileUploadColumn {
	key: string;
	label: string;
	extensions?: string[];
	required?: boolean;
}

export type PairedFileUploadRow = Record<string, File | null>;

interface PairedFileUploadProps {
	columns: PairedFileUploadColumn[];
	onChange: (rows: PairedFileUploadRow[]) => void;
	value?: PairedFileUploadRow[];
}

function emptyRow(columns: PairedFileUploadColumn[]): PairedFileUploadRow {
	return Object.fromEntries(columns.map((c) => [c.key, null]));
}

function isRowEmpty(row: PairedFileUploadRow): boolean {
	return Object.values(row).every((v) => v === null);
}

export function PairedFileUpload({
	columns,
	onChange,
	value,
}: PairedFileUploadProps) {
	// Always render with a trailing empty row — it is purely presentational
	// and gets stripped before emitting to the parent via onChange.
	const rows = useMemo(() => {
		const base = value && value.length > 0 ? [...value] : [];
		base.push(emptyRow(columns));
		return base;
	}, [value, columns]);

	const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

	function emit(next: PairedFileUploadRow[]) {
		const meaningful = [...next];
		while (
			meaningful.length > 0 &&
			isRowEmpty(meaningful[meaningful.length - 1])
		) {
			meaningful.pop();
		}
		onChange(meaningful);
	}

	function setFile(rowIdx: number, colKey: string, file: File | null) {
		// Operate on value (without the trailing empty row) so indices stay stable
		const next = (value ?? []).map((r) => ({ ...r }));

		if (rowIdx < next.length) {
			next[rowIdx][colKey] = file;
			// Remove a non-last meaningful row if it becomes fully empty
			if (isRowEmpty(next[rowIdx]) && next.length > 0) {
				next.splice(rowIdx, 1);
			}
		} else {
			// rowIdx points to the trailing empty slot — create a new row
			const row = emptyRow(columns);
			row[colKey] = file;
			if (file !== null) next.push(row);
		}

		emit(next);
	}

	function removeRow(rowIdx: number) {
		const next = (value ?? []).filter((_, i) => i !== rowIdx);
		emit(next);
	}

	function handleDrop(
		e: React.DragEvent,
		rowIdx: number,
		col: PairedFileUploadColumn,
	) {
		e.preventDefault();
		const file = e.dataTransfer.files[0];
		if (!file) return;
		if (
			col.extensions &&
			!col.extensions.some((ext) => file.name.endsWith(ext))
		)
			return;
		setFile(rowIdx, col.key, file);
	}

	const trailingIdx = rows.length - 1;

	return (
		<div className="flex flex-col gap-1">
			{/* Header */}
			<div
				className="grid gap-2"
				style={{
					gridTemplateColumns: `repeat(${columns.length}, 1fr) 2rem`,
				}}
			>
				{columns.map((col) => (
					<span
						key={col.key}
						className="px-1 font-medium text-foreground text-xs"
					>
						{col.label}
						{col.required && (
							<span className="ml-0.5 text-destructive">*</span>
						)}
					</span>
				))}
				<span />
			</div>

			{/* Rows */}
			{rows.map((row, rowIdx) => {
				const rowKey = `row-${rowIdx}-${Object.values(row)
					.map((f) => f?.name || "empty")
					.join("-")}`;
				return (
					<div
						key={rowKey}
						className="grid items-center gap-2"
						style={{
							gridTemplateColumns: `repeat(${columns.length}, 1fr) 2rem`,
						}}
					>
						{columns.map((col) => {
							const file = row[col.key];
							const refKey = `${rowIdx}-${col.key}`;
							return (
								<button
									key={col.key}
									type="button"
									className={`flex h-9 min-w-0 cursor-pointer items-center gap-2 overflow-hidden rounded-lg border-2 px-3 text-sm transition-colors ${file ? "border-border bg-muted/40" : "border-input border-dashed bg-secondary hover:border-primary hover:bg-accent"}`}
									onClick={() =>
										inputRefs.current[refKey]?.click()
									}
									onDragOver={(e) => e.preventDefault()}
									onDrop={(e) => handleDrop(e, rowIdx, col)}
								>
									<input
										ref={(el) => {
											inputRefs.current[refKey] = el;
										}}
										type="file"
										accept={
											col.extensions?.join(",") ?? "*"
										}
										className="hidden"
										onChange={(e) => {
											const f =
												e.target.files?.[0] ?? null;
											if (f) setFile(rowIdx, col.key, f);
											e.target.value = "";
										}}
									/>
									{file ? (
										<>
											<span className="min-w-0 flex-1 truncate text-foreground text-sm">
												{file.name}
											</span>
											<button
												type="button"
												className="shrink-0 text-muted-foreground hover:text-destructive"
												onClick={(e) => {
													e.stopPropagation();
													setFile(
														rowIdx,
														col.key,
														null,
													);
												}}
											>
												<X className="h-3 w-3" />
											</button>
										</>
									) : (
										<span className="flex shrink-0 items-center gap-1.5 text-muted-foreground text-sm">
											<Upload className="h-3 w-3 shrink-0" />
											{col.extensions
												? `Supports ${col.extensions.join(", ")}`
												: "All file types supported"}
										</span>
									)}
								</button>
							);
						})}

						{/* Remove button — invisible on the trailing empty row */}
						<button
							type="button"
							className={`flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:text-destructive ${rowIdx === trailingIdx ? "invisible" : ""}`}
							onClick={() => removeRow(rowIdx)}
						>
							<X className="h-4 w-4" />
						</button>
					</div>
				);
			})}
		</div>
	);
}
