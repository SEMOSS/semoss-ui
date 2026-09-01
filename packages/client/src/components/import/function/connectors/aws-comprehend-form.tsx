import {
	Form,
	FormActions,
	FormInput,
	toast,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import { useRootStore } from "@/hooks";
import { useNavigate } from "@/hooks/useNavigate";
import {
	catalogNameSchema,
	createFunctionEngine,
} from "../shared/function-engine.utils";

const schema = z.object({
	NAME: catalogNameSchema,
	ACCESS_KEY: z.string().min(1, "Access key is required"),
	SECRET_KEY: z.string().min(1, "Secret key is required"),
	REGION: z.string().min(1, "Region is required"),
});

type FormValues = z.infer<typeof schema>;

/** Add an "AWS Comprehend" (natural language processing) Function catalog entry. */
export const AwsComprehendForm = () => {
	const navigate = useNavigate();
	const { configStore } = useRootStore();
	const form = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			NAME: "",
			ACCESS_KEY: "",
			SECRET_KEY: "",
			REGION: "",
		},
	});

	const handleSubmit = async (values: FormValues) => {
		try {
			const engineId = await createFunctionEngine(
				values.NAME,
				{ FUNCTION_TYPE: "AWS_COMPREHEND", ...values },
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
			className="flex w-full max-w-2xl flex-col gap-6"
		>
			<FormInput
				name="NAME"
				label="Catalog Name"
				placeholder="Enter a name"
				disabled={form.formState.isSubmitting}
				data-testid="function-form-input-NAME"
			/>
			<FormInput
				name="ACCESS_KEY"
				label="Access Key"
				disabled={form.formState.isSubmitting}
				data-testid="function-form-input-ACCESS_KEY"
			/>
			<FormInput
				name="SECRET_KEY"
				label="Secret Key"
				disabled={form.formState.isSubmitting}
				data-testid="function-form-input-SECRET_KEY"
			/>
			<FormInput
				name="REGION"
				label="Region"
				disabled={form.formState.isSubmitting}
				data-testid="function-form-input-REGION"
			/>
			<FormActions
				isSubmitting={form.formState.isSubmitting}
				onCancel={() => navigate(-1)}
				submitLabel="Create"
			/>
		</Form>
	);
};
