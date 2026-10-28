import {
	createWorkbook,
	loadWorkbook,
	modernPasswordHash,
	saveWorkbook,
	type Workbook,
} from "@christophervr/xlsx-react-viewer";
import { describe, expect, it } from "vitest";
import {
	getXlsxFileAccess,
	verifyXlsxModifyPassword,
} from "./xlsx-file-access";

const workbookWith = (attributes: string): Workbook => ({
	...createWorkbook({ sheets: ["Sheet1"] }),
	source: {
		parts: new Map([
			[
				"xl/workbook.xml",
				new TextEncoder().encode(
					`<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fileSharing ${attributes}/></workbook>`,
				),
			],
		]),
	},
});

describe("XLSX file-level editing preferences", () => {
	it("distinguishes recommendations from actual workbook structure protection", () => {
		expect(
			getXlsxFileAccess(workbookWith('readOnlyRecommended="1"')).kind,
		).toBe("recommended");
		expect(
			getXlsxFileAccess(workbookWith('readOnlyRecommended="true"')).kind,
		).toBe("recommended");
		expect(
			getXlsxFileAccess(workbookWith('readOnlyRecommended="0"')).kind,
		).toBe("editable");
		expect(
			getXlsxFileAccess({ ...createWorkbook(), structureLocked: true })
				.kind,
		).toBe("editable");
	});
	it("checks the legacy Excel modify-password verifier without changing the file", () => {
		const workbook = workbookWith(
			'readOnlyRecommended="1" reservationPassword="83AF"',
		);
		const original = workbook.source?.parts.get("xl/workbook.xml");
		const access = getXlsxFileAccess(workbook);
		expect(access.kind).toBe("password");
		expect(verifyXlsxModifyPassword(access, "incorrect")).toBe(false);
		expect(verifyXlsxModifyPassword(access, "password")).toBe(true);
		expect(workbook.source?.parts.get("xl/workbook.xml")).toBe(original);
	});
	it("verifies supported modern hashes and refuses a wrong password", async () => {
		const saltValue = "AAECAwQFBgcICQoLDA0ODw==";
		const hashValue = await modernPasswordHash(
			"test-password",
			{ saltValue, spinCount: 10 },
			"SHA-512",
		);
		const access = getXlsxFileAccess(
			workbookWith(
				`algorithmName="SHA-512" hashValue="${hashValue}" saltValue="${saltValue}" spinCount="10"`,
			),
		);
		expect(verifyXlsxModifyPassword(access, "incorrect")).toBe(false);
		expect(verifyXlsxModifyPassword(access, "test-password")).toBe(true);
	});
	it.each([
		'reservationPassword="invalid"',
		'algorithmName="unknown" hashValue="hash" saltValue="salt" spinCount="1"',
		'algorithmName="SHA-512" hashValue="hash" saltValue="salt" spinCount="1000001"',
		'algorithmName="SHA-512" hashValue="hash"',
	])(
		"reports unsupported protection separately from successful verification: %s",
		(attributes) => {
			const access = getXlsxFileAccess(workbookWith(attributes));
			expect(access.kind).toBe("unsupported-password");
			expect(verifyXlsxModifyPassword(access, "anything")).toBe(false);
		},
	);
	it("follows a nondefault office-document relationship", () => {
		const workbook = workbookWith('readOnlyRecommended="1"');
		const parts = workbook.source?.parts;
		const main = parts?.get("xl/workbook.xml");
		if (!parts || !main) throw new Error("Missing fixture parts");
		parts.delete("xl/workbook.xml");
		parts.set("custom/book.xml", main);
		parts.set(
			"_rels/.rels",
			new TextEncoder().encode(
				'<Relationships><Relationship Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="/custom/book.xml"/></Relationships>',
			),
		);
		expect(getXlsxFileAccess(workbook).kind).toBe("recommended");
	});
	it("preserves recommendation and modify-password metadata through the real serializer", async () => {
		const workbook = await loadWorkbook(
			await saveWorkbook(createWorkbook({ sheets: ["Sheet1"] }), "xlsx"),
		);
		const parts = workbook.source?.parts;
		const main = parts?.get("xl/workbook.xml");
		if (!parts || !main) throw new Error("Missing real XLSX parts");
		const xml = new TextDecoder()
			.decode(main)
			.replace(
				"<sheets",
				'<fileSharing readOnlyRecommended="1" reservationPassword="83AF"/><sheets',
			);
		parts.set("xl/workbook.xml", new TextEncoder().encode(xml));
		const reopened = await loadWorkbook(
			await saveWorkbook(workbook, "xlsx"),
		);
		const access = getXlsxFileAccess(reopened);
		expect(access.kind).toBe("password");
		expect(verifyXlsxModifyPassword(access, "password")).toBe(true);
		expect(
			new TextDecoder().decode(
				reopened.source?.parts.get("xl/workbook.xml"),
			),
		).toContain('readOnlyRecommended="1"');
	});
});
