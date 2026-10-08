import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { collaborationDevServer } from "./dev-server";

vi.mock("node:fs", async (importOriginal) => {
	const actual = await importOriginal<typeof import("node:fs")>();
	const readFileSync = vi.fn();
	return { ...actual, readFileSync, default: { ...actual, readFileSync } };
});

afterEach(() => {
	vi.clearAllMocks();
});

describe("collaboration HTTPS development", () => {
	it("preserves ordinary HTTP development without reading a certificate", () => {
		const server = { port: 5180, strictPort: true };
		expect(collaborationDevServer({}, server)).toBe(server);
		expect(readFileSync).not.toHaveBeenCalled();
	});

	it("shares the configured origin while retaining the existing backend proxy", () => {
		const certificate = Buffer.from("local certificate");
		vi.mocked(readFileSync).mockReturnValue(certificate);
		const proxy = {
			"/Monolith": { target: "https://127.0.0.1:8443", ws: true },
		};
		const server = collaborationDevServer(
			{
				SEMOSS_DEV_ORIGIN: "https://semoss.local:5181",
				SEMOSS_DEV_PFX: "/tmp/semoss-test.p12",
				SEMOSS_DEV_PASSPHRASE: "test passphrase",
			},
			{ port: 5180, proxy },
		);
		expect(server).toMatchObject({
			host: "127.0.0.1",
			port: 5181,
			strictPort: true,
			origin: "https://semoss.local:5181",
			allowedHosts: ["semoss.local"],
			https: { pfx: certificate, passphrase: "test passphrase" },
			hmr: { protocol: "wss", host: "semoss.local", clientPort: 5181 },
		});
		expect(server.proxy).toBe(proxy);
		expect(readFileSync).toHaveBeenCalledWith("/tmp/semoss-test.p12");
	});

	it("uses the standard HTTPS port when the origin omits a port", () => {
		vi.mocked(readFileSync).mockReturnValue(
			Buffer.from("local certificate"),
		);
		expect(
			collaborationDevServer({
				SEMOSS_DEV_ORIGIN: "https://semoss.local",
				SEMOSS_DEV_PFX: "/tmp/semoss-test.p12",
			}).port,
		).toBe(443);
	});

	it.each([
		"http://semoss.local:5181",
		"https://semoss.local:5181/collaboration",
		"https://user:password@semoss.local:5181",
		"https://semoss.local:5181?setting=true",
		"https://semoss.local:5181#work",
	])("rejects an invalid development origin: %s", (origin) => {
		expect(() =>
			collaborationDevServer({ SEMOSS_DEV_ORIGIN: origin }),
		).toThrow("SEMOSS_DEV_ORIGIN must be an HTTPS origin without a path.");
		expect(readFileSync).not.toHaveBeenCalled();
	});

	it.each([undefined, "./certificate.p12"])(
		"requires an absolute certificate path: %s",
		(pfxPath) => {
			expect(() =>
				collaborationDevServer({
					SEMOSS_DEV_ORIGIN: "https://semoss.local:5181",
					SEMOSS_DEV_PFX: pfxPath,
				}),
			).toThrow("SEMOSS_DEV_PFX must be an absolute path");
			expect(readFileSync).not.toHaveBeenCalled();
		},
	);
});
