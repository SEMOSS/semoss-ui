import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import type { ToolViewLibraries } from "./tool-view.types";
import { ToolViewProvider } from "./tool-view-provider";
import { useToolView } from "./use-tool-view";

const MailList = () => null;
const LIBRARIES: ToolViewLibraries = {
	arbitraryGroup: { "mail-list": MailList },
};

const resolve = (uri: string | undefined, libraries = LIBRARIES) =>
	renderHook(() => useToolView(uri), {
		wrapper: ({ children }: { children: ReactNode }) => (
			<ToolViewProvider libraries={libraries}>
				{children}
			</ToolViewProvider>
		),
	}).result.current;

describe("useToolView", () => {
	it("finds the view a URI names, with its parameters", () => {
		expect(resolve("component://mail-list?provider=google")).toEqual({
			component: MailList,
			params: { provider: "google" },
		});
	});

	it("finds nothing the host does not render", () => {
		expect(resolve("component://mail-compose")).toBeNull();
		expect(resolve("component://calendar-agenda")).toBeNull();
		expect(resolve("component://constructor")).toBeNull();
		expect(resolve("component://toString")).toBeNull();
		expect(resolve("system://automation/")).toBeNull();
	});

	it("rejects legacy paths and ambiguous registrations", () => {
		expect(resolve("component://mail/list")).toBeNull();
		expect(
			resolve("component://mail-list", {
				one: { "mail-list": MailList },
				two: { "mail-list": MailList },
			}),
		).toBeNull();
	});
	it("finds nothing without a provider", () => {
		expect(
			renderHook(() => useToolView("component://mail-list")).result
				.current,
		).toBeNull();
	});
});
