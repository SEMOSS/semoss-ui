import type { ReactNode } from "react";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";

/** What {@link useFileDrop} gives the composer and its outlines. */
interface FileDropContextType {
	/** True while a file is being dragged over the provider's territory. */
	isDragging: boolean;
	/** The files waiting to go with the next message, in the order added. */
	files: File[];
	/** Adds files after the ones already waiting. */
	addFiles: (files: File[]) => void;
	/** Removes the waiting file at an index. */
	removeFile: (index: number) => void;
	/** Removes every waiting file, as once a message takes them. */
	clearFiles: () => void;
	/** Opens the OS file picker (the hidden input this provider renders). */
	openFilePicker: () => void;
}

/** The provider's drag state and waiting files; undefined outside it. */
const FileDropContext = createContext<FileDropContextType | undefined>(
	undefined,
);

/** Props for {@link FileDropProvider}. */
interface FileDropProviderProps {
	/** The area that takes dropped files, such as the conversation. */
	children: ReactNode;
}

/**
 * Takes files dropped anywhere over its children, or picked with its hidden
 * file input, and holds them for the composer's next message. Reports when a
 * file is dragged over it, so the conversation can outline itself.
 */
export const FileDropProvider = ({ children }: FileDropProviderProps) => {
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

	// stop a pending abandon timer from setting state after unmount
	useEffect(() => {
		return () => {
			if (abandonTimerRef.current) clearTimeout(abandonTimerRef.current);
		};
	}, []);

	return (
		<FileDropContext.Provider
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
							// clear it, so picking the same file again still fires a change
							e.target.value = "";
						}
					}}
				/>
				{children}
			</div>
		</FileDropContext.Provider>
	);
};

/**
 * Read the enclosing {@link FileDropProvider}.
 *
 * @returns The drag state, the waiting files, and their actions.
 * @throws When called outside a `FileDropProvider`.
 */
export const useFileDrop = (): FileDropContextType => {
	const context = useContext(FileDropContext);
	if (!context) {
		throw new Error("useFileDrop must be used within FileDropProvider");
	}
	return context;
};
