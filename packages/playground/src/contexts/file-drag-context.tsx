import type { ReactNode } from "react";
import {
	createContext,
	useCallback,
	useContext,
	useRef,
	useState,
} from "react";

interface FileDragContextType {
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
	const [files, setFiles] = useState<File[]>([]);
	const fileInputRef = useRef<HTMLInputElement>(null);

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

	return (
		<FileDragContext.Provider
			value={{ files, addFiles, removeFile, clearFiles, openFilePicker }}
		>
			<div
				role="none"
				className="relative h-full w-full"
				onDragOver={(e) => {
					if (!e.dataTransfer.types.includes("Files")) return;
					e.preventDefault();
				}}
				onDrop={(e) => {
					if (!e.dataTransfer.types.includes("Files")) return;
					e.preventDefault();
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
