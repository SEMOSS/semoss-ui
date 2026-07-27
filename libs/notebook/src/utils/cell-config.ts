export type NotebookCellConfig = {
	cellType: "code" | "markdown";
	language: string;
	kernelDisplayName: string;
	kernelLanguage: string;
	kernelName: string;
	languageInfoName: string;
	languageInfoMimetype: string;
	languageInfoFileExtension: string;
};

/**
 * Maps a code-fence/cell language token to the nbformat kernelspec/
 * language_info metadata a notebook needs, and to the cell_type it should
 * become (markdown code fences become markdown cells; everything else is a
 * code cell).
 */
export const getNotebookCellConfig = (lang: string): NotebookCellConfig => {
	const normalized = (lang || "").toLowerCase();

	if (normalized === "md" || normalized === "markdown") {
		return {
			cellType: "markdown",
			language: "markdown",
			kernelDisplayName: "Python 3",
			kernelLanguage: "python",
			kernelName: "python3",
			languageInfoName: "python",
			languageInfoMimetype: "text/x-python",
			languageInfoFileExtension: ".py",
		};
	}

	if (normalized === "r") {
		return {
			cellType: "code",
			language: "r",
			kernelDisplayName: "R",
			kernelLanguage: "R",
			kernelName: "ir",
			languageInfoName: "r",
			languageInfoMimetype: "text/x-rsrc",
			languageInfoFileExtension: ".r",
		};
	}

	if (normalized === "pixel") {
		// Pixel isn't a real Jupyter kernel, but it must stay distinguishable
		// from python: buildExecutePixel/buildNotebookExecutionSource key off
		// this exact language string when a saved pixel cell is later re-run
		// from the notebook viewer, so falling through to the python default
		// below would silently try to execute raw Pixel syntax as Python.
		return {
			cellType: "code",
			language: "pixel",
			kernelDisplayName: "Pixel",
			kernelLanguage: "pixel",
			kernelName: "pixel",
			languageInfoName: "pixel",
			languageInfoMimetype: "text/x-pixel",
			languageInfoFileExtension: ".pixel",
		};
	}

	return {
		cellType: "code",
		language: "python",
		kernelDisplayName: "Python 3",
		kernelLanguage: "python",
		kernelName: "python3",
		languageInfoName: "python",
		languageInfoMimetype: "text/x-python",
		languageInfoFileExtension: ".py",
	};
};
