/** Extract a lowercase extension from a file name or path. */
export const getFileExtension = (value: string | undefined): string => {
	if (!value) return "";

	const fileName = value.split(/[?#]/, 1)[0].split(/[\\/]/).pop() ?? "";
	const dotIndex = fileName.lastIndexOf(".");
	if (dotIndex <= 0 || dotIndex === fileName.length - 1) return "";

	return fileName.slice(dotIndex + 1).toLowerCase();
};
