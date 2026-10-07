import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { FileDragProvider, useFileDrag } from "./file-drag-context";

/** Exposes the context's state/actions as plain DOM so tests can assert on them. */
function FileDragProbe() {
	const { files, addFiles, openFilePicker } = useFileDrag();
	return (
		<div>
			<output data-testid="file-names">
				{files.map((file) => file.name).join(",")}
			</output>
			<button
				type="button"
				onClick={() => addFiles([new File(["x"], "pasted.pdf")])}
			>
				paste pdf
			</button>
			<button
				type="button"
				onClick={() => addFiles([new File(["x"], "pasted.exe")])}
			>
				paste exe
			</button>
			<button type="button" onClick={openFilePicker}>
				open picker
			</button>
		</div>
	);
}

const dropFile = (container: HTMLElement, file: File) => {
	const dropzone = container.querySelector('[role="none"]') as HTMLElement;
	fireEvent.drop(dropzone, {
		dataTransfer: { types: ["Files"], files: [file] },
	});
};

const pickFile = (container: HTMLElement, file: File) => {
	const input = container.querySelector(
		'input[type="file"]',
	) as HTMLInputElement;
	Object.defineProperty(input, "files", { value: [file], writable: true });
	fireEvent.change(input);
};

test("without a validator, every file is accepted", () => {
	const { container } = render(
		<FileDragProvider>
			<FileDragProbe />
		</FileDragProvider>,
	);

	dropFile(container, new File(["x"], "anything.exe"));

	expect(screen.getByTestId("file-names").textContent).toBe("anything.exe");
});

test("a dropped file the validator rejects never enters the file list, and onFilesRejected fires with its name", () => {
	const onFilesRejected = vi.fn();
	const { container } = render(
		<FileDragProvider
			isFileAccepted={(name) => name.endsWith(".pdf")}
			onFilesRejected={onFilesRejected}
		>
			<FileDragProbe />
		</FileDragProvider>,
	);

	dropFile(container, new File(["x"], "report.pdf"));
	dropFile(container, new File(["x"], "installer.exe"));

	expect(screen.getByTestId("file-names").textContent).toBe("report.pdf");
	expect(onFilesRejected).toHaveBeenCalledWith(["installer.exe"]);
	expect(onFilesRejected).toHaveBeenCalledTimes(1);
});

test("a file picked via the hidden input is validated the same way as a drop", () => {
	const onFilesRejected = vi.fn();
	const { container } = render(
		<FileDragProvider
			isFileAccepted={(name) => name.endsWith(".pdf")}
			onFilesRejected={onFilesRejected}
		>
			<FileDragProbe />
		</FileDragProvider>,
	);

	pickFile(container, new File(["x"], "installer.exe"));

	expect(screen.getByTestId("file-names").textContent).toBe("");
	expect(onFilesRejected).toHaveBeenCalledWith(["installer.exe"]);
});

test("files added programmatically (the paste path) are validated the same way", () => {
	const onFilesRejected = vi.fn();
	render(
		<FileDragProvider
			isFileAccepted={(name) => name.endsWith(".pdf")}
			onFilesRejected={onFilesRejected}
		>
			<FileDragProbe />
		</FileDragProvider>,
	);

	fireEvent.click(screen.getByText("paste pdf"));
	fireEvent.click(screen.getByText("paste exe"));

	expect(screen.getByTestId("file-names").textContent).toBe("pasted.pdf");
	expect(onFilesRejected).toHaveBeenCalledWith(["pasted.exe"]);
});

test("a batch with both accepted and rejected files keeps only the accepted ones and reports all rejected names together", () => {
	const onFilesRejected = vi.fn();
	const { container } = render(
		<FileDragProvider
			isFileAccepted={(name) => name.endsWith(".pdf")}
			onFilesRejected={onFilesRejected}
		>
			<FileDragProbe />
		</FileDragProvider>,
	);

	const dropzone = container.querySelector('[role="none"]') as HTMLElement;
	fireEvent.drop(dropzone, {
		dataTransfer: {
			types: ["Files"],
			files: [
				new File(["x"], "report.pdf"),
				new File(["x"], "installer.exe"),
				new File(["x"], "script.sh"),
			],
		},
	});

	expect(screen.getByTestId("file-names").textContent).toBe("report.pdf");
	expect(onFilesRejected).toHaveBeenCalledWith([
		"installer.exe",
		"script.sh",
	]);
});
