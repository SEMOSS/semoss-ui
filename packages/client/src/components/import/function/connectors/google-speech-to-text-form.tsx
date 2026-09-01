import {
	Form,
	FormActions,
	FormFileDropzone,
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

/** Add a "Google Speech To Text" Function catalog entry. */
export const GoogleSpeechToTextForm = () => {
	const navigate = useNavigate();
	const { configStore } = useRootStore();
	const form = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			NAME: "",
			GOOGLE_BUCKET_ENGINEID: "",
			FILE: null,
		},
	});

	const handleSubmit = async (values: FormValues) => {
		try {
			const { FILE, ...rest } = values;
			const engineId = await createFunctionEngine(
				values.NAME,
				{ FUNCTION_TYPE: "GOOGLE_SPEECH_TO_TEXT", ...rest },
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
				name="GOOGLE_BUCKET_ENGINEID"
				label="Google Bucket Engine Id"
				disabled={form.formState.isSubmitting}
				data-testid="function-form-input-GOOGLE_BUCKET_ENGINEID"
			/>
			<FormFileDropzone
				name="FILE"
				label="Upload Service Account File"
				extensions={[".json"]}
				disabled={form.formState.isSubmitting}
			/>
			<FormActions
				isSubmitting={form.formState.isSubmitting}
				onCancel={() => navigate(-1)}
				submitLabel="Create"
			/>
		</Form>
	);
};
