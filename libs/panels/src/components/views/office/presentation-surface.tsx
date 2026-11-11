import {
	ArrowDown,
	ArrowUp,
	ChevronLeft,
	ChevronRight,
	Copy,
	CopyPlus,
	Group,
	Layers,
	List,
	ListOrdered,
	Plus,
	Scissors,
	Shapes,
	Table,
	Trash2,
	Type,
	Ungroup,
	ZoomIn,
	ZoomOut,
} from "lucide-react";
import {
	type PowerPointViewerHandle,
	SlideCanvas,
	useViewerBuildingBlocks,
	ViewerThemeProvider,
} from "pptx-react-viewer";
import { type RefObject, useState } from "react";
import {
	Alert,
	AlertDescription,
	Button,
	ButtonGroup,
	Checkbox,
	Input,
	Label,
	Muted,
	ScrollArea,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	toast,
} from "@semoss/ui/next";
import { OfficeActionButton } from "./office-action-button";
import { OfficeSelect } from "./office-select";
import { OfficeSurfaceStatus } from "./office-surface-status";
import { OfficeTextControls } from "./office-text-controls";
import { PPTX_VIEWER_THEME } from "./pptx-viewer-policy";

interface PresentationSurfaceProps {
	content: Uint8Array;
	fileName: string;
	readOnly: boolean;
	handle: RefObject<PowerPointViewerHandle | null>;
	onDirtyChange: (dirty: boolean) => void;
}

