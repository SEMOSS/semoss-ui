import { Link2, Link2Off, Pencil } from "lucide-react";
import { useCallback, useEffect, useId, useState } from "react";
import { Button, H4, Input, Label, Spinner, toast } from "@semoss/ui/next";
import { useRootStore } from "@/hooks";

/**
 * Placeholder the backend returns in place of a stored credential. Must match
 * Constants.SENSITIVE_INFO_MASK on the server. Sending it back unchanged tells
 * the backend to keep the token it already has, so the secret never travels to
 * the browser in either direction.
 */
const AUTH_TOKEN_MASK = "********";

interface ProjectInfoOutput {
	project_remote_mcp?: boolean;
	project_remote_mcp_endpoint?: string;
	project_remote_mcp_auth_scheme?: string;
	project_remote_mcp_auth_token?: string;
}

interface PixelResponse<O> {
	pixelReturn?: {
		operationType?: string[] | string;
		output?: O | string;
	}[];
}

const hasPixelError = (operationType?: string[] | string): boolean => {
	if (Array.isArray(operationType)) {
		return operationType.includes("ERROR");
	}
	if (typeof operationType === "string") {
		return operationType.includes("ERROR");
	}
	return false;
};

export interface RemoteMcpConnectionProps {
	/** Id of the project/app whose MCP connection is being configured */
	projectId: string;

	/** Called after a successful connect or disconnect so the caller can refetch its tools */
	onChange?: () => void;
}

/**
 * Connects an app to an external MCP server. Shows the current connection when
 * one exists, with the stored credential rendered as a fixed mask that cannot be
 * read or edited in place, and otherwise collects the endpoint plus an optional
 * auth scheme and token.
 */
