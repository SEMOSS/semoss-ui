import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { uploadInsight } from "@semoss/sdk";
import { useInsight } from "@semoss/sdk/react";
import { runPixel } from "../../utility/pixel";
import { useTerminal } from "./terminal-context";

export const UploadModal = () => {
	const terminal = useTerminal();
	const { actions, insightId } = useInsight();
	const { t } = useTranslation("dialog");
	const inputRef = useRef<HTMLInputElement | null>(null);
	const [dragging, setDragging] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	// Seed the locale-aware default comment when the dialog first opens.
	useEffect(() => {
		if (terminal.upload.open && !terminal.upload.comment) {
			terminal.setUpload({
				comment: t("upload.comment", {
					timestamp: new Date().toLocaleString(),
				}),
			});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [terminal.upload.open]);

	if (!terminal.upload.open) return null;

	const onFiles = (list: FileList | null) => {
		if (!list) return;
		const files = Array.from(list);
		terminal.setUpload({
			files: [...terminal.upload.files, ...files],
		});
	};

	const removeFile = (idx: number) => {
		const files = terminal.upload.files.slice();
		files.splice(idx, 1);
		terminal.setUpload({ files });
	};

	const submit = async () => {
		if (terminal.upload.files.length === 0) {
			terminal.alert("warn", t("upload.errors.filesRequired"));
			return;
		}
		if (!terminal.upload.comment) {
			terminal.alert("warn", t("upload.errors.commentRequired"));
			return;
		}
		setSubmitting(true);
		try {
			let path = terminal.getBrowserPath();
			const space = terminal.getBrowserSpace();
			if (path.length > 0) path += "/";

			const uploaded = await uploadInsight(
				insightId || null,
				path,
				terminal.upload.files,
			);

			for (const file of uploaded.data ?? []) {
				await runPixel(
					actions,
					`CommitAsset(filePath=["${path}${file.fileName}"], comment=["${terminal.upload.comment}"], space=[${space ? `"${space}"` : ""}])`,
				);
			}

			terminal.closeUpload();
			terminal.requestBrowserRender();
		} catch (err) {
			terminal.alert(
				"error",
				err instanceof Error ? err.message : t("upload.errors.unknown"),
			);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div
			className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30"
			role="dialog"
		>
			<div className="w-full min-w-[420px] max-w-[600px] rounded-md bg-background text-foreground shadow-2xl">
				<div className="border-border border-b px-5 py-4 font-semibold text-lg">
					{t("upload.title")}
				</div>
				<div className="flex flex-col gap-3 px-5 py-4">
					<section
						aria-label={t("upload.fields.selectFile")}
						className={`flex flex-col gap-2 rounded border-2 border-dashed p-4 ${
							dragging ? "border-primary" : "border-border"
						}`}
						onDragOver={(e) => {
							e.preventDefault();
							setDragging(true);
						}}
						onDragLeave={() => setDragging(false)}
						onDrop={(e) => {
							e.preventDefault();
							setDragging(false);
							onFiles(e.dataTransfer.files);
						}}
					>
						<span className="text-sm">
							{t("upload.fields.selectFile")}
						</span>
						{terminal.upload.files.length === 0 ? (
							<div className="flex flex-col items-center gap-2 text-muted-foreground">
								<div>{t("upload.dropzone.drag")}</div>
								<button
									type="button"
									className="rounded border border-primary px-3 py-1 text-primary text-sm hover:bg-primary/10"
									onClick={() => inputRef.current?.click()}
								>
									{t("upload.dropzone.or")}
								</button>
								<input
									ref={inputRef}
									type="file"
									className="hidden"
									multiple
									onChange={(e) => onFiles(e.target.files)}
								/>
							</div>
						) : (
							terminal.upload.files.map((file, idx) => (
								<div
									key={`${file.name}-${idx}`}
									className="flex items-center justify-between gap-2 rounded bg-muted px-2 py-1.5"
								>
									<span
										className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap"
										title={file.name}
									>
										{file.name}
									</span>
									<button
										type="button"
										className="rounded border border-primary px-2 py-0.5 text-primary text-xs hover:bg-primary/10"
										onClick={() => removeFile(idx)}
									>
										{t("upload.buttons.remove")}
									</button>
								</div>
							))
						)}
					</section>

					<label className="flex flex-col gap-1 text-sm">
						<span>{t("upload.fields.comment")}</span>
						<input
							type="text"
							value={terminal.upload.comment}
							onChange={(e) =>
								terminal.setUpload({ comment: e.target.value })
							}
							className="rounded border border-border bg-background px-2 py-1.5 text-foreground text-sm"
						/>
					</label>
				</div>
				<div className="flex justify-end gap-2 border-border border-t px-5 py-3">
					<button
						type="button"
						className="rounded px-3 py-1 text-primary hover:bg-primary/10 disabled:opacity-40"
						onClick={terminal.closeUpload}
						disabled={submitting}
					>
						{t("upload.buttons.cancel")}
					</button>
					<button
						type="button"
						className="rounded bg-primary px-3 py-1 text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
						onClick={submit}
						disabled={submitting}
					>
						{t("upload.buttons.upload")}
					</button>
				</div>
			</div>
		</div>
	);
};