/** Standalone slide surface with SEMOSS controls; private vendor dialogs are omitted. */
export const PresentationSurface = ({
	content,
	fileName,
	readOnly,
	handle,
	onDirtyChange,
}: PresentationSurfaceProps) => {
	const [slideCount, setSlideCount] = useState(0);
	const blocks = useViewerBuildingBlocks({
		content,
		fileName,
		canEdit: !readOnly,
		autosaveEnabled: false,
		handle,
		onDirtyChange,
		onSlideCountChange: setSlideCount,
	});
	const toolbar = blocks.toolbarProps;
	const canvas = blocks.canvasProps;
	const active = canvas.activeSlideIndex ?? 0;
	const selected = toolbar.selectedElement;
	const style =
		selected && "textStyle" in selected ? selected.textStyle : undefined;
	const canEdit = !readOnly && toolbar.canEdit && !blocks.loading;
	const canFormat =
		canEdit &&
		selected !== null &&
		(selected.type === "text" ||
			selected.type === "shape" ||
			selected.type === "connector");
	return (
		<div className="flex size-full min-h-0 min-w-0 flex-col">
			<OfficeSurfaceStatus
				fileName={fileName}
				readOnly={!canEdit}
				isLoading={blocks.loading}
			/>
			<Tabs
				defaultValue="home"
				className="shrink-0 gap-0 border-border border-b"
			>
				<TabsList className="m-2 mb-0">
					<TabsTrigger value="home">Home</TabsTrigger>
					<TabsTrigger value="insert">Insert</TabsTrigger>
					<TabsTrigger value="arrange">Arrange</TabsTrigger>
					<TabsTrigger value="view">View</TabsTrigger>
				</TabsList>
				<TabsContent
					value="home"
					className="flex flex-wrap items-center gap-2 p-2"
				>
					<OfficeTextControls
						canEdit={canEdit}
						canUndo={toolbar.canUndo}
						canRedo={toolbar.canRedo}
						bold={style?.bold ?? false}
						italic={style?.italic ?? false}
						underline={style?.underline ?? false}
						fontFamily={style?.fontFamily ?? null}
						fontSize={style?.fontSize ?? null}
						alignment={style?.align ?? null}
						enabled={{
							bold: canFormat,
							italic: canFormat,
							underline: canFormat,
							fontFamily: canFormat,
							fontSize: canFormat,
							alignment: canFormat,
						}}
						allowJustify
						onBold={() =>
							toolbar.onUpdateTextStyle({ bold: !style?.bold })
						}
						onItalic={() =>
							toolbar.onUpdateTextStyle({
								italic: !style?.italic,
							})
						}
						onUnderline={() =>
							toolbar.onUpdateTextStyle({
								underline: !style?.underline,
							})
						}
						onFontFamilyChange={(fontFamily) =>
							toolbar.onUpdateTextStyle({ fontFamily })
						}
						onFontSizeChange={(fontSize) =>
							toolbar.onUpdateTextStyle({ fontSize })
						}
						onAlignmentChange={(align) =>
							toolbar.onUpdateTextStyle({ align })
						}
						onUndo={toolbar.onUndo}
						onRedo={toolbar.onRedo}
					/>
					<ButtonGroup aria-label="Lists">
						<OfficeActionButton
							label="Bulleted list"
							icon={List}
							disabled={!canFormat}
							onAction={() => toolbar.onToggleBullets("bullet")}
						/>
						<OfficeActionButton
							label="Numbered list"
							icon={ListOrdered}
							disabled={!canFormat}
							onAction={() => toolbar.onToggleBullets("numbered")}
						/>
					</ButtonGroup>
					<ButtonGroup aria-label="Clipboard">
						<OfficeActionButton
							label="Copy element"
							icon={Copy}
							disabled={!selected}
							onAction={toolbar.onCopy}
						/>
						<OfficeActionButton
							label="Cut element"
							icon={Scissors}
							disabled={!canEdit || !selected}
							onAction={toolbar.onCut}
						/>
						<OfficeActionButton
							label="Paste element"
							icon={CopyPlus}
							disabled={!canEdit || !toolbar.clipboardPayload}
							onAction={toolbar.onPaste}
						/>
					</ButtonGroup>
				</TabsContent>
				<TabsContent
					value="insert"
					className="flex flex-wrap items-center gap-2 p-2"
				>
					<OfficeActionButton
						label="Add slide"
						icon={Plus}
						disabled={!canEdit}
						onAction={() => handle.current?.addSlide(active)}
					/>
					<OfficeActionButton
						label="Insert text box"
						icon={Type}
						disabled={!canEdit}
						onAction={toolbar.onAddTextBox}
					/>
					<OfficeSelect
						label="Shape"
						value={toolbar.newShapeType}
						options={[
							{ value: "rect", label: "Rectangle" },
							{ value: "ellipse", label: "Ellipse" },
							{ value: "triangle", label: "Triangle" },
							{ value: "rtArrow", label: "Arrow" },
						]}
						disabled={!canEdit}
						onChange={(value) => {
							if (
								value === "rect" ||
								value === "ellipse" ||
								value === "triangle" ||
								value === "rtArrow"
							)
								toolbar.onSetNewShapeType(value);
						}}
					/>
					<OfficeActionButton
						label="Insert shape"
						icon={Shapes}
						disabled={!canEdit}
						onAction={toolbar.onAddShape}
					/>
					<OfficeActionButton
						label="Insert table"
						icon={Table}
						disabled={!canEdit}
						onAction={() => toolbar.onAddTable(3, 3)}
					/>
					{toolbar.onAddChart && (
						<Button
							size="sm"
							variant="outline"
							disabled={!canEdit}
							onClick={() => toolbar.onAddChart?.("bar")}
						>
							Insert chart
						</Button>
					)}
				</TabsContent>
				<TabsContent
					value="arrange"
					className="flex flex-wrap items-center gap-2 p-2"
				>
					<OfficeActionButton
						label="Duplicate element"
						icon={CopyPlus}
						disabled={!canEdit || !selected}
						onAction={toolbar.onDuplicate}
					/>
					<OfficeActionButton
						label="Delete element"
						icon={Trash2}
						disabled={!canEdit || !selected}
						onAction={toolbar.onDelete}
					/>
					<OfficeActionButton
						label="Group elements"
						icon={Group}
						disabled={
							!canEdit ||
							toolbar.selectedCount < 2 ||
							!toolbar.selectionGroupable
						}
						onAction={toolbar.onGroupElements}
					/>
					<OfficeActionButton
						label="Ungroup element"
						icon={Ungroup}
						disabled={!canEdit || selected?.type !== "group"}
						onAction={toolbar.onUngroupElement}
					/>
					<OfficeActionButton
						label="Bring forward"
						icon={Layers}
						disabled={!canEdit || !selected}
						onAction={() => toolbar.onMoveLayer("forward")}
					/>
					<OfficeActionButton
						label="Send backward"
						icon={Layers}
						disabled={!canEdit || !selected}
						onAction={() => toolbar.onMoveLayer("backward")}
					/>
					{selected &&
						(["x", "y", "width", "height"] as const).map(
							(property) => (
								<Label
									key={property}
									className="flex items-center gap-2"
								>
									{property}
									<Input
										key={`${selected.id}:${property}:${selected[property]}`}
										className="w-24"
										type="number"
										step="1"
										defaultValue={Math.round(
											selected[property],
										)}
										disabled={!canEdit}
										aria-label={`Element ${property}`}
										onKeyDown={(event) => {
											if (event.key === "Enter")
												event.currentTarget.blur();
										}}
										onBlur={(event) => {
											const value =
												event.currentTarget
													.valueAsNumber;
											if (!canEdit) return;
											if (
												!Number.isFinite(value) ||
												((property === "width" ||
													property === "height") &&
													value <= 0)
											) {
												event.currentTarget.value =
													String(
														Math.round(
															selected[property],
														),
													);
												toast.error(
													`Enter a valid element ${property}.`,
												);
												return;
											}
											if (value !== selected[property]) {
												try {
													handle.current?.updateElement(
														selected.id,
														{ [property]: value },
													);
												} catch (error) {
													toast.error(
														error instanceof Error
															? error.message
															: String(error),
													);
												}
											}
										}}
									/>
								</Label>
							),
						)}
				</TabsContent>
				<TabsContent
					value="view"
					className="flex flex-wrap items-center gap-3 p-2"
				>
					<Label className="flex items-center gap-2">
						<Checkbox
							checked={toolbar.showGrid}
							onCheckedChange={(checked) =>
								toolbar.onSetShowGrid(checked === true)
							}
						/>
						Grid
					</Label>
					<Label className="flex items-center gap-2">
						<Checkbox
							checked={toolbar.showRulers}
							onCheckedChange={(checked) =>
								toolbar.onSetShowRulers(checked === true)
							}
						/>
						Rulers
					</Label>
					<Button
						size="sm"
						variant="outline"
						onClick={toolbar.onZoomToFit}
					>
						Fit slide
					</Button>
				</TabsContent>
			</Tabs>
			{blocks.error && (
				<Alert variant="destructive">
					<AlertDescription>{blocks.error}</AlertDescription>
				</Alert>
			)}
			<div className="flex min-h-0 flex-1">
				<ScrollArea
					className="w-24 shrink-0 border-border border-r sm:w-36"
					aria-label="Slides"
				>
					<div className="flex flex-col gap-2 p-2">
						{Array.from({ length: slideCount }, (_, index) => (
							<Button
								key={`slide-${index + 1}`}
								size="sm"
								variant={
									index === active ? "secondary" : "ghost"
								}
								aria-current={
									index === active ? "true" : undefined
								}
								onClick={() => handle.current?.goTo(index)}
							>
								Slide {index + 1}
							</Button>
						))}
					</div>
				</ScrollArea>
				<div className="pptx-viewer-scope flex min-h-0 min-w-0 flex-1">
					<ViewerThemeProvider theme={PPTX_VIEWER_THEME}>
						<SlideCanvas
							{...canvas}
							showCommentMarkers={false}
							onContextMenu={(_id, event) =>
								event.preventDefault()
							}
							onCanvasContextMenu={(event) =>
								event.preventDefault()
							}
						/>
					</ViewerThemeProvider>
				</div>
			</div>
			<footer className="flex shrink-0 flex-wrap items-center gap-2 border-border border-t p-2">
				<ButtonGroup aria-label="Slide navigation">
					<OfficeActionButton
						label="Previous slide"
						icon={ChevronLeft}
						disabled={active <= 0}
						onAction={() => handle.current?.goPrev()}
					/>
					<Muted className="self-center px-2 text-sm">
						Slide {slideCount ? active + 1 : 0} of {slideCount}
					</Muted>
					<OfficeActionButton
						label="Next slide"
						icon={ChevronRight}
						disabled={active >= slideCount - 1}
						onAction={() => handle.current?.goNext()}
					/>
				</ButtonGroup>
				<ButtonGroup aria-label="Slide management">
					<OfficeActionButton
						label="Add slide"
						icon={Plus}
						disabled={!canEdit}
						onAction={() => handle.current?.addSlide(active)}
					/>
					<OfficeActionButton
						label="Duplicate slide"
						icon={CopyPlus}
						disabled={!canEdit || !slideCount}
						onAction={() =>
							handle.current?.duplicateSlides([active])
						}
					/>
					<OfficeActionButton
						label="Delete slide"
						icon={Trash2}
						disabled={!canEdit || slideCount <= 1}
						onAction={() => handle.current?.deleteSlides([active])}
					/>
					<OfficeActionButton
						label="Move slide up"
						icon={ArrowUp}
						disabled={!canEdit || active <= 0}
						onAction={() =>
							handle.current?.moveSlide(active, active - 1)
						}
					/>
					<OfficeActionButton
						label="Move slide down"
						icon={ArrowDown}
						disabled={!canEdit || active >= slideCount - 1}
						onAction={() =>
							handle.current?.moveSlide(active, active + 1)
						}
					/>
				</ButtonGroup>
				<ButtonGroup aria-label="Slide zoom" className="ml-auto">
					<OfficeActionButton
						label="Zoom out"
						icon={ZoomOut}
						onAction={toolbar.onZoomOut}
					/>
					<Muted className="self-center px-2 text-sm">
						{Math.round(toolbar.scale * 100)}%
					</Muted>
					<OfficeActionButton
						label="Zoom in"
						icon={ZoomIn}
						onAction={toolbar.onZoomIn}
					/>
				</ButtonGroup>
			</footer>
		</div>
	);
};
