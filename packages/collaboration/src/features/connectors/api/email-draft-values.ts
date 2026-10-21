import { z } from "@semoss/ui/next";
import { parseAddresses } from "./microsoft";

const addresses = z.string().refine((value) => {
	try {
		parseAddresses(value);
		return true;
	} catch {
		return false;
	}
}, "Enter email addresses separated by commas.");
export const emailDraftSchema = z.object({
	to: addresses,
	cc: addresses,
	bcc: addresses,
	subject: z.string(),
	body: z.string(),
	replyAll: z.boolean(),
	files: z.array(z.object({ id: z.string(), file: z.instanceof(File) })),
});
export type EmailDraftValues = z.infer<typeof emailDraftSchema>;
