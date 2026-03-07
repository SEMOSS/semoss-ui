import {
	FileIcon,
	FileImageIcon,
	FileSpreadsheetIcon,
	FileTextIcon,
} from "lucide-react";

/**
 * Converts a snake_case or space-separated string to Title Case
 *
 * @param str - The string to capitalize
 * @returns The capitalized string, or undefined if input is undefined
 */
export const capitalizeWords = (str: string | undefined) => {
	if (!str) return undefined;
	return str
		.toLowerCase() // Normalize to lowercase first
		.split(/[_\s]+/) // Split by underscores or spaces
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" "); // Join with spaces for better readability
};

/**
 * Converts a snake_case or space-separated string to Sentence case
 *
 * @param str - The string to convert
 * @returns The sentence case string, or undefined if input is undefined
 */
export const toSentenceCase = (str: string | undefined) => {
	if (!str) return undefined;
	const normalized = str.replace(/[_\s]+/g, " ").toLowerCase();
	return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

/**
 * Extracts the first and last initials from a name string
 *
 * Splits the name by whitespace and takes the first letter of the first word
 * and the first letter of the last word. Apostrophes and hyphens are treated
 * as part of the word.
 *
 * @param str - The name string to extract initials from
 * @returns The initials in uppercase (1-2 characters), or undefined if input is undefined
 *
 * @example
 * toInitials("John Doe") // "JD"
 * toInitials("Jane Mary Smith") // "JS" (first and last only)
 * toInitials("Bob") // "B" (single name)
 */
export const toInitials = (str: string | undefined) => {
	if (!str) return undefined;
	const words = str.trim().split(/\s+/);
	if (words.length === 1) {
		return words[0].charAt(0).toUpperCase();
	}
	return (
		words[0].charAt(0) + words[words.length - 1].charAt(0)
	).toUpperCase();
};

/**
 * Parses a file size string with optional unit suffix (B, KB, MB, GB) into bytes.
 * Returns 0 if the input cannot be parsed.
 *
 * @param fileSize - A number or string like "1.5 MB", "512 KB", "2048"
 * @returns The size in bytes
 */
export const parseSizeBytes = (fileSize: string | number): number => {
	const s = String(fileSize ?? "");
	const match = s.match(/^([\d.]+)\s*(KB|MB|GB|B)?$/i);
	if (!match) return 0;
	const num = parseFloat(match[1]);
	const unit = (match[2] ?? "B").toUpperCase();
	if (unit === "GB") return num * 1024 * 1024 * 1024;
	if (unit === "MB") return num * 1024 * 1024;
	if (unit === "KB") return num * 1024;
	return num;
};

/**
 * Formats a file size value (with optional unit suffix) into a human-readable string.
 * Input may be a raw byte count or a string like "1.5 MB", "512 KB".
 * Output is in KB (no decimal) or MB (1 decimal).
 *
 * @param fileSize - A number or string representing a file size
 * @returns A formatted string like "512 KB" or "1.5 MB"
 */
export const formatFileSize = (fileSize: string | number): string => {
	const bytes = parseSizeBytes(fileSize);
	if (bytes === 0) return String(fileSize);
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Formats a UTC datetime string (from the API) into a human-readable local time.
 * The API returns timestamps as "YYYY-MM-DD HH:MM:SS" with no timezone suffix,
 * so we append "Z" to treat them as UTC before converting to local time.
 *
 * @param dateStr - UTC datetime string from the API
 * @returns Formatted local datetime string, or the original string if parsing fails
 */
export const formatDateTime = (dateStr: string): string => {
	const d = new Date(`${dateStr.replace(" ", "T")}Z`);
	if (Number.isNaN(d.getTime())) return dateStr;
	return d.toLocaleString(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
	});
};

/**
 * Returns a sized, colored Lucide icon element for a given file name based on its extension.
 *
 * @param fileName - The file name (e.g. "report.pdf", "data.xlsx")
 * @returns A React element representing the file type icon
 */
export const getFileIcon = (fileName: string) => {
	const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
	if (ext === "pdf")
		return <FileTextIcon className="h-4 w-4 shrink-0 text-red-500" />;
	if (ext === "doc" || ext === "docx")
		return <FileTextIcon className="h-4 w-4 shrink-0 text-blue-500" />;
	if (ext === "xls" || ext === "xlsx" || ext === "csv")
		return (
			<FileSpreadsheetIcon className="h-4 w-4 shrink-0 text-green-600" />
		);
	if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext))
		return <FileImageIcon className="h-4 w-4 shrink-0 text-purple-500" />;
	return <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />;
};
