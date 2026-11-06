// Node's fetch types: jsdom's FormData is not the one Node's Response encodes,
// while a real webview's is.
// @vitest-environment node
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import {
	decodeBase64ToBytes,
	encodeTextToBase64,
} from "@semoss/utility/encoding";
import {
	encodeRequestBody,
	installNativeFetchBridge,
	type NativeHttpRequest,
	type NativeHttpResponse,
} from "./fetch-bridge";

const BASE = "https://host.example/Monolith";

let restore: () => void = () => undefined;
const pageFetch = vi.fn(async () => new Response("page"));
const send = vi.fn(
	async (_request: NativeHttpRequest): Promise<NativeHttpResponse> => ({
		status: 200,
		statusText: "OK",
		headers: { "content-type": "application/json" },
		bodyBase64: encodeTextToBase64('{"ok":true}'),
	}),
);

beforeEach(() => {
	globalThis.fetch = pageFetch as unknown as typeof fetch;
	restore = installNativeFetchBridge(BASE, send);
});
afterEach(() => {
	restore();
	vi.clearAllMocks();
});

test("requests to the instance go through the native client", async () => {
	const response = await fetch(`${BASE}/api/config`, {
		headers: { Accept: "application/json" },
	});
	expect(await response.json()).toEqual({ ok: true });
	expect(send).toHaveBeenCalledWith({
		url: `${BASE}/api/config`,
		method: "GET",
		headers: { accept: "application/json" },
		bodyBase64: null,
	});
	expect(pageFetch).not.toHaveBeenCalled();
});

test("requests elsewhere, and other methods, use the page's fetch", async () => {
	await fetch("https://elsewhere.example/api");
	await fetch(`${BASE}-evil/api`);
	await fetch(`${BASE}/api/thing`, { method: "DELETE" });
	expect(pageFetch).toHaveBeenCalledTimes(3);
	expect(send).not.toHaveBeenCalled();
});

test("a form body crosses the bridge as multipart with its boundary", async () => {
	const form = new FormData();
	form.append("file", new Blob(["hello"], { type: "text/plain" }), "a.txt");
	await fetch(`${BASE}/api/uploadFile/baseUpload`, {
		method: "POST",
		body: form,
	});
	const request = send.mock.calls[0][0];
	expect(request.headers["content-type"]).toMatch(
		/^multipart\/form-data; boundary=/,
	);
	const text = new TextDecoder().decode(
		decodeBase64ToBytes(request.bodyBase64 ?? ""),
	);
	expect(text).toContain('filename="a.txt"');
	expect(text).toContain("hello");
});

test("a binary response keeps its bytes", async () => {
	send.mockResolvedValueOnce({
		status: 200,
		statusText: "OK",
		headers: { "content-type": "application/octet-stream" },
		bodyBase64: "AAEC/w==",
	});
	const response = await fetch(`${BASE}/api/engine/downloadFile?x=1`);
	expect(new Uint8Array(await response.arrayBuffer())).toEqual(
		new Uint8Array([0, 1, 2, 255]),
	);
});

test("a body-less status makes a response without a body", async () => {
	send.mockResolvedValueOnce({
		status: 204,
		statusText: "No Content",
		headers: {},
		bodyBase64: "",
	});
	const response = await fetch(`${BASE}/api/nothing`, { method: "POST" });
	expect(response.status).toBe(204);
});

test("a string body keeps the caller's content type", async () => {
	const encoded = await encodeRequestBody("expression=1");
	expect(encoded.contentType).toBe("text/plain;charset=UTF-8");
	await fetch(`${BASE}/api/engine/runPixel`, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: "expression=1",
	});
	expect(send.mock.calls[0][0].headers["content-type"]).toBe(
		"application/x-www-form-urlencoded",
	);
});
