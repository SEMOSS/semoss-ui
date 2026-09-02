import {
	Form,
	FormActions,
	FormInput,
	FormSection,
	toast,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import { useRootStore } from "@/hooks";
import { useNavigate } from "@/hooks/useNavigate";
import { catalogNameSchema } from "@/utility/catalog";
import { createFunctionEngine } from "../shared/function-engine.utils";

const schema = z.object({
	NAME: catalogNameSchema,
	ACCESS_KEY: z.string().min(1, "Access key is required"),
	SECRET_KEY: z.string().min(1, "Secret key is required"),
	REGION: z.string().min(1, "Region is required"),
	S3BUCKETENGINEID: z.string().min(1, "S3 bucket engine id is required"),
});

type FormValues = z.infer<typeof schema>;

/** Add an "AWS Transcribe" (speech to text) Function catalog entry. */
export const AwsTranscribeForm = () => {
	const navigate = useNavigate();
	const { configStore } = useRootStore();
	const form = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			NAME: "",
			ACCESS_KEY: "",
			SECRET_KEY: "",
			REGION: "",
			S3BUCKETENGINEID: "",
		},
	});

	const handleSubmit = async (values: FormValues) => {
		try {
			const engineId = await createFunctionEngine(
				values.NAME,
				{ FUNCTION_TYPE: "AWS_TRANSCRIBE", ...values },
				undefined,
				configStore.store.insightID,
			);
			toast.success("Successfully added function database to catalog");
			navigate(`/function/${engineId}`);
		} catch (err) {
			console.error(err);
			toast.error(
				err instanceof Error ? err.message : "Something went wrong",
			);
		}
	};

	return (
		<Form
			form={form}
			onSubmit={handleSubmit}
			className="flex w-full flex-col gap-6"
		>
			<FormSection title="General" description="Name this catalog entry.">
				<FormInput
					name="NAME"
					label="Catalog Name"
					placeholder="Enter a name"
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-NAME"
				/>
			</FormSection>
			<FormSection
				title="Credentials"
				description="AWS credentials used to call Transcribe."
			>
				<FormInput
					name="ACCESS_KEY"
					label="Access Key"
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-ACCESS_KEY"
				/>
				<FormInput
					name="SECRET_KEY"
					label="Secret Key"
					type="password"
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-SECRET_KEY"
				/>
			</FormSection>
			<FormSection
				title="Settings"
				description="Where the AWS resources this connector talks to are located."
			>
				<FormInput
					name="REGION"
					label="Region"
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-REGION"
				/>
				<FormInput
					name="S3BUCKETENGINEID"
					label="S3 Bucket Engine Id"
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-S3BUCKETENGINEID"
				/>
			</FormSection>
			<FormActions
				isSubmitting={form.formState.isSubmitting}
				onCancel={() => navigate(-1)}
				submitLabel="Create"
			/>
		</Form>
	);
};
