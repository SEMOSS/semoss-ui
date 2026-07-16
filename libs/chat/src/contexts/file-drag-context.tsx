import type {
	MutableRefObject,
	DragEvent as ReactDragEvent,
	ReactNode,
} from "react";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";

export const FILE_DRAG_ATTR = "data-file-drag";

const isInFileDragDialog = (el: Element | null) =>
	!!el?.closest(`[${FILE_DRAG_ATTR}]`);

interface FileDragContextType {
	isDragging: boolean;
	setIsDragging: (isDragging: boolean) => void;
	shouldStayOpen: boolean;
	setShouldStayOpen: (open: boolean) => void;
	files: File[];
	addFiles: (files: File[]) => void;
	removeFile: (index: number) => void;
	clearFiles: () => void;
	fileInputRef: MutableRefObject<HTMLInputElement | null>;
	containerRef: MutableRefObject<HTMLElement | null>;
	handleContainerDragOver: (event: ReactDragEvent<HTMLElement>) => void;
}

const FileDragContext = createContext<FileDragContextType | undefined>(
	undefined,
);

export const FileDragProvider = ({ children }: { children: ReactNode }) => {
	const [isDragging, setIsDragging] = useState(false);
	const [shouldStayOpen, setShouldStayOpen] = useState(false);
	const [files, setFiles] = useState<File[]>([]);
	const containerRef = useRef<HTMLElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const abandonTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const addFiles = useCallback(
		(newFiles: File[]) => setFiles((prev) => [...prev, ...newFiles]),
		[],
	);
	const removeFile = useCallback(
		(index: number) =>
			setFiles((prev) =>
				prev.filter((_, currentIndex) => currentIndex !== index),
			),
		[],
	);
	const clearFiles = useCallback(() => setFiles([]), []);

	const handleContainerDragOver = useCallback(
		(event: ReactDragEvent<HTMLElement>) => {
			if (!event.dataTransfer.types.includes("Files")) {
				return;
			}

			const top = document.elementFromPoint(event.clientX, event.clientY);
			let el: Element | null = top;
			while (el && el !== containerRef.current) {
				if (window.getComputedStyle(el).position === "fixed") {
					return;
				}
				el = el.parentElement;
			}

			event.preventDefault();
			setIsDragging(true);
		},
		[],
	);

	useEffect(() => {
		if (!isDragging && !shouldStayOpen) {
			return;
		}

		const cancel = () => {
			if (abandonTimerRef.current) {
				clearTimeout(abandonTimerRef.current);
			}
			setIsDragging(false);
		};

		const onWindowDragOver = (event: DragEvent) => {
			if (!event.dataTransfer?.types.includes("Files")) {
				return;
			}

			if (!shouldStayOpen) {
				const rect = containerRef.current?.getBoundingClientRect();
				const inContainer =
					rect &&
					event.clientX >= rect.left &&
					event.clientX <= rect.right &&
					event.clientY >= rect.top &&
					event.clientY <= rect.bottom;
				if (
					!inContainer &&
					!isInFileDragDialog(
						document.elementFromPoint(event.clientX, event.clientY),
					)
				) {
					cancel();
					return;
				}
			}

			event.preventDefault();
			setIsDragging(true);
			if (abandonTimerRef.current) {
				clearTimeout(abandonTimerRef.current);
			}
			abandonTimerRef.current = setTimeout(cancel, 300);
		};

		const onWindowDrop = (event: DragEvent) => {
			if (!event.dataTransfer?.types.includes("Files")) {
				return;
			}

			event.preventDefault();
			cancel();
			const dropped = Array.from(event.dataTransfer.files);
			if (dropped.length > 0) {
				addFiles(dropped);
				setShouldStayOpen(true);
			}
		};

		window.addEventListener("dragover", onWindowDragOver);
		window.addEventListener("drop", onWindowDrop);
		if (isDragging) {
			abandonTimerRef.current = setTimeout(cancel, 300);
		}

		return () => {
			window.removeEventListener("dragover", onWindowDragOver);
			window.removeEventListener("drop", onWindowDrop);
			if (abandonTimerRef.current) {
				clearTimeout(abandonTimerRef.current);
			}
		};
	}, [isDragging, shouldStayOpen, addFiles]);

	return (
		<FileDragContext.Provider
			value={{
				isDragging,
				setIsDragging,
				shouldStayOpen,
				setShouldStayOpen,
				files,
				addFiles,
				removeFile,
				clearFiles,
				fileInputRef,
				containerRef,
				handleContainerDragOver,
			}}
		>
			{children}
		</FileDragContext.Provider>
	);
};

export const useFileDrag = (): FileDragContextType => {
	const context = useContext(FileDragContext);
	if (!context) {
		throw new Error("useFileDrag must be used within a <FileDragProvider>");
	}
	return context;
};
