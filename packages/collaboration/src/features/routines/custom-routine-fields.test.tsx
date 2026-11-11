import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Form, useForm } from "@semoss/ui/next";
import { CustomRoutineFields } from "./custom-routine-fields";
import {
	type CatalogSkill,
	type CustomRoutineSettings,
	customRoutineSettingsSchema,
	IS_ROUTINE_KNOWLEDGE_ENABLED,
} from "./custom-routine-schema";

// the catalogs: knowledge (VECTOR engines) answers with one knowledge base, toolboxes with one app
vi.mock("@semoss/sdk/react", () => ({
	useIteratorPixel: (
		statement: (limit: number, offset: number) => string,
	) => {
		const pixel = statement(25, 0);
		const data = !pixel
			? []
			: [
					pixel.includes('"VECTOR"')
						? { id: "handbook", name: "Handbook", type: "VECTOR" }
						: { id: "jira", name: "Jira", type: "PROJECT" },
				].map((tool) => ({
					...tool,
					description: "From the catalog",
					tags: [],
					permission: "READ_ONLY",
				}));
		return {
			data,
			totalCount: data.length,
			error: null,
			isLoading: false,
			hasMore: false,
			next: vi.fn(),
			reset: vi.fn(),
		};
	},
}));

const catalog: CatalogSkill[] = [
	{ id: "summary", name: "Client summary", description: "Grouped by client" },
	{ id: "status", name: "Status report", description: "" },
];

const settings: CustomRoutineSettings = {
	enabled: true,
	name: "Pipeline",
	prompt: "Summarize the pipeline",
	time: "08:00",
	days: ["MON"],
	timezone: "America/New_York",
	delivery: "email",
	skills: ["summary", "gone"],
	tools: [
		{ id: "sales-db", name: "Sales DB", type: "DATABASE" },
		{ id: "policies", name: "Policy library", type: "VECTOR" },
	],
	agentId: "",
};

/** Ten tools, with a saved knowledge base among them; the server takes no more. */
const tenTools: CustomRoutineSettings["tools"] = [
	...Array.from({ length: 9 }, (_, index) => ({
		id: `db-${index}`,
		name: `Database ${index}`,
		type: "DATABASE" as const,
	})),
	{ id: "policies", name: "Policy library", type: "VECTOR" },
];

function Harness({
	onValues,
	tools = settings.tools,
}: {
	onValues: (values: unknown) => void;
	tools?: CustomRoutineSettings["tools"];
}) {
	const form = useForm<CustomRoutineSettings>({
		defaultValues: { ...settings, tools },
	});
	onValues(form.watch());
	return (
		<Form form={form} onSubmit={() => undefined}>
			<CustomRoutineFields skills={catalog} />
		</Form>
	);
}

function section(name: string) {
	return screen.getByRole("region", { name });
}