export const RemoteMcpConnection = ({
	projectId,
	onChange,
}: RemoteMcpConnectionProps) => {
	const { monolithStore } = useRootStore();

	const endpointId = useId();
	const schemeId = useId();
	const tokenId = useId();

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [connected, setConnected] = useState(false);

	const [endpoint, setEndpoint] = useState("");
	const [authScheme, setAuthScheme] = useState("");
	const [authToken, setAuthToken] = useState("");

	// true while the stored token is being shown as a mask; the user must opt in
	// to replacing it so a stray save cannot wipe a working credential
	const [tokenMasked, setTokenMasked] = useState(false);

	const loadConnection = useCallback(async () => {
		setLoading(true);
		try {
			const response = (await monolithStore.runQuery(
				`ProjectInfo(project=[${JSON.stringify(projectId)}])`,
			)) as PixelResponse<ProjectInfoOutput>;

			const result = response?.pixelReturn?.[0];
			if (hasPixelError(result?.operationType)) {
				return;
			}

			const output = result?.output;
			if (typeof output !== "object" || output === null) {
				return;
			}

			const isConnected = output.project_remote_mcp === true;
			const storedToken = output.project_remote_mcp_auth_token || "";

			setConnected(isConnected);
			setEndpoint(output.project_remote_mcp_endpoint || "");
			setAuthScheme(output.project_remote_mcp_auth_scheme || "");
			setAuthToken(storedToken);
			setTokenMasked(storedToken === AUTH_TOKEN_MASK);
		} catch {
			// a failed read just leaves the form in its disconnected state
		} finally {
			setLoading(false);
		}
	}, [monolithStore, projectId]);

	useEffect(() => {
		if (!projectId) {
			return;
		}
		loadConnection();
	}, [projectId, loadConnection]);

	const save = useCallback(
		async (nextEndpoint: string, nextScheme: string, nextToken: string) => {
			setSaving(true);
			try {
				const response = (await monolithStore.runQuery(
					`SetRemoteMCP(project=[${JSON.stringify(projectId)}], mcpEndpoint=[${JSON.stringify(
						nextEndpoint,
					)}], mcpAuthScheme=[${JSON.stringify(
						nextScheme,
					)}], mcpAuthToken=[${JSON.stringify(nextToken)}])`,
				)) as PixelResponse<unknown>;

				const result = response?.pixelReturn?.[0];
				if (hasPixelError(result?.operationType)) {
					toast.error(
						typeof result?.output === "string"
							? result.output
							: "Unable to update the external MCP connection.",
					);
					return;
				}

				toast.success(
					nextEndpoint
						? "Connected to the external MCP"
						: "Disconnected the external MCP",
				);
				await loadConnection();
				onChange?.();
			} catch (error) {
				toast.error(
					error instanceof Error
						? error.message
						: "Unable to update the external MCP connection.",
				);
			} finally {
				setSaving(false);
			}
		},
		[monolithStore, projectId, loadConnection, onChange],
	);

	const connect = useCallback(() => {
		if (!endpoint.trim()) {
			toast.error("Enter the URL of the external MCP server.");
			return;
		}
		save(endpoint.trim(), authScheme.trim(), authToken.trim());
	}, [endpoint, authScheme, authToken, save]);

	const disconnect = useCallback(() => {
		save("", "", "");
	}, [save]);

	if (loading) {
		return (
			<div className="flex items-center gap-2 text-muted-foreground text-sm">
				<Spinner className="size-4" />
				Loading connection...
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div>
				<H4>
					{connected
						? "External MCP connection"
						: "Connect to an external MCP"}
				</H4>
				<p className="text-muted-foreground text-sm">
					{connected
						? "This app serves tools from the external MCP server below instead of its own."
						: "Point this app at an MCP server hosted elsewhere. Its tools become the tools this app exposes."}
				</p>
			</div>

			<div className="flex flex-col gap-1.5">
				<Label htmlFor={endpointId}>Server URL</Label>
				<Input
					id={endpointId}
					value={endpoint}
					disabled={saving}
					placeholder="https://example.com/mcp"
					onChange={(e) => setEndpoint(e.target.value)}
					data-testid="remote-mcp-endpoint"
				/>
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				<div className="flex flex-col gap-1.5">
					<Label htmlFor={schemeId}>Auth scheme (optional)</Label>
					<Input
						id={schemeId}
						value={authScheme}
						disabled={saving}
						placeholder="Bearer"
						onChange={(e) => setAuthScheme(e.target.value)}
						data-testid="remote-mcp-auth-scheme"
					/>
					<p className="text-muted-foreground text-xs">
						Defaults to Bearer when a token is provided.
					</p>
				</div>

				<div className="flex flex-col gap-1.5">
					<Label htmlFor={tokenId}>Auth token (optional)</Label>
					<div className="flex items-center gap-2">
						<Input
							id={tokenId}
							type={tokenMasked ? "text" : "password"}
							value={authToken}
							disabled={saving || tokenMasked}
							placeholder="Token sent on every request"
							onChange={(e) => setAuthToken(e.target.value)}
							data-testid="remote-mcp-auth-token"
						/>
						{tokenMasked && (
							<Button
								variant="outline"
								size="sm"
								type="button"
								disabled={saving}
								onClick={() => {
									setTokenMasked(false);
									setAuthToken("");
								}}
								data-testid="remote-mcp-replace-token"
							>
								<Pencil className="size-3.5" />
								Replace
							</Button>
						)}
					</div>
					<p className="text-muted-foreground text-xs">
						{tokenMasked
							? "Hidden for security. Choose Replace to set a new token."
							: "Stored on the server and never returned to the browser."}
					</p>
				</div>
			</div>

			<div className="flex flex-wrap gap-2">
				<Button
					type="button"
					disabled={saving}
					onClick={connect}
					data-testid="remote-mcp-connect"
				>
					<Link2 className="size-4" />
					{connected ? "Save changes" : "Connect"}
				</Button>
				{connected && (
					<Button
						variant="destructive"
						type="button"
						disabled={saving}
						onClick={disconnect}
						data-testid="remote-mcp-disconnect"
					>
						<Link2Off className="size-4" />
						Disconnect
					</Button>
				)}
				{saving && <Spinner className="size-4 self-center" />}
			</div>
		</div>
	);
};
