import { Trash2Icon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button, Input, Label } from "@semoss/ui/next";
import type { ConnectionRecord } from "../../electron/connections/types";
import { SemossIcon } from "./semoss-icon";

type AuthMode = "keys" | "browser";

const EMPTY_FORM = {
	alias: "",
	instanceUrl: "",
	modulePath: "/Monolith",
	accessKey: "",
	secretKey: "",
};

export interface ConnectionsPageProps {
	/** Full-screen first-run layout vs a compact in-dialog layout. */
	variant?: "full" | "compact";
}

/**
 * Manage saved SEMOSS environments: add, remove, and switch between them.
 * Rendered full-screen on first run (no connection selected yet) and inside
 * a dialog from the title bar's connection switcher once connected.
 * Selecting a connection reloads this whole window against the new
 * environment — there's no in-place client transition to handle here.
 */
export const ConnectionsPage = ({ variant = "full" }: ConnectionsPageProps) => {
	const [connections, setConnections] = useState<ConnectionRecord[]>([]);
	const [currentId, setCurrentId] = useState<string | null>(null);
	const [showForm, setShowForm] = useState(false);
	const [authMode, setAuthMode] = useState<AuthMode>("keys");
	const [form, setForm] = useState(EMPTY_FORM);
	const [busyId, setBusyId] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	// Set once beginBrowserLogin succeeds — while non-null, the sign-in
	// window is open and we're waiting for the user to finish there.
	const [browserLoginId, setBrowserLoginId] = useState<string | null>(null);
	const [browserLoginBusy, setBrowserLoginBusy] = useState(false);

	const refresh = useCallback(async () => {
		const [list, current] = await Promise.all([
			window.semossDesktop.connections.list(),
			window.semossDesktop.connections.getCurrentId(),
		]);
		setConnections(list);
		setCurrentId(current);
	}, []);

	useEffect(() => {
		void refresh();
	}, [refresh]);

	const resetForm = () => {
		setShowForm(false);
		setForm(EMPTY_FORM);
		setAuthMode("keys");
		setBrowserLoginId(null);
		setBrowserLoginBusy(false);
		setError(null);
	};

	const handleConnect = async (id: string) => {
		setError(null);
		setBusyId(id);
		try {
			await window.semossDesktop.connections.select(id);
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
		} finally {
			setBusyId(null);
		}
	};

	const handleRemove = async (id: string) => {
		setError(null);
		await window.semossDesktop.connections.remove(id);
		await refresh();
	};

	const handleSaveKeys = async () => {
		setError(null);
		if (
			!form.alias ||
			!form.instanceUrl ||
			!form.accessKey ||
			!form.secretKey
		) {
			setError(
				"Alias, instance URL, access key, and secret key are all required.",
			);
			return;
		}
		try {
			const record = await window.semossDesktop.connections.add(form);
			resetForm();
			await refresh();
			await handleConnect(record.id);
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
		}
	};

	const handleBeginBrowserLogin = async () => {
		setError(null);
		if (!form.alias || !form.instanceUrl) {
			setError("Alias and instance URL are required.");
			return;
		}
		try {
			const loginId =
				await window.semossDesktop.connections.beginBrowserLogin({
					alias: form.alias,
					instanceUrl: form.instanceUrl,
					modulePath: form.modulePath,
				});
			setBrowserLoginId(loginId);
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
		}
	};

	const handleCompleteBrowserLogin = async () => {
		if (!browserLoginId) {
			return;
		}
		setError(null);
		setBrowserLoginBusy(true);
		try {
			// On success the main process also selects and (re)loads this
			// connection — this whole window is about to reload, so there's
			// nothing further to do here beyond resetting local state.
			await window.semossDesktop.connections.completeBrowserLogin(
				browserLoginId,
			);
			resetForm();
			await refresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
		} finally {
			setBrowserLoginBusy(false);
		}
	};

	const handleCancelBrowserLogin = async () => {
		if (browserLoginId) {
			await window.semossDesktop.connections.cancelBrowserLogin(
				browserLoginId,
			);
		}
		setBrowserLoginId(null);
		setError(null);
	};

	return (
		<div className={variant === "full" ? "flex justify-center p-10" : ""}>
			<div
				className={
					variant === "full"
						? "flex w-full max-w-xl flex-col gap-6 pt-12"
						: "flex flex-col gap-6"
				}
			>
				{variant === "full" ? (
					<div className="flex items-center gap-3">
						<SemossIcon width={32} height={37} />
						<div>
							<h1 className="font-semibold text-lg">
								AI Core Playground
							</h1>
							<p className="text-muted-foreground text-sm">
								Choose an AI Core environment to connect to.
							</p>
						</div>
					</div>
				) : null}

				{error ? (
					<div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-destructive text-sm">
						{error}
					</div>
				) : null}

				<div className="flex flex-col gap-2">
					{connections.length === 0 ? (
						<p className="text-muted-foreground text-sm">
							No saved connections yet.
						</p>
					) : (
						connections.map((connection) => (
							<div
								key={connection.id}
								className="flex items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2"
							>
								<div className="min-w-0">
									<div className="flex items-center gap-2">
										<span className="truncate font-medium text-sm">
											{connection.alias}
										</span>
										{connection.id === currentId ? (
											<span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary text-xs">
												Current
											</span>
										) : null}
										<span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground uppercase tracking-wide">
											{connection.authMode === "browser"
												? "Signed in"
												: "Keys"}
										</span>
									</div>
									<p className="truncate text-muted-foreground text-xs">
										{connection.instanceUrl}
										{connection.modulePath}
									</p>
								</div>
								<div className="flex shrink-0 gap-2">
									<Button
										size="sm"
										disabled={
											busyId === connection.id ||
											connection.id === currentId
										}
										onClick={() =>
											handleConnect(connection.id)
										}
									>
										{busyId === connection.id
											? "Connecting…"
											: connection.id === currentId
												? "Connected"
												: "Connect"}
									</Button>
									<Button
										size="icon-sm"
										variant="ghost"
										aria-label="Remove connection"
										onClick={() =>
											handleRemove(connection.id)
										}
									>
										<Trash2Icon />
									</Button>
								</div>
							</div>
						))
					)}
				</div>

				{showForm ? (
					<div className="flex flex-col gap-3 rounded-md border border-border bg-card p-4">
						<div className="flex gap-1 rounded-md border border-border p-1">
							<Button
								size="sm"
								className="flex-1"
								variant={
									authMode === "keys" ? "default" : "ghost"
								}
								disabled={browserLoginId !== null}
								onClick={() => setAuthMode("keys")}
							>
								Access Key
							</Button>
							<Button
								size="sm"
								className="flex-1"
								variant={
									authMode === "browser" ? "default" : "ghost"
								}
								disabled={browserLoginId !== null}
								onClick={() => setAuthMode("browser")}
							>
								Sign in via browser
							</Button>
						</div>

						<Field
							label="Alias"
							value={form.alias}
							placeholder="e.g. Production, Development"
							disabled={browserLoginId !== null}
							onChange={(alias) => setForm({ ...form, alias })}
						/>
						<Field
							label="Instance URL"
							value={form.instanceUrl}
							placeholder="https://your-semoss-instance.com"
							disabled={browserLoginId !== null}
							onChange={(instanceUrl) =>
								setForm({ ...form, instanceUrl })
							}
						/>
						<Field
							label="Module"
							value={form.modulePath}
							placeholder="/Monolith"
							disabled={browserLoginId !== null}
							onChange={(modulePath) =>
								setForm({ ...form, modulePath })
							}
						/>

						{authMode === "keys" ? (
							<>
								<Field
									label="Access Key"
									value={form.accessKey}
									onChange={(accessKey) =>
										setForm({ ...form, accessKey })
									}
								/>
								<Field
									label="Secret Key"
									value={form.secretKey}
									type="password"
									onChange={(secretKey) =>
										setForm({ ...form, secretKey })
									}
								/>
								<div className="flex justify-end gap-2">
									<Button variant="ghost" onClick={resetForm}>
										Cancel
									</Button>
									<Button onClick={handleSaveKeys}>
										Save &amp; Connect
									</Button>
								</div>
							</>
						) : browserLoginId === null ? (
							<div className="flex justify-end gap-2">
								<Button variant="ghost" onClick={resetForm}>
									Cancel
								</Button>
								<Button onClick={handleBeginBrowserLogin}>
									Sign In
								</Button>
							</div>
						) : (
							<>
								<p className="text-muted-foreground text-sm">
									A sign-in window opened — it supports both
									username/password and any SSO providers this
									instance offers. Finish signing in there,
									then come back and click Continue.
								</p>
								<div className="flex justify-end gap-2">
									<Button
										variant="ghost"
										disabled={browserLoginBusy}
										onClick={handleCancelBrowserLogin}
									>
										Cancel
									</Button>
									<Button
										disabled={browserLoginBusy}
										onClick={handleCompleteBrowserLogin}
									>
										{browserLoginBusy
											? "Checking…"
											: "Continue"}
									</Button>
								</div>
							</>
						)}
					</div>
				) : (
					<Button
						variant="outline"
						className="self-center"
						onClick={() => setShowForm(true)}
					>
						Add connection
					</Button>
				)}
			</div>
		</div>
	);
};

const Field = ({
	label,
	value,
	onChange,
	placeholder,
	type = "text",
	disabled = false,
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	type?: string;
	disabled?: boolean;
}) => (
	<div className="flex flex-col gap-1">
		<Label>{label}</Label>
		<Input
			type={type}
			value={value}
			placeholder={placeholder}
			disabled={disabled}
			onChange={(e) => onChange(e.target.value)}
		/>
	</div>
);
