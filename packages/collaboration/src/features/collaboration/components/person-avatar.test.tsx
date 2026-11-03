import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PersonAvatar } from "./person-avatar";

describe("PersonAvatar", () => {
	afterEach(cleanup);

	it("covers the initials with the person's Microsoft photo", () => {
		const { container } = render(
			<PersonAvatar name="Ana Ruiz" email="ana+work@test.com" />,
		);
		const photo = container.querySelector("img");
		expect(photo?.getAttribute("src")).toMatch(
			/\/msgraph\/photo\?email=ana%2Bwork%40test\.com$/,
		);
		expect(photo?.getAttribute("alt")).toBe("");
		expect(photo?.getAttribute("loading")).toBe("lazy");
		expect(container.textContent).toBe("AR");
	});

	it("keeps the initials when there is no photo to show", () => {
		const { container } = render(
			<PersonAvatar name="Ana Ruiz" email="ana@test.com" />,
		);
		const photo = container.querySelector("img");
		if (!photo) throw new Error("Expected the avatar to ask for a photo");
		fireEvent.error(photo);
		expect(container.querySelector("img")).toBeNull();
		expect(container.textContent).toBe("AR");
	});

	it("asks for no photo without an address", () => {
		const { container } = render(
			<PersonAvatar name="Ana Ruiz" email={null} />,
		);
		expect(container.querySelector("img")).toBeNull();
		expect(container.textContent).toBe("AR");
	});
});
