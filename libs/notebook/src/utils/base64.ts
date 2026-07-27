const BASE64_CHARS =
	"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

// Encodes raw bytes to base64 in both browser (btoa) and Node/test runners
// (no global btoa) so IPython-style rich-repr bytes can be embedded as
// nbformat-compatible base64 strings regardless of runtime. Encodes manually
// instead of depending on Buffer/@types/node so this stays browser-safe.
export const uint8ArrayToBase64 = (bytes: Uint8Array): string => {
	if (typeof btoa === "function") {
		let binary = "";
		for (let i = 0; i < bytes.length; i += 1) {
			binary += String.fromCharCode(bytes[i]);
		}
		return btoa(binary);
	}

	let result = "";
	for (let i = 0; i < bytes.length; i += 3) {
		const b0 = bytes[i];
		const b1 = bytes[i + 1];
		const b2 = bytes[i + 2];
		const triple = (b0 << 16) | ((b1 ?? 0) << 8) | (b2 ?? 0);
		result += BASE64_CHARS[(triple >> 18) & 0x3f];
		result += BASE64_CHARS[(triple >> 12) & 0x3f];
		result += b1 !== undefined ? BASE64_CHARS[(triple >> 6) & 0x3f] : "=";
		result += b2 !== undefined ? BASE64_CHARS[triple & 0x3f] : "=";
	}
	return result;
};

const BASE64_CHAR_INDEX = new Map(
	Array.from(BASE64_CHARS).map((char, index) => [char, index] as const),
);

// Inverse of uint8ArrayToBase64 - used to recover the real text/JSON value
// of a text-based MIME output captured through the inline display marker
// protocol (only image/* mimetypes keep their base64 form as the final
// value; everything else needs to be decoded back to UTF-8 text).
const base64ToUint8Array = (base64: string): Uint8Array => {
	if (typeof atob === "function") {
		const binary = atob(base64);
		const bytes = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i += 1) {
			bytes[i] = binary.charCodeAt(i);
		}
		return bytes;
	}

	const cleaned = base64.replace(/=+$/, "");
	const bytes: number[] = [];
	for (let i = 0; i < cleaned.length; i += 4) {
		const chars = Array.from(cleaned.slice(i, i + 4));
		const values = chars.map((char) => BASE64_CHAR_INDEX.get(char) ?? 0);
		const combined =
			(values[0] << 18) |
			((values[1] ?? 0) << 12) |
			((values[2] ?? 0) << 6) |
			(values[3] ?? 0);
		bytes.push((combined >> 16) & 0xff);
		if (chars.length > 2) bytes.push((combined >> 8) & 0xff);
		if (chars.length > 3) bytes.push(combined & 0xff);
	}
	return Uint8Array.from(bytes);
};

export const base64ToText = (base64: string): string => {
	try {
		return new TextDecoder().decode(base64ToUint8Array(base64));
	} catch {
		return "";
	}
};
