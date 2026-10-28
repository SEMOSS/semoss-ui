import {
	createWorkbook,
	type XlsxEditorElement,
} from "@christophervr/xlsx-react-viewer";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useXlsxFileAccess } from "./use-xlsx-file-access";

const setup = (attributes: string, readOnly = false) => {
	const workbook = {
		...createWorkbook(),
		source: {
			parts: new Map([
				[
					"xl/workbook.xml",
					new TextEncoder().encode(
						`<workbook><fileSharing ${attributes}/></workbook>`,
					),
				],
			]),
		},
	};
	const element = Object.assign(document.createElement("div"), {
		readOnly: false,
		workbook,
	}) as unknown as XlsxEditorElement;
	const hook = renderHook((props) => useXlsxFileAccess(props), {
		initialProps: { element, sourceKey: "source:1", readOnly },
	});
	const load = () =>
		act(() => {
			element.dispatchEvent(new Event("workbook-change"));
		});
	load();
	return { ...hook, element, workbook, load };
};

describe("XLSX document access sessions", () => {
	it("recovers from invalid protection metadata when a new source is loaded", () => {
		const { result, element, workbook, rerender, load } = setup(
			'readOnlyRecommended="1"',
		);
		workbook.source.parts.set(
			"xl/workbook.xml",
			new TextEncoder().encode("<invalid>"),
		);
		rerender({ element, sourceKey: "invalid", readOnly: false });
		load();
		expect(result.current.error).toBeTruthy();
		expect(result.current.readOnly).toBe(true);
		workbook.source.parts.set(
			"xl/workbook.xml",
			new TextEncoder().encode("<workbook/>"),
		);
		rerender({ element, sourceKey: "recovered", readOnly: false });
		load();
		expect(result.current.error).toBeNull();
		expect(result.current.readOnly).toBe(false);
	});
	it("requires acknowledgement for a recommendation, retains it across edits, and resets on refresh", () => {
		const { result, element, workbook, rerender, load } = setup(
			'readOnlyRecommended="1"',
		);
		expect(result.current.readOnly).toBe(true);
		act(() => result.current.enableEditing());
		expect(result.current.readOnly).toBe(false);
		// Immutable model updates from the same package are edits, not a new file.
		element.workbook = { ...workbook };
		load();
		expect(result.current.readOnly).toBe(false);
		rerender({ element, sourceKey: "source:2", readOnly: false });
		expect(result.current.readOnly).toBe(true);
		load();
		expect(result.current.access?.kind).toBe("recommended");
	});
	it("does not let a native Editing switch bypass the author preference", () => {
		const { result, element } = setup('readOnlyRecommended="1"');
		expect(result.current.readOnly).toBe(true);
		act(() => {
			element.readOnly = false;
			element.dispatchEvent(new Event("readonly-change"));
		});
		expect(element.readOnly).toBe(true);
	});
	it("rejects wrong passwords and only unlocks the current document", async () => {
		const { result, element, rerender, load } = setup(
			'reservationPassword="83AF"',
		);
		await act(async () => {
			expect(await result.current.unlock("incorrect")).toBe(false);
		});
		expect(result.current.readOnly).toBe(true);
		await act(async () => {
			expect(await result.current.unlock("password")).toBe(true);
		});
		expect(result.current.readOnly).toBe(false);
		rerender({ element, sourceKey: "source:2", readOnly: false });
		load();
		expect(result.current.readOnly).toBe(true);
	});
	it("never lets acknowledgement or a document password override SEMOSS read-only access", async () => {
		const { result } = setup('reservationPassword="83AF"', true);
		act(() => result.current.enableEditing());
		await act(async () => {
			expect(await result.current.unlock("password")).toBe(false);
		});
		expect(result.current.readOnly).toBe(true);
	});
	it("makes unsupported password protection an explicit recommendation fallback", () => {
		const { result } = setup('algorithmName="unsupported"');
		expect(result.current.access?.kind).toBe("unsupported-password");
		expect(result.current.readOnly).toBe(true);
		act(() => result.current.enableEditing());
		expect(result.current.readOnly).toBe(false);
	});
	it("revokes an unlocked session when resource permission changes", async () => {
		const { result, element, rerender } = setup(
			'reservationPassword="83AF"',
		);
		await act(async () => {
			await result.current.unlock("password");
		});
		rerender({ element, sourceKey: "source:1", readOnly: true });
		expect(result.current.readOnly).toBe(true);
		expect(element.readOnly).toBe(true);
	});
});
