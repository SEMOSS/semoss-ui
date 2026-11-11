import {
	type EditorHandle,
	SpreadsheetCanvas,
	useViewerBuildingBlocks,
} from "@christophervr/xlsx-react-viewer";
import { Check, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Alert, AlertDescription, Input, Label, Muted } from "@semoss/ui/next";
import { OfficeActionButton } from "./office-action-button";
import { OfficeSelect } from "./office-select";
import { OfficeSurfaceStatus } from "./office-surface-status";
import { OfficeTextControls } from "./office-text-controls";
import { XLSX_HIDDEN_ACTIONS } from "./xlsx-viewer-policy";

interface SpreadsheetSurfaceProps {
	fileName: string;
	readOnly: boolean;
	onElement: (element: EditorHandle["element"] | null) => void;
}

/** Custom spreadsheet chrome; workbook load/save/access remain owned by the host. */
export const SpreadsheetSurface = ({
	fileName,
	readOnly,
	onElement,
}: SpreadsheetSurfaceProps) => {
	const handle = useRef<EditorHandle>(null);
	const formulaId = useId();
	const [address, setAddress] = useState<string | null>(null);
	const [selectionError, setSelectionError] = useState<string | null>(null);
	const blocks = useViewerBuildingBlocks({
		handle,
		fileName,
		canEdit: !readOnly,
		readOnly,
		hiddenActions: XLSX_HIDDEN_ACTIONS,
	});
	useEffect(() => {
		onElement(handle.current?.element ?? null);
		return () => onElement(null);
	}, [onElement]);
	const toolbar = blocks.toolbarProps;
	return (
		<div className="flex size-full min-h-0 min-w-0 flex-col">
			<OfficeSurfaceStatus
				fileName={fileName}
				readOnly={readOnly}
				isLoading={blocks.loading}
			/>
			<fieldset
				className="flex shrink-0 flex-wrap items-center gap-2 border-border border-b p-2"
				aria-label="Workbook formatting"
			>
				{toolbar && (
					<>
						<OfficeTextControls
							{...toolbar}
							canEdit={!readOnly && toolbar.canEdit}
							fontFamilies={toolbar.options.fontFamilies}
							fontSizes={toolbar.options.fontSizes}
							onAlignmentChange={(alignment) =>
								alignment === "justify"
									? false
									: toolbar.onAlignmentChange(alignment)
							}
						/>
						<OfficeSelect
							label="Number format"
							value={toolbar.numberFormat}
							options={toolbar.options.numberFormats}
							disabled={readOnly || !toolbar.enabled.numberFormat}
							onChange={toolbar.onNumberFormatChange}
						/>
					</>
				)}
			</fieldset>
			<div className="flex shrink-0 flex-wrap items-center gap-2 border-border border-b p-2">
				<Input
					className="w-28"
					aria-label="Cell address"
					value={address ?? toolbar?.selection ?? ""}
					disabled={!toolbar || blocks.loading}
					onChange={(event) => setAddress(event.target.value)}
					onBlur={() => setAddress(null)}
					onKeyDown={(event) => {
						if (event.key === "Enter") {
							event.preventDefault();
							try {
								const selected = toolbar?.onSelect(
									event.currentTarget.value,
								);
								setSelectionError(
									selected
										? null
										: "The cell address could not be selected.",
								);
								if (selected) setAddress(null);
							} catch (error) {
								setSelectionError(
									error instanceof Error
										? error.message
										: String(error),
								);
							}
						}
						if (event.key === "Escape") {
							setAddress(null);
							setSelectionError(null);
						}
					}}
				/>
				<Label className="sr-only" htmlFor={formulaId}>
					Formula
				</Label>
				<Input
					id={formulaId}
					className="min-w-40 flex-1"
					aria-label="Formula"
					value={toolbar?.formula ?? ""}
					disabled={!toolbar || blocks.loading}
					readOnly={readOnly || !toolbar?.canEdit}
					onChange={(event) =>
						toolbar?.onFormulaInput(
							event.currentTarget.value,
							event.currentTarget.selectionStart ?? undefined,
						)
					}
					onSelect={(event) => {
						if (toolbar?.editing)
							toolbar.onFormulaInput(
								event.currentTarget.value,
								event.currentTarget.selectionStart ?? undefined,
							);
					}}
					onKeyDown={(event) => {
						if (event.key === "Enter") {
							event.preventDefault();
							toolbar?.onFormulaChange(event.currentTarget.value);
						}
						if (event.key === "Escape") {
							event.preventDefault();
							toolbar?.onCancelEdit();
						}
					}}
				/>
				<OfficeActionButton
					label="Commit cell edit"
					icon={Check}
					disabled={readOnly || !toolbar?.editing}
					onAction={() => toolbar?.commitEdit()}
				/>
				<OfficeActionButton
					label="Cancel cell edit"
					icon={X}
					disabled={readOnly || !toolbar?.editing}
					onAction={() => toolbar?.onCancelEdit()}
				/>
			</div>
			{(blocks.editError || selectionError || blocks.error) && (
				<Alert variant="destructive">
					<AlertDescription>
						{blocks.editError ||
							selectionError ||
							blocks.error?.message}
					</AlertDescription>
				</Alert>
			)}
			<SpreadsheetCanvas
				{...blocks.canvasProps}
				className="min-h-0 w-full flex-1 overflow-hidden"
			/>
			<footer className="flex shrink-0 flex-wrap items-center gap-3 border-border border-t p-2">
				{toolbar && (
					<OfficeSelect
						label="Worksheet"
						value={String(toolbar.activeSheet)}
						options={toolbar.sheets
							.filter(
								(sheet) =>
									sheet.state !== "hidden" &&
									sheet.state !== "veryHidden",
							)
							.map((sheet) => ({
								value: String(sheet.index),
								label: sheet.name,
							}))}
						onChange={(value) =>
							toolbar.onSheetChange(Number(value))
						}
					/>
				)}
				<Muted className="text-sm">{toolbar?.selection ?? ""}</Muted>
			</footer>
		</div>
	);
};
