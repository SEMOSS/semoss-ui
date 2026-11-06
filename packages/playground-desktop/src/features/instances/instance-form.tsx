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
import { getErrorMessage } from "@semoss/utility/error";
import { checkInstance } from "./check-instance";
import {
	getModuleUrl,
	type InstanceProfile,
	normalizeInstanceAddress,
} from "./instance.store";

const schema = z.object({
	name: z.string().trim(),
	url: z.string().trim().min(1),
	module: z.string().trim(),
});

type InstanceFormValues = z.infer<typeof schema>;

/** Props for {@link InstanceForm}. */
export interface InstanceFormProps {
	/** Saves the checked instance and starts using it. */
	onConnect: (instance: InstanceProfile) => Promise<void>;
	/** Called on Cancel; no Cancel when unset, as on first launch. */
	onCancel?: () => void;
}

/**
 * Add a SEMOSS instance: its address and deployment path, checked by reading
 * its config before it is saved. A failed check says why inline and keeps
 * what was typed.
 *
 * @component
 */
export const InstanceForm = ({ onConnect, onCancel }: InstanceFormProps) => {
	const { t } = useTranslation("desktop");
	const form = useForm<InstanceFormValues>({
		resolver: zodResolver(schema),
		defaultValues: { name: "", url: "", module: "/Monolith" },
	});
	const { errors, isSubmitting } = form.formState;
	const submitLabel = isSubmitting
		? t("instances.checking")
		: t("instances.connect");

	const handleSubmit = async (values: InstanceFormValues): Promise<void> => {
		let address: { url: string; module: string };
		try {
			address = normalizeInstanceAddress(values.url, values.module);
		} catch (error: unknown) {
			// an address that cannot be used was never contacted
			form.setError("url", {
				type: "validate",
				message: getErrorMessage(error, ""),
			});
			return;
		}
		try {
			await checkInstance(getModuleUrl(address));
		} catch (error: unknown) {
			form.setError("root.server", {
				type: "server",
				message: t("instances.unreachable", {
					message: getErrorMessage(error, ""),
				}),
			});
			return;
		}
		const instance: InstanceProfile = {
			id: crypto.randomUUID(),
			name: values.name || new URL(address.url).host,
			...address,
		};
		await onConnect(instance);
	};

	return (
		<Form
			form={form}
			onSubmit={handleSubmit}
			noValidate
			aria-busy={isSubmitting}
			className="flex flex-col gap-4"
		>
			<FormInput
				name="url"
				label={t("instances.url")}
				placeholder="https://"
				required
				disabled={isSubmitting}
				autoComplete="url"
			/>
			<FormInput
				name="module"
				label={t("instances.module")}
				disabled={isSubmitting}
			/>
			<FormInput
				name="name"
				label={t("instances.name")}
				placeholder={t("instances.namePlaceholder")}
				disabled={isSubmitting}
			/>
			{errors.root?.server?.message && (
				<Alert variant="destructive">
					<AlertDescription>
						{errors.root.server.message}
					</AlertDescription>
				</Alert>
			)}
			{onCancel ? (
				<FormActions
					isSubmitting={isSubmitting}
					onCancel={onCancel}
					submitLabel={submitLabel}
				/>
			) : (
				// first launch: nothing to go back to
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting && <Spinner className="size-4" />}
					{submitLabel}
				</Button>
			)}
		</Form>
	);
};
