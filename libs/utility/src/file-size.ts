const BYTES_PER_KILOBYTE = 1024;
const BYTES_PER_MEGABYTE = BYTES_PER_KILOBYTE ** 2;
const BYTES_PER_GIGABYTE = BYTES_PER_KILOBYTE ** 3;

/** Format a byte count for compact display. */
export const formatByteSize = (bytes: number): string => {
	if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
	if (bytes < BYTES_PER_KILOBYTE) return `${Math.round(bytes)} B`;
	if (bytes < BYTES_PER_MEGABYTE) {
		return `${(bytes / BYTES_PER_KILOBYTE).toFixed(1)} KB`;
	}
	if (bytes < BYTES_PER_GIGABYTE) {
		return `${(bytes / BYTES_PER_MEGABYTE).toFixed(1)} MB`;
	}
	return `${(bytes / BYTES_PER_GIGABYTE).toFixed(1)} GB`;
};
