import type { ReactNode } from "react";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";

/** Attribute placed on the file-drag dialog so drag-boundary checks can find it. */
export const FILE_DRAG_ATTR = "data-file-drag";

/** Returns true if the element is inside our portaled file-drag dialog. */
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
	fileInputRef: React.RefObject<HTMLInputElement>;
	containerRef: React.RefObject<HTMLDivElement>;
}

export const FileDragContext = createContext<FileDragContextType | undefined>(
	undefined,
);

export const FileDragProvider = ({ children }: { children: ReactNode }) => {
	const [isDragging, setIsDragging] = useState(false);
	const [shouldStayOpen, setShouldStayOpen] = useState(false);
	const [files, setFiles] = useState<File[]>([]);
	const containerRef = useRef<HTMLDivElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const abandonTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const addFiles = useCallback(
		(newFiles: File[]) => setFiles((prev) => [...prev, ...newFiles]),
		[],
	);
	const removeFile = useCallback(
		(index: number) =>
			setFiles((prev) => prev.filter((_, i) => i !== index)),
		[],
	);
	const clearFiles = useCallback(() => setFiles([]), []);

	// Active whenever a drag is in progress OR the file modal is open.
	//
	// - dragover: when the modal is open (shouldStayOpen) accept from the whole
	//   page; otherwise restrict to the container + portaled dialog and cancel
	//   immediately if the drag moves outside that territory.
	// - drop: catch files dropped anywhere on the page.
	useEffect(() => {
		if (!isDragging && !shouldStayOpen) return;

		const cancel = () => {
			if (abandonTimerRef.current) clearTimeout(abandonTimerRef.current);
			setIsDragging(false);
		};

		const onWindowDragOver = (e: DragEvent) => {
			if (!e.dataTransfer?.types.includes("Files")) return;

			if (!shouldStayOpen) {
				// No open modal — enforce provider territory.
				const rect = containerRef.current?.getBoundingClientRect();
				const inContainer =
					rect &&
					e.clientX >= rect.left &&
					e.clientX <= rect.right &&
					e.clientY >= rect.top &&
					e.clientY <= rect.bottom;
				if (
					!inContainer &&
					!isInFileDragDialog(
						document.elementFromPoint(e.clientX, e.clientY),
					)
				) {
					cancel();
					return;
				}
			}

			e.preventDefault();
			setIsDragging(true);
			if (abandonTimerRef.current) clearTimeout(abandonTimerRef.current);
			abandonTimerRef.current = setTimeout(cancel, 300);
		};

		const onWindowDrop = (e: DragEvent) => {
			if (!e.dataTransfer?.types.includes("Files")) return;
			e.preventDefault();
			cancel();
			const dropped = Array.from(e.dataTransfer.files);
			if (dropped.length > 0) {
				addFiles(dropped);
				setShouldStayOpen(true);
			}
		};

		window.addEventListener("dragover", onWindowDragOver);
		window.addEventListener("drop", onWindowDrop);
		if (isDragging) abandonTimerRef.current = setTimeout(cancel, 300);

		return () => {
			window.removeEventListener("dragover", onWindowDragOver);
			window.removeEventListener("drop", onWindowDrop);
			if (abandonTimerRef.current) clearTimeout(abandonTimerRef.current);
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
			}}
		>
			<div
				ref={containerRef}
				role="none"
				className="relative h-full w-full"
				onDragOver={(e) => {
					if (!e.dataTransfer.types.includes("Files")) return;

					// Walk from the visual hit-target up to (not including) the
					// container. If any ancestor is fixed, a modal or backdrop is
					// covering the content — don't activate.
					const top = document.elementFromPoint(e.clientX, e.clientY);
					let el: Element | null = top;
					while (el && el !== containerRef.current) {
						if (window.getComputedStyle(el).position === "fixed")
							return;
						el = el.parentElement;
					}

					e.preventDefault();
					setIsDragging(true);
				}}
			>
				{children}
			</div>
		</FileDragContext.Provider>
	);
};

export const useFileDrag = (): FileDragContextType => {
	const context = useContext(FileDragContext);
	if (!context) {
		throw new Error("useFileDrag must be used within FileDragProvider");
	}
	return context;
};
