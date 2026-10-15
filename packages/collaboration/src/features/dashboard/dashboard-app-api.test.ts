import { listDashboardApps, validateDashboardApp } from "./dashboard-app-api";

const response = (output: unknown) => ({
	pixelReturn: [{ output, operationType: [] }],
});

it("pages accessible apps and omits unpublished rows without hiding later pages", async () => {
	const run = vi.fn().mockResolvedValue(
		response(
			Array.from({ length: 25 }, (_, index) => ({
				project_id: `app-${index}`,
				project_name: "App",
				project_type: "CODE",
				project_portal_published_date:
					index === 0 ? "2026-10-01" : null,
			})),
		),
	);
	const page = await listDashboardApps({ run } as never, "sales", 25);
	expect(page.apps).toHaveLength(1);
	expect(page.hasMore).toBe(true);
	expect(page.nextOffset).toBe(50);
	expect(run).toHaveBeenCalledWith(
		'MyProjects(projectType=["CODE","BLOCKS"], filterWord=["sales"], limit=[25], offset=[25]);',
	);
});

it("rejects revoked access and unpublished portals before an iframe is mounted", async () => {
	const run = vi
		.fn()
		.mockResolvedValueOnce(
			response({ project_is_published: false, project_portal_url: "" }),
		)
		.mockResolvedValueOnce({
			pixelReturn: [
				{ output: "Access denied", operationType: ["ERROR"] },
			],
		});
	await expect(validateDashboardApp({ run } as never, "app")).rejects.toThrow(
		"no longer published",
	);
	await expect(validateDashboardApp({ run } as never, "app")).rejects.toThrow(
		"Access denied",
	);
});
