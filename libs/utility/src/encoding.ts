/** Encode bytes in chunks so large files do not exceed argument limits. */
export const encodeBase64 = (bytes: Uint8Array): string => {
	const chunkSize = 0x8000;
	let binary = "";
	for (let i = 0; i < bytes.length; i += chunkSize) {
		binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
	}
	return btoa(binary);
};

/** Encode text as UTF-8 before converting it to Base64. */
export const encodeBase64Text = (value: string): string =>
	encodeBase64(new TextEncoder().encode(value));

/** Decode Base64 bytes, preserving atob's rejection of malformed input. */
export const decodeBase64 = (value: string): Uint8Array<ArrayBuffer> => {
	const binary = atob(value);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
};
