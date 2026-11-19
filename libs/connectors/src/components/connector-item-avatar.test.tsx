import { UsersIcon } from "lucide-react";
import { act, type ComponentProps } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ConnectorItemAvatar } from "./connector-item-avatar";

let root: Root;
let container: HTMLDivElement;
const render = async (props: ComponentProps<typeof ConnectorItemAvatar>) => {
	await act(async () => root.render(<ConnectorItemAvatar {...props} />));
};
const photo = () => container.querySelector("img");

beforeEach(() => {
	vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
	container = document.createElement("div");
	document.body.append(container);
	root = createRoot(container);
});
afterEach(async () => {
	await act(async () => root.unmount());
	container.remove();
	vi.unstubAllGlobals();
});

it("shows who the item is from by their initials, or a mark for what is not one person's", async () => {
	await render({ name: "Ava Reed" });
	expect(container.textContent).toBe("AR");
	expect(photo()).toBeNull();

	await render({ name: "Northwind engineering sync", icon: UsersIcon });
	expect(container.textContent).toBe("");
	expect(container.querySelector("svg")).not.toBeNull();
});

it("draws the person's picture over their initials, without asking for it until it is near the screen", async () => {
	await render({ name: "Ava Reed", photoUrl: "/photo?email=ava" });
	expect(photo()?.getAttribute("src")).toBe("/photo?email=ava");
	expect(photo()?.getAttribute("loading")).toBe("lazy");
	// decorative, as the initials are: the row names the person
	expect(photo()?.getAttribute("alt")).toBe("");
	// the initials stay under it, for the time it takes to load
	expect(container.textContent).toBe("AR");
});

it("keeps the initials when the picture cannot be read, and still tries another person's", async () => {
	await render({ name: "Ava Reed", photoUrl: "/photo?email=ava" });
	await act(async () => photo()?.dispatchEvent(new Event("error")));
	expect(photo()).toBeNull();
	expect(container.textContent).toBe("AR");

	await render({ name: "Ben Carter", photoUrl: "/photo?email=ben" });
	expect(photo()?.getAttribute("src")).toBe("/photo?email=ben");
});
