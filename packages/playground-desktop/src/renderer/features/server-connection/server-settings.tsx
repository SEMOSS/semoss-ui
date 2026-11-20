import { useTranslation } from "@semoss/i18n";
import {
	Alert,
	AlertDescription,
	Button,
	Form,
	FormActions,
	FormInput,
	Spinner,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import type {
	DesktopBridge,
	SavedServers,
} from "../../../contract/ipc-contract";
import {
	parseServerAddress,
	type ServerConfig,
} from "../../../contract/server-connection";
import { SavedServerList } from "./saved-server-list";

/**
 * The form's shape: one address, such as
 * `https://semoss.example.com/Monolith`. {@link parseServerAddress} does the
 * real validation on submit, and the main process checks the result again.
 */
const schema = z.object({
	address: z.string().trim().min(1),
});

/** The form's values. */
type ServerConnectValues = z.infer<typeof schema>;

/** Props for {@link ServerSettings}. */
interface ServerSettingsProps {
	/** The bridge that checks, saves, switches, and forgets servers. */
	bridge: DesktopBridge;
	/** The saved servers, listed above the form; none on first launch. */
	saved?: SavedServers;
	/** Read the saved servers again, after one is forgotten. */
	onServersChange?: () => Promise<void>;
	/** Leave without changing the server; the form then offers Cancel. */
	onCancel?: () => void;
	/**
	 * Where it is shown: a `page` of its own, whose Connect spans the form, or
	 * a `section` of the settings dialog, whose Connect is small and at the
	 * form's end.
	 */
	layout?: "page" | "section";
}

/**
 * The saved servers, each with Activate and Remove, above a form that adds one
 * by its address and module path. A new server is checked before it is saved,
 * and every saved server keeps its own sign in, so switching back needs none.
 * Shown by the server screen (`ServerConnectView`) and by the settings
 * dialog's Server page.
 */
export const ServerSettings = ({
	bridge,
	saved,
	onServersChange,
	onCancel,
	layout = "page",
}: ServerSettingsProps) => {
	const { t } = useTranslation("desktop");
	const form = useForm<ServerConnectValues>({
		resolver: zodResolver(schema),
		defaultValues: { address: "" },
	});
	const { errors, isSubmitting } = form.formState;
	const hasSaved = saved !== undefined && saved.servers.length > 0;

	/**
	 * Forget a server, then list what is left. Forgetting the one in use
	 * opens the window on another, so this page goes with it.
	 *
	 * @param server - The server.
	 */
	const handleForget = async (server: ServerConfig): Promise<void> => {
		await bridge.invoke("server-connection:forget", server);
		await onServersChange?.();
	};

	/**
	 * Validate, check, then save the server; a failure shows on the form.
	 *
	 * @param values - The form's values.
	 */
	const handleSubmit = async (values: ServerConnectValues): Promise<void> => {
		let server: ServerConfig;
		try {
			server = parseServerAddress(values.address);
		} catch (error) {
			form.setError("address", {
				type: "validate",
				message: error instanceof Error ? error.message : String(error),
			});
			return;
		}
		const check = await bridge.invoke("server-connection:check", server);
		if ("message" in check) {
			form.setError("root.server", {
				type: "server",
				message: check.message,
			});
			return;
		}
		// saving opens the window on the server
		await bridge.invoke("server-connection:set", server);
	};

	return (
		<div className="flex flex-col gap-6">
			{hasSaved ? (
				<SavedServerList
					saved={saved}
					onSwitch={(server) =>
						bridge.invoke("server-connection:set", server)
					}
					onForget={handleForget}
				/>
			) : null}
			{hasSaved ? (
				<h2 className="font-medium text-sm">{t("connect.addTitle")}</h2>
			) : null}
			<Form
				form={form}
				onSubmit={handleSubmit}
				noValidate
				aria-busy={isSubmitting}
				className="flex flex-col gap-4"
			>
				<FormInput
					name="address"
					label={t("connect.urlLabel")}
					description={t("connect.urlHint")}
					placeholder="https://semoss.example.com/Monolith"
					type="url"
					autoComplete="url"
					required
					autoFocus={!hasSaved}
					disabled={isSubmitting}
				/>
				{errors.root?.server?.message ? (
					<Alert variant="destructive" role="alert">
						<AlertDescription>
							{errors.root.server.message}
						</AlertDescription>
					</Alert>
				) : null}
				<output aria-live="polite" className="sr-only">
					{isSubmitting ? t("connect.checking") : ""}
				</output>
				{onCancel ? (
					<FormActions
						isSubmitting={isSubmitting}
						onCancel={onCancel}
						submitLabel={t("connect.submit")}
					/>
				) : (
					<Button
						type="submit"
						disabled={isSubmitting}
						size={layout === "section" ? "sm" : "default"}
						className={
							layout === "section" ? "self-end" : undefined
						}
					>
						{isSubmitting ? <Spinner aria-hidden /> : null}
						{t("connect.submit")}
					</Button>
				)}
			</Form>
		</div>
	);
};
