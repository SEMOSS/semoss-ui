import { fireEvent, render, screen } from "@testing-library/react";
import type { ImportedSource } from "../types";
import { SourcePreview } from "./source-preview";

vi.mock("@semoss/sdk/react", () => ({
	useInsight: () => ({ actions: {}, insightId: "preview" }),
}));

const source: ImportedSource = {
	sourceKind: "outlook",
	nativeId: "message",
	title: "Project update",
	body: "Plain fallback",
	messages: [
		{
			id: "message",
			text: "Plain fallback",
			senderName: "Alex Chen",
			senderAddress: "alex@example.com",
			displayBody: {
				contentType: "html",
				content: "<p><strong>Formatted update</strong></p>",
				attachments: [{ name: "brief.pdf" }],
			},
		},
	],
	participants: [
		{ role: "to", address: "reader@example.com" },
		{ role: "cc", address: "team@example.com" },
	],
	attachments: [{ id: "file", name: "brief.pdf", isFile: true, size: 2048 }],
};

it("renders existing formatted source content with one native attachment list", () => {
	const onImport = vi.fn();
	render(
		<SourcePreview source={source} isLoading={false} onImport={onImport} />,
	);
	expect(
		screen.getByTitle("Project update").getAttribute("srcdoc"),
	).toContain("<strong>Formatted update</strong>");
	expect(screen.getAllByText("brief.pdf")).toHaveLength(1);
	expect(
		screen.getByRole("button", { name: "Download brief.pdf" }),
	).toBeVisible();
	fireEvent.click(screen.getByText("Recipients"));
	expect(screen.getByText("team@example.com")).toBeVisible();
	expect(onImport).not.toHaveBeenCalled();
});

it("falls back to plain text for empty markup and resets image consent when the source changes", () => {
	const { rerender } = render(
		<SourcePreview
			source={{
				...source,
				attachments: [],
				messages: [
					{
						...source.messages[0],
						displayBody: {
							contentType: "html",
							content: "<p></p>",
							attachments: [{ name: "reference.pdf" }],
						},
					},
				],
			}}
			isLoading={false}
			onImport={vi.fn()}
		/>,
	);
	expect(screen.getByText("Plain fallback")).toBeVisible();
	expect(screen.getByText(/reference.pdf/)).toHaveTextContent(
		"open in Outlook",
	);
	const imageSource = {
		...source,
		messages: [
			{
				...source.messages[0],
				displayBody: {
					contentType: "html" as const,
					content:
						'<img src="https://example.com/image.png" alt="Diagram">',
				},
			},
		],
	};
	rerender(
		<SourcePreview
			source={imageSource}
			isLoading={false}
			onImport={vi.fn()}
		/>,
	);
	fireEvent.click(screen.getByRole("button", { name: "Load images" }));
	expect(
		screen.getByTitle("Project update").getAttribute("srcdoc"),
	).toContain("<img");
	rerender(
		<SourcePreview
			source={{
				...imageSource,
				nativeId: "second",
				messages: [{ ...imageSource.messages[0], id: "second" }],
			}}
			isLoading={false}
			onImport={vi.fn()}
		/>,
	);
	expect(screen.getByRole("button", { name: "Load images" })).toBeVisible();
});
