import {
	DocumentCanvas,
	type EditorHandle,
	type FindReplaceRequest,
	type HyperlinkRequest,
	type ImagePickerRequest,
	useViewerBuildingBlocks,
} from "docx-react-viewer";
import {
	ChevronLeft,
	ChevronRight,
	ImagePlus,
	Link,
	List,
	ListOrdered,
	Search,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
	Alert,
	AlertDescription,
	ButtonGroup,
	Muted,
	Slider,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	ToggleGroup,
	ToggleGroupItem,
} from "@semoss/ui/next";
import { OfficeActionButton } from "./office-action-button";
import { OfficeSelect } from "./office-select";
import { OfficeSurfaceStatus } from "./office-surface-status";
import { OfficeTextControls } from "./office-text-controls";
import { WordFindBar } from "./word-find-bar";
import { WordLinkDialog } from "./word-link-dialog";
import { WordPictureDialog } from "./word-picture-dialog";

interface WordSurfaceProps {
	fileName: string;
	readOnly: boolean;
	/** The existing host session remains the only owner of file loading and saving. */
	onElement: (element: EditorHandle["element"] | null) => void;
}

/** SEMOSS application controls around the library's document-only editing surface. */
export const WordSurface = ({
	fileName,
	readOnly,
	onElement,
}: WordSurfaceProps) => {
	const handle = useRef<EditorHandle>(null);
	const linkButton = useRef<HTMLButtonElement>(null);
	const pictureButton = useRef<HTMLButtonElement>(null);
	const findButton = useRef<HTMLButtonElement>(null);
	const [link, setLink] = useState<HyperlinkRequest | null>(null);
	const [picture, setPicture] = useState<ImagePickerRequest | null>(null);
	const [find, setFind] = useState<FindReplaceRequest | null>(null);
	const blocks = useViewerBuildingBlocks({
		handle,
		canEdit: !readOnly,
		readOnly,
		onOpenHyperlinkDialog: setLink,
		onOpenImagePicker: setPicture,
		onOpenFindReplace: setFind,
	});
	useEffect(() => {
		onElement(handle.current?.element ?? null);
		return () => onElement(null);
	}, [onElement]);
	const toolbar = blocks.toolbarProps;
	const navigation = blocks.navigationProps;
	const status = blocks.statusProps;
	const initializedView = useRef(false);
	useEffect(() => {
		if (navigation && !initializedView.current) {
			initializedView.current = true;
			navigation.onViewModeChange("print");
		}
	}, [navigation]);
	return (
		<div className="flex size-full min-h-0 min-w-0 flex-col">
			<OfficeSurfaceStatus
				fileName={fileName}
				readOnly={readOnly}
				isLoading={blocks.loading}
			/>
			<Tabs
				defaultValue="home"
				className="shrink-0 gap-0 border-border border-b"
			>
				<TabsList className="m-2 mb-0">
					<TabsTrigger value="home">Home</TabsTrigger>
					<TabsTrigger value="insert">Insert</TabsTrigger>
					<TabsTrigger value="view">View</TabsTrigger>
				</TabsList>
				<TabsContent
					value="home"
					className="flex flex-wrap items-center gap-2 p-2"
				>
					{toolbar && (
						<>
							<OfficeTextControls
								{...toolbar}
								canEdit={!readOnly && toolbar.canEdit}
								allowJustify
							/>
							<ToggleGroup
								type="single"
								size="sm"
								aria-label="Lists"
								disabled={readOnly || !toolbar.canEdit}
								value={
									toolbar.list === "bullet" ||
									toolbar.list === "number"
										? toolbar.list
										: ""
								}
								onValueChange={(value) =>
									toolbar.onListChange(
										value === "bullet" || value === "number"
											? value
											: "remove",
									)
								}
							>
								<ToggleGroupItem
									value="bullet"
									aria-label="Bulleted list"
									onMouseDown={(event) =>
										event.preventDefault()
									}
								>
									<List aria-hidden="true" />
								</ToggleGroupItem>
								<ToggleGroupItem
									value="number"
									aria-label="Numbered list"
									onMouseDown={(event) =>
										event.preventDefault()
									}
								>
									<ListOrdered aria-hidden="true" />
								</ToggleGroupItem>
							</ToggleGroup>
							<OfficeActionButton
								label="Find and replace"
								buttonRef={findButton}
								icon={Search}
								disabled={!toolbar.canFindReplace}
								onAction={toolbar.openFindReplace}
							/>
						</>
					)}
				</TabsContent>
				<TabsContent
					value="insert"
					className="flex flex-wrap items-center gap-2 p-2"
				>
					<OfficeActionButton
						label="Insert link"
						buttonRef={linkButton}
						icon={Link}
						disabled={readOnly || !toolbar?.canInsertLink}
						onAction={() => toolbar?.openHyperlinkDialog()}
					/>
					<OfficeActionButton
						label="Insert picture"
						buttonRef={pictureButton}
						icon={ImagePlus}
						disabled={readOnly || !toolbar?.canInsertPicture}
						onAction={() => toolbar?.openImagePicker()}
					/>
				</TabsContent>
				<TabsContent
					value="view"
					className="flex flex-wrap items-center gap-2 p-2"
				>
					{navigation && (
						<OfficeSelect
							label="Document view"
							value={navigation.viewMode}
							options={[
								{ value: "draft", label: "Draft" },
								{ value: "print", label: "Print layout" },
							]}
							onChange={(value) =>
								navigation.onViewModeChange(
									value === "print" ? "print" : "draft",
								)
							}
						/>
					)}
					<OfficeActionButton
						label="Find and replace"
						buttonRef={findButton}
						icon={Search}
						disabled={!toolbar?.canFindReplace}
						onAction={() => toolbar?.openFindReplace()}
					/>
				</TabsContent>
			</Tabs>
			{find && (
				<WordFindBar
					request={find}
					readOnly={readOnly}
					onClose={() => {
						setFind(null);
						findButton.current?.focus();
					}}
				/>
			)}
			{blocks.error && (
				<Alert variant="destructive">
					<AlertDescription>{blocks.error.message}</AlertDescription>
				</Alert>
			)}
			<DocumentCanvas
				{...blocks.canvasProps}
				className="min-h-0 w-full flex-1 overflow-hidden"
			/>
			<footer className="flex shrink-0 flex-wrap items-center gap-3 border-border border-t px-3 py-2">
				<Muted className="text-sm">
					{status?.wordText ?? "Loading document"}
				</Muted>
				{navigation?.pagesAvailable && (
					<ButtonGroup aria-label="Pages">
						<OfficeActionButton
							label="Previous page"
							icon={ChevronLeft}
							disabled={!navigation.canGoPrevious}
							onAction={navigation.onPreviousPage}
						/>
						<Muted className="self-center px-2 text-sm">
							{navigation.pageText}
						</Muted>
						<OfficeActionButton
							label="Next page"
							icon={ChevronRight}
							disabled={!navigation.canGoNext}
							onAction={navigation.onNextPage}
						/>
					</ButtonGroup>
				)}
				{status && (
					<div className="ml-auto flex items-center gap-2">
						<Slider
							className="w-28"
							aria-label="Document zoom"
							min={status.minZoom}
							max={status.maxZoom}
							step={10}
							value={[status.zoom]}
							onValueChange={(values) => {
								if (values[0] !== undefined)
									status.onZoomChange(values[0]);
							}}
						/>
						<Muted className="text-sm">{status.zoom}%</Muted>
					</div>
				)}
			</footer>
			{link && (
				<WordLinkDialog
					request={link}
					readOnly={readOnly}
					onClose={() => setLink(null)}
					onReturnFocus={() => linkButton.current?.focus()}
				/>
			)}
			{picture && (
				<WordPictureDialog
					request={picture}
					readOnly={readOnly}
					onClose={() => setPicture(null)}
					onReturnFocus={() => pictureButton.current?.focus()}
				/>
			)}
		</div>
	);
};
