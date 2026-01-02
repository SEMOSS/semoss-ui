import { Copy, RefreshCw, Save, X } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import { FileEditor, type FileEditorRefDef } from "@/components/common";
import { Panel } from "./Panel";

interface FileEditorPanelProps {
	path: string;
	engineId: string;
	insightId: string;
	onUnsave?: (path: string) => void;
	onSave?: (path: string) => void;
}

export const FileEditorPanel = observer((props: FileEditorPanelProps) => {
	const { path, engineId, insightId, onUnsave, onSave } = props;

	const [isModified, setIsModified] = useState(false);
	const fileEditorRef = useRef<FileEditorRefDef>(null);
	const [refreshContent, setRefreshContent] = useState(1);
	const [saveBeforeRefresh, setSaveBeforeRefresh] = useState(false);
	const [notification, setNotification] = useState<{
		show: boolean;
		message: string;
		type: "success" | "error";
	}>({ show: false, message: "", type: "success" });

	const onFileEditorChange = (isModifiedFlag: boolean) => {
		setIsModified(isModifiedFlag);
		if (isModifiedFlag) {
			onUnsave?.(path);
		} else {
			onSave?.(path);
		}
	};

	const showNotification = (message: string, type: "success" | "error") => {
		setNotification({ show: true, message, type });
	};

	useEffect(() => {
		if (notification.show) {
			const timer = setTimeout(() => {
				setNotification({ ...notification, show: false });
			}, 3000);
			return () => clearTimeout(timer);
		}
	}, [notification.show]);

	const copyPath = async () => {
		try {
			await navigator.clipboard.writeText(path);
			showNotification("Successfully copied path", "success");
		} catch {
			showNotification("Unable to copy path", "error");
		}
	};

	const handleSaveClick = async (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		if (!fileEditorRef.current?.saveFile) return;

		try {
			const result = fileEditorRef.current.saveFile();
			if (result instanceof Promise) {
				await result;
			}

			setIsModified(false);
			onSave?.(path);
		} catch {
			showNotification("Failed to save file", "error");
		}
	};

	return (
		<Panel
			actions={
				<>
					<button
						type="button"
						className="inline-flex items-center justify-center rounded p-1 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
						title={`Copy path - ${path}`}
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							copyPath();
						}}
					>
						<Copy className="h-4 w-4" />
					</button>
					<button
						type="button"
						className="inline-flex items-center justify-center rounded p-1 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
						title={`Refresh File - ${path}`}
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							if (isModified) {
								setSaveBeforeRefresh(true);
							} else {
								setRefreshContent((prev) => prev + 1);
							}
						}}
					>
						<RefreshCw className="h-4 w-4" />
					</button>
					<div className="flex-1">&nbsp;</div>
					<button
						type="button"
						className="inline-flex items-center justify-center rounded p-1 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
						title="Save"
						disabled={!isModified}
						onClick={handleSaveClick}
					>
						<Save className="h-4 w-4" />
					</button>
				</>
			}
		>
			<FileEditor
				ref={fileEditorRef}
				type={"engine"}
				space={engineId}
				insightId={insightId}
				path={path}
				refreshContent={refreshContent}
				onChange={(_content, isModifiedFlag) => {
					onFileEditorChange(isModifiedFlag);
				}}
			/>
			{/* Modal Dialog */}
			{saveBeforeRefresh && (
				<div className="fixed inset-0 z-50 flex items-center justify-center">
					{/* Backdrop */}
					<button
						type="button"
						className="absolute inset-0 bg-black/50"
						onClick={() => setSaveBeforeRefresh(false)}
					/>
					{/* Modal Content */}
					<div className="relative mx-4 w-full max-w-lg rounded-lg bg-white shadow-xl">
						<div className="border-gray-200 border-b px-6 py-4">
							<h2 className="font-semibold text-gray-900 text-lg">
								File Content Modified
							</h2>
						</div>
						<div className="px-6 py-4">
							<p className="text-gray-700 text-sm">
								File content is modified. Do you want to reload
								the file?
							</p>
						</div>
						<div className="flex justify-end gap-2 px-6 py-4">
							<button
								type="button"
								className="rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 text-sm transition-colors hover:bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
								onClick={() => {
									setSaveBeforeRefresh(false);
								}}
							>
								No
							</button>
							<button
								type="button"
								className="rounded-md bg-blue-600 px-4 py-2 font-medium text-sm text-white transition-colors hover:bg-blue-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
								onClick={() => {
									setRefreshContent((prev) => prev + 1);
									setSaveBeforeRefresh(false);
									setIsModified(false);
									onSave?.(path);
								}}
							>
								Yes
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Notification Toast */}
			{notification.show && (
				<div className="fixed right-4 bottom-4 z-50 flex max-w-sm animate-slide-in-right items-center gap-2 rounded-md px-4 py-3 shadow-lg">
					<div
						className={`flex items-center gap-3 ${
							notification.type === "success"
								? "border border-green-200 bg-green-50 text-green-800"
								: "border border-red-200 bg-red-50 text-red-800"
						} w-full rounded-md px-4 py-3`}
					>
						<span className="flex-1 font-medium text-sm">
							{notification.message}
						</span>
						<button
							type="button"
							className="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md transition-colors hover:bg-black/5"
							onClick={() =>
								setNotification({
									...notification,
									show: false,
								})
							}
						>
							<X className="h-4 w-4" />
						</button>
					</div>
				</div>
			)}
		</Panel>
	);
});
