import {
	Form,
	FormActions,
	FormFileDropzone,
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
	PROJECT_ID: z.string().min(1, "Project id is required"),
	PROCESSOR_ID: z.string().min(1, "Processor id is required"),
	REGION: z.string().min(1, "Region is required"),
	GOOGLE_BUCKET_ENGINEID: z
		.string()
		.min(1, "Google bucket engine id is required"),
	FILE: z
		.instanceof(File)
		.nullable()
		.refine((file) => file !== null, {
			message: "A service account file is required.",
		}),
});

type FormValues = z.infer<typeof schema>;

/** Add a "Google OCR" Function catalog entry. */
export const GoogleOcrForm = () => {
	const navigate = useNavigate();
	const { configStore } = useRootStore();
	const form = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			NAME: "",
			PROJECT_ID: "",
			PROCESSOR_ID: "",
			REGION: "",
			GOOGLE_BUCKET_ENGINEID: "",
			FILE: null,
		},
	});

	const handleSubmit = async (values: FormValues) => {
		try {
			const { FILE, ...rest } = values;
			const engineId = await createFunctionEngine(
				values.NAME,
				{ FUNCTION_TYPE: "GOOGLE_OCR", ...rest },
				FILE,
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
				description="The Google Cloud project this connector calls into."
			>
				<FormInput
					name="PROJECT_ID"
					label="Project Id"
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-PROJECT_ID"
				/>
			</FormSection>
			<FormSection
				title="Settings"
				description="The Document AI processor and service account used to run OCR."
			>
				<FormInput
					name="PROCESSOR_ID"
					label="Processor Id"
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-PROCESSOR_ID"
				/>
				<FormInput
					name="REGION"
					label="Region"
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-REGION"
				/>
				<FormFileDropzone
					name="FILE"
					label="Upload Service Account File"
					extensions={[".json"]}
					disabled={form.formState.isSubmitting}
				/>
				<FormInput
					name="GOOGLE_BUCKET_ENGINEID"
					label="Google Bucket Engine Id"
					disabled={form.formState.isSubmitting}
					data-testid="function-form-input-GOOGLE_BUCKET_ENGINEID"
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
