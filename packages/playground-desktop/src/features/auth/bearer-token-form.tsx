import { useTranslation } from "@semoss/i18n";
import { Env, Session } from "@semoss/sdk";
import {
	Alert,
	AlertDescription,
	Button,
	Form,
	FormInput,
	FormSwitch,
	Muted,
	Spinner,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import {
	BEARER_TOKEN_SECRET,
	deleteSecret,
	writeSecret,
} from "../../platform/keychain";
import type { InstanceStore } from "../instances/instance.store";

const schema = z.object({
	token: z.string().trim().min(1),
	provider: z.string().trim(),
	remember: z.boolean(),
});

type BearerTokenValues = z.infer<typeof schema>;

/** Props for {@link BearerTokenForm}. */
export interface BearerTokenFormProps {
	/** The saved instances; the one in use records the sign in. */
	instances: InstanceStore;
}

/**
 * Sign in with a bearer token from the user's identity provider: the SDK
 * sends it on every request (`Authorization: Bearer`, `Bearer-Provider`).
 * "Remember" keeps it in the system keychain for the next launch; without it,
 * any token kept before is forgotten. A token the server refuses says so
 * inline.
 *
 * @component
 */
export const BearerTokenForm = ({ instances }: BearerTokenFormProps) => {
	const { t } = useTranslation("desktop");
	const active = instances.activeInstance;
	const form = useForm<BearerTokenValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			token: "",
			provider: active?.bearerProvider ?? "",
			remember: false,
		},
	});
	const { errors, isSubmitting } = form.formState;

	const handleSubmit = async (values: BearerTokenValues): Promise<void> => {
		Env.update({
			BEARER_TOKEN: values.token,
			BEARER_PROVIDER: values.provider,
		});
		await Session.refresh();
		if (Session.getSnapshot().status !== "AUTHENTICATED") {
			Env.update({ BEARER_TOKEN: "", BEARER_PROVIDER: "" });
			form.setError("root.server", {
				type: "server",
				message: t("auth.tokenRefused"),
			});
			return;
		}
		if (active) {
			// the token is kept only in the keychain, never in the app's files
			if (values.remember) {
				await writeSecret(active.id, BEARER_TOKEN_SECRET, values.token);
			} else {
				await deleteSecret(active.id, BEARER_TOKEN_SECRET);
			}
			await instances.recordLogin("bearer", values.provider);
		}
	};

	return (
		<Form
			form={form}
			onSubmit={handleSubmit}
			noValidate
			aria-busy={isSubmitting}
			className="flex flex-col gap-4"
		>
			<Muted>{t("auth.tokenHint")}</Muted>
			<FormInput
				name="token"
				type="password"
				label={t("auth.tokenLabel")}
				required
				autoComplete="off"
				disabled={isSubmitting}
			/>
			<FormInput
				name="provider"
				label={t("auth.provider")}
				disabled={isSubmitting}
			/>
			<FormSwitch
				name="remember"
				label={t("auth.remember")}
				disabled={isSubmitting}
			/>
			{errors.root?.server?.message && (
				<Alert variant="destructive">
					<AlertDescription>
						{errors.root.server.message}
					</AlertDescription>
				</Alert>
			)}
			<Button type="submit" disabled={isSubmitting}>
				{isSubmitting && <Spinner className="size-4" />}
				{t("auth.signIn")}
			</Button>
		</Form>
	);
};
