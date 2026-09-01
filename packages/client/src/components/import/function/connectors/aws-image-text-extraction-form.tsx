import {
	Form,
	FormActions,
	FormInput,
	FormSelect,
	SelectItem,
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
	FUNCTION_TYPE: z.string().min(1, "Function type is required"),
	ACCESS_KEY: z.string().min(1, "Access key is required"),
	SECRET_KEY: z.string().min(1, "Secret key is required"),
	REGION: z.string().min(1, "Region is required"),
	S3BUCKETENGINEID: z.string().min(1, "S3 bucket engine id is required"),
});

type FormValues = z.infer<typeof schema>;

/** Add a "AWS Image Text Extraction" (Textract/Rekognition) Function catalog entry. */
export const AwsImageTextExtractionForm = () => {
	const navigate = useNavigate();
	const { configStore } = useRootStore();
	const form = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			NAME: "",
			FUNCTION_TYPE: "AWS_TEXTRACT",
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
				values,
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
			<FormSelect
				name="FUNCTION_TYPE"
				label="Function Type"
				disabled={form.formState.isSubmitting}
				data-testid="function-form-input-FUNCTION_TYPE"
			>
				<SelectItem value="AWS_TEXTRACT">AWS TEXTRACT</SelectItem>
				<SelectItem value="AWS_REKOGNITION">AWS REKOGNITION</SelectItem>
			</FormSelect>
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
			<FormActions
				isSubmitting={form.formState.isSubmitting}
				onCancel={() => navigate(-1)}
				submitLabel="Create"
			/>
		</Form>
	);
};
