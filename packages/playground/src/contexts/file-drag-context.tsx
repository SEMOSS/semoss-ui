import type { ReactNode } from "react";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";

interface FileDragContextType {
	/** True while a file is being dragged over the provider's territory. */
	isDragging: boolean;
	files: File[];
	addFiles: (files: File[]) => void;
	removeFile: (index: number) => void;
	clearFiles: () => void;
	/** Opens the OS file picker (the hidden input this provider renders). */
	openFilePicker: () => void;
}

export const FileDragContext = createContext<FileDragContextType | undefined>(
	undefined,
);

export const FileDragProvider = ({ children }: { children: ReactNode }) => {
	const [isDragging, setIsDragging] = useState(false);
	const [files, setFiles] = useState<File[]>([]);
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
	const openFilePicker = useCallback(() => fileInputRef.current?.click(), []);

	useEffect(() => {
		return () => {
			if (abandonTimerRef.current) clearTimeout(abandonTimerRef.current);
		};
	}, []);

	return (
		<FileDragContext.Provider
			value={{
				isDragging,
				files,
				addFiles,
				removeFile,
				clearFiles,
				openFilePicker,
			}}
		>
			<div
				role="none"
				className="relative h-full w-full"
				onDragOver={(e) => {
					if (!e.dataTransfer.types.includes("Files")) return;
					e.preventDefault();
					setIsDragging(true);

					// dragleave doesn't reliably fire (e.g. the pointer leaves the
					// window entirely), so treat the drag as abandoned if no new
					// dragover arrives within this window.
					if (abandonTimerRef.current)
						clearTimeout(abandonTimerRef.current);
					abandonTimerRef.current = setTimeout(
						() => setIsDragging(false),
						300,
					);
				}}
				onDrop={(e) => {
					if (!e.dataTransfer.types.includes("Files")) return;
					e.preventDefault();
					if (abandonTimerRef.current)
						clearTimeout(abandonTimerRef.current);
					setIsDragging(false);
					const dropped = Array.from(e.dataTransfer.files);
					if (dropped.length > 0) addFiles(dropped);
				}}
			>
				<input
					ref={fileInputRef}
					type="file"
					multiple
					hidden
					onChange={(e) => {
						if (e.target.files) {
							addFiles(Array.from(e.target.files));
							e.target.value = "";
						}
					}}
				/>
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