describe("custom routine skills and tools", () => {
	it("shows what the routine uses, adds from each catalog and removes", async () => {
		const user = userEvent.setup();
		let values = {} as CustomRoutineSettings;
		render(
			<Harness
				onValues={(next) => {
					values = next as CustomRoutineSettings;
				}}
			/>,
		);
		const skills = section("Skills");
		expect(within(skills).getByText("Client summary")).toBeVisible();
		// a skill the owner lost access to stays removable
		expect(
			within(skills).getByText("A skill you can no longer use"),
		).toBeVisible();
		expect(within(section("Tools")).getByText("Sales DB")).toBeVisible();
		// knowledge bases share the routine's tools but never show as tools
		expect(
			within(section("Tools")).queryByText("Policy library"),
		).not.toBeInTheDocument();

		await user.click(screen.getByRole("button", { name: "Add skills" }));
		await user.click(
			within(screen.getByRole("dialog")).getByRole("checkbox", {
				name: /Status report/,
			}),
		);
		await user.click(screen.getByRole("button", { name: "Done" }));
		expect(values.skills).toEqual(["summary", "gone", "status"]);

		await user.click(screen.getByRole("button", { name: "Add tools" }));
		await user.click(
			within(screen.getByRole("dialog")).getByRole("checkbox", {
				name: /Jira/,
			}),
		);
		await user.click(screen.getByRole("button", { name: "Done" }));
		// only the saved fields, not the catalog row's description or permission
		expect(values.tools).toEqual([
			{ id: "sales-db", name: "Sales DB", type: "DATABASE" },
			{ id: "jira", name: "Jira", type: "PROJECT" },
			{ id: "policies", name: "Policy library", type: "VECTOR" },
		]);

		await user.click(
			screen.getByRole("button", { name: "Remove Sales DB" }),
		);
		expect(values.tools).toEqual([
			{ id: "jira", name: "Jira", type: "PROJECT" },
			{ id: "policies", name: "Policy library", type: "VECTOR" },
		]);
		await user.click(
			screen.getByRole("button", {
				name: "Remove A skill you can no longer use",
			}),
		);
		expect(values.skills).toEqual(["summary", "status"]);
	});

	it("stops adding tools at ten, counting saved knowledge, and says why", async () => {
		const user = userEvent.setup();
		render(<Harness onValues={() => undefined} tools={tenTools} />);
		const reason =
			"A routine can use up to 10 tools and knowledge bases. Remove one to add another.";
		expect(within(section("Tools")).getByText(reason)).toBeVisible();
		expect(
			screen.getByRole("button", { name: "Remove Database 0" }),
		).toBeEnabled();
		await user.click(screen.getByRole("button", { name: "Add tools" }));
		expect(
			within(screen.getByRole("dialog")).getByRole("checkbox", {
				name: /Jira/,
			}),
		).toBeDisabled();
		await user.click(screen.getByRole("button", { name: "Done" }));
		// removing one makes room again
		await user.click(
			screen.getByRole("button", { name: "Remove Database 0" }),
		);
		expect(screen.queryByText(reason)).not.toBeInTheDocument();
		await user.click(screen.getByRole("button", { name: "Add tools" }));
		expect(
			within(screen.getByRole("dialog")).getByRole("checkbox", {
				name: /Jira/,
			}),
		).toBeEnabled();
	});

	it("offers the daily brief as a place for the result, and then asks for no schedule", async () => {
		const user = userEvent.setup();
		let values = {} as CustomRoutineSettings;
		render(
			<Harness
				onValues={(next) => {
					values = next as CustomRoutineSettings;
				}}
			/>,
		);
		expect(
			screen.getByRole("group", { name: "Days (required)" }),
		).toBeVisible();
		await user.click(
			screen.getByRole("radio", { name: /Add to my daily brief/ }),
		);
		expect(values.delivery).toBe("brief");
		expect(
			screen.getByText(/The brief starts this routine on every run/),
		).toBeVisible();
		expect(
			screen.queryByRole("group", { name: "Days (required)" }),
		).not.toBeInTheDocument();
		// its days and time stay saved, for when the result goes somewhere else again
		expect(values.days).toEqual(["MON"]);
		expect(values.time).toBe("08:00");
		await user.click(screen.getByRole("radio", { name: /Email me/ }));
		expect(
			screen.getByRole("group", { name: "Days (required)" }),
		).toBeVisible();
	});

	it("refuses an eleventh tool before it reaches the server", () => {
		const eleven = [
			...tenTools,
			{ id: "jira", name: "Jira", type: "PROJECT" as const },
		];
		expect(
			customRoutineSettingsSchema.safeParse({
				...settings,
				tools: tenTools,
			}).success,
		).toBe(true);
		expect(
			customRoutineSettingsSchema.safeParse({
				...settings,
				tools: eleven,
			}).success,
		).toBe(false);
	});

	it.runIf(IS_ROUTINE_KNOWLEDGE_ENABLED)(
		"adds and removes knowledge beside the tools",
		async () => {
			const user = userEvent.setup();
			let values = {} as CustomRoutineSettings;
			render(
				<Harness
					onValues={(next) => {
						values = next as CustomRoutineSettings;
					}}
				/>,
			);
			expect(
				within(section("Knowledge")).getByText("Policy library"),
			).toBeVisible();

			await user.click(
				screen.getByRole("button", { name: "Add knowledge" }),
			);
			await user.click(
				within(screen.getByRole("dialog")).getByRole("checkbox", {
					name: /Handbook/,
				}),
			);
			await user.click(screen.getByRole("button", { name: "Done" }));
			expect(values.tools).toEqual([
				{ id: "sales-db", name: "Sales DB", type: "DATABASE" },
				{ id: "policies", name: "Policy library", type: "VECTOR" },
				{ id: "handbook", name: "Handbook", type: "VECTOR" },
			]);

			await user.click(
				screen.getByRole("button", { name: "Remove Policy library" }),
			);
			expect(values.tools).toEqual([
				{ id: "sales-db", name: "Sales DB", type: "DATABASE" },
				{ id: "handbook", name: "Handbook", type: "VECTOR" },
			]);
		},
	);

	it.skipIf(IS_ROUTINE_KNOWLEDGE_ENABLED)(
		"hides knowledge while it is turned off",
		() => {
			render(<Harness onValues={() => undefined} />);
			expect(
				screen.queryByRole("region", { name: "Knowledge" }),
			).not.toBeInTheDocument();
			expect(
				screen.queryByRole("button", { name: "Add knowledge" }),
			).not.toBeInTheDocument();
		},
	);
});
