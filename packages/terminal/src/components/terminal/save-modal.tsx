import { useEffect, useRef, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import type { SelectedFile } from "../../types";
import { runPixel } from "../../utility/pixel";
import { useTerminal } from "./terminal-context";

export const SaveModal = () => {
	const terminal = useTerminal();
	const { actions } = useInsight();
	const [submitting, setSubmitting] = useState(false);
	const nameInputRef = useRef<HTMLInputElement | null>(null);

	useEffect(() => {
		if (terminal.save.open && terminal.save.selected.new) {
			nameInputRef.current?.focus();
		}
	}, [terminal.save.open, terminal.save.selected.new]);

	if (!terminal.save.open) return null;

	const submit = async () => {
		if (!terminal.save.name) {
			terminal.alert("warn", "File needs a name.");
			return;
		}
		if (!terminal.save.comment) {
			terminal.alert(
				"warn",
				"Please include a comment to describe your changes.",
			);
			return;
		}

		const selected = terminal.save.selected as SelectedFile;
		let path = selected.path;
		let space = selected.space;

		if (selected.new) {
			const browserPath = terminal.getBrowserPath();
			path = browserPath
				? `${browserPath}/${terminal.save.name}`
				: terminal.save.name;
			space = terminal.getBrowserSpace();
		}

		setSubmitting(true);
		try {
			const saveResp = await runPixel<string>(
				actions,
				`SaveAsset(fileName=["${path}"], content=["<encode>${selected.updated}</encode>"], space=[${space ? `"${space}"` : ""}])`,
			);
			if (
				!saveResp ||
				saveResp.operationType.some((t) => t.indexOf("ERROR") > -1)
			) {
				terminal.alert("error", "Failed to save asset.");
				return;
			}

			await runPixel(
				actions,
				`CommitAsset(filePath=["${path}"], comment=["${terminal.save.comment}"], space=[${space ? `"${space}"` : ""}])`,
			);

			terminal.updateFile({
				new: false,
				name: terminal.save.name,
				path,
				content: selected.updated,
			});

			terminal.requestBrowserRender();
			terminal.closeSave();
		} catch (err) {
			terminal.alert(
				"error",
				err instanceof Error ? err.message : "Save failed",
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
			<div className="w-full min-w-[420px] max-w-[600px] rounded-md bg-white shadow-2xl">
				<div className="border-zinc-200 border-b px-5 py-4 font-semibold text-lg">
					Save
				</div>
				<div className="flex flex-col gap-3 px-5 py-4">
					<label className="flex flex-col gap-1 text-sm">
						<span>Name:</span>
						<input
							ref={nameInputRef}
							type="text"
							value={terminal.save.name}
							disabled={!terminal.save.selected.new}
							onChange={(e) =>
								terminal.setSave({ name: e.target.value })
							}
							className="rounded border border-zinc-300 px-2 py-1.5 text-sm disabled:bg-zinc-100"
						/>
					</label>
					<label className="flex flex-col gap-1 text-sm">
						<span>Comment:</span>
						<input
							type="text"
							value={terminal.save.comment}
							onChange={(e) =>
								terminal.setSave({ comment: e.target.value })
							}
							className="rounded border border-zinc-300 px-2 py-1.5 text-sm"
						/>
					</label>
				</div>
				<div className="flex justify-end gap-2 border-zinc-200 border-t px-5 py-3">
					<button
						type="button"
						className="rounded px-3 py-1 text-blue-600 hover:bg-blue-50 disabled:opacity-40"
						onClick={terminal.closeSave}
						disabled={submitting}
					>
						Cancel
					</button>
					<button
						type="button"
						className="rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700 disabled:opacity-40"
						onClick={submit}
						disabled={
							submitting ||
							!terminal.save.name ||
							!terminal.save.comment
						}
					>
						Save
					</button>
				</div>
			</div>
		</div>
	);
};
