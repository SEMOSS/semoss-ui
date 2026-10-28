import {
	type SheetProtection,
	verifySheetPassword,
	type Workbook,
} from "@christophervr/xlsx-react-viewer";
import { decodeBase64ToBytes } from "@semoss/utility/encoding";

/** File-level author preferences; independent of worksheet and SEMOSS permissions. */
export interface XlsxFileAccess {
	kind: "editable" | "recommended" | "password" | "unsupported-password";
	verifier?: SheetProtection;
}

/** Read the original package without modifying the metadata retained by the serializer. */
export const getXlsxFileAccess = (workbook: Workbook): XlsxFileAccess => {
	const parts = workbook.source?.parts;
	if (!parts) return { kind: "editable" };
	const parse = (bytes: Uint8Array): Document => {
		const document = new DOMParser().parseFromString(
			new TextDecoder().decode(bytes),
			"application/xml",
		);
		if (document.getElementsByTagName("parsererror").length) {
			throw new Error("Unable to read workbook protection settings");
		}
		return document;
	};
	let partName = "xl/workbook.xml";
	const relationships = parts.get("_rels/.rels");
	if (relationships) {
		const relationship = Array.from(
			parse(relationships).getElementsByTagNameNS("*", "Relationship"),
		).find((entry) =>
			entry.getAttribute("Type")?.endsWith("/officeDocument"),
		);
		partName =
			relationship?.getAttribute("Target")?.replace(/^\//, "") ??
			partName;
	}
	const bytes = parts.get(partName);
	if (!bytes)
		throw new Error("Unable to locate workbook protection settings");
	const root = parse(bytes).documentElement;
	if (root.localName !== "workbook")
		throw new Error("Invalid workbook protection settings");
	const sharing = Array.from(root.children).find(
		(child) =>
			child.localName === "fileSharing" &&
			child.namespaceURI === root.namespaceURI,
	);
	if (!sharing) return { kind: "editable" };
	const legacy = sharing.getAttribute("reservationPassword");
	const algorithmName = sharing.getAttribute("algorithmName");
	const hashValue = sharing.getAttribute("hashValue");
	const saltValue = sharing.getAttribute("saltValue");
	const iterations = sharing.getAttribute("spinCount");
	const hasModern = [algorithmName, hashValue, saltValue, iterations].some(
		(value) => value !== null,
	);
	if (hasModern) {
		const spinCount = Number(iterations);
		if (
			!algorithmName ||
			!["SHA-1", "SHA-256", "SHA-384", "SHA-512"].includes(
				algorithmName.toUpperCase(),
			) ||
			!hashValue ||
			!saltValue ||
			iterations === null ||
			!Number.isInteger(spinCount) ||
			spinCount < 0 ||
			spinCount > 100000
		) {
			return { kind: "unsupported-password" };
		}
		const digestSizes: Record<string, number> = {
			"SHA-1": 20,
			"SHA-256": 32,
			"SHA-384": 48,
			"SHA-512": 64,
		};
		try {
			if (hashValue.length > 128 || saltValue.length > 256)
				return { kind: "unsupported-password" };
			const hash = decodeBase64ToBytes(hashValue);
			const salt = decodeBase64ToBytes(saltValue);
			if (
				hash.length !== digestSizes[algorithmName.toUpperCase()] ||
				salt.length === 0 ||
				salt.length > 64
			)
				return { kind: "unsupported-password" };
		} catch {
			return { kind: "unsupported-password" };
		}
		return {
			kind: "password",
			verifier: {
				sheet: true,
				modernHash: { algorithmName, hashValue, saltValue, spinCount },
			},
		};
	}
	if (legacy !== null) {
		if (!/^[\da-f]{1,4}$/i.test(legacy))
			return { kind: "unsupported-password" };
		return {
			kind: "password",
			verifier: {
				sheet: true,
				passwordHash: legacy.toUpperCase().padStart(4, "0"),
			},
		};
	}
	return {
		kind: ["1", "true"].includes(
			sharing.getAttribute("readOnlyRecommended") ?? "",
		)
			? "recommended"
			: "editable",
	};
};

/** Verify only supported write-reservation hashes, without changing the original workbook. */
export const verifyXlsxModifyPassword = (
	access: XlsxFileAccess,
	password: string,
): boolean =>
	access.kind === "password" &&
	!!access.verifier &&
	verifySheetPassword(access.verifier, password);
