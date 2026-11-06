import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { InstanceForm } from "./instance-form";

const checkInstance = vi.hoisted(() => vi.fn());
vi.mock("./check-instance", () => ({ checkInstance: checkInstance }));
vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({
		t: (key: string, values?: { message?: string }) =>
			values?.message ? `${key}: ${values.message}` : key,
	}),
}));

afterEach(() => checkInstance.mockReset());

const submit = (url: string) => {
	fireEvent.change(screen.getByLabelText("instances.url"), {
		target: { value: url },
	});
	fireEvent.click(screen.getByRole("button", { name: "instances.connect" }));
};

test("an address that cannot be used is a field error, and is never checked", async () => {
	const onConnect = vi.fn();
	render(<InstanceForm onConnect={onConnect} />);
	submit("http://semoss.example.com");
	expect(
		await screen.findByText(
			"The server must use https (http only for localhost).",
		),
	).toBeInTheDocument();
	expect(screen.getByLabelText("instances.url")).toHaveAttribute(
		"aria-invalid",
		"true",
	);
	expect(checkInstance).not.toHaveBeenCalled();
	expect(onConnect).not.toHaveBeenCalled();
});

test("a server that does not answer says so and keeps what was typed", async () => {
	checkInstance.mockRejectedValueOnce(new Error("The server answered 404."));
	const onConnect = vi.fn();
	render(<InstanceForm onConnect={onConnect} />);
	submit("https://semoss.example.com/");
	expect(
		await screen.findByText(
			"instances.unreachable: The server answered 404.",
		),
	).toBeInTheDocument();
	expect(screen.getByLabelText("instances.url")).toHaveValue(
		"https://semoss.example.com/",
	);
	expect(onConnect).not.toHaveBeenCalled();
});

test("a server that answers is saved, named by its host", async () => {
	checkInstance.mockResolvedValueOnce(undefined);
	const onConnect = vi.fn().mockResolvedValue(undefined);
	render(<InstanceForm onConnect={onConnect} />);
	submit("http://localhost:9090");
	await waitFor(() => expect(onConnect).toHaveBeenCalledTimes(1));
	expect(checkInstance).toHaveBeenCalledWith(
		"http://localhost:9090/Monolith",
	);
	expect(onConnect.mock.calls[0][0]).toMatchObject({
		name: "localhost:9090",
		url: "http://localhost:9090",
		module: "/Monolith",
	});
});
