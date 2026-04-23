import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useState } from "react";

interface FileDragContextType {
	isDragging: boolean;
	setIsDragging: (isDragging: boolean) => void;
	droppedFiles: File[];
	clearDroppedFiles: () => void;
}

export const FileDragContext = createContext<FileDragContextType | undefined>(
	undefined,
);

export const FileDragProvider = ({ children }: { children: ReactNode }) => {
	const [isDragging, setIsDragging] = useState(false);
	const [droppedFiles, setDroppedFiles] = useState<File[]>([]);

	const clearDroppedFiles = useCallback(() => setDroppedFiles([]), []);

	return (
		<FileDragContext.Provider
			value={{
				isDragging,
				setIsDragging,
				droppedFiles,
				clearDroppedFiles,
			}}
		>
			<div
				role="none"
				className="relative h-full w-full"
				onDragOver={(e) => {
					if (e.dataTransfer.types.includes("Files")) {
						e.preventDefault();
						setIsDragging(true);
					}
				}}
				onDragLeave={(e) => {
					if (!e.currentTarget.contains(e.relatedTarget as Node)) {
						setIsDragging(false);
					}
				}}
				onDrop={(e) => {
					e.preventDefault();
					setIsDragging(false);
					const files = Array.from(e.dataTransfer.files);
					if (files.length > 0) {
						setDroppedFiles(files);
					}
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
