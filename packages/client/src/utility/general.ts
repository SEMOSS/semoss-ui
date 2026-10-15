import { Env } from "@semoss/sdk/react";
import { toast } from "@semoss/ui/next";
import { copyTextToClipboard as copyText } from "@semoss/utility/clipboard";
import { getErrorMessage } from "@semoss/utility/error";

export { isOutputJSON } from "@semoss/utility/json";
export { splitAtPeriod, toTitleCase } from "@semoss/utility/text";

/**
 * @desc Copies string to clipboard
 */
export const copyTextToClipboard = async (text: string): Promise<void> => {
	try {
		await copyText(text);
		toast.success("Successfully copied to clipboard");
	} catch (error) {
		toast.error(getErrorMessage(error));
	}
};

export const getSDKSnippet = (
	type: "py" | "js",
	accessKey?: string,
	secretKey?: string,
) => {
	if (type === "py") {
		return `# import the ai platform package
import ai_server

# pass in your access and secret keys to authenticate
server_connection=ai_server.ServerClient(
    access_key="${accessKey ? accessKey : "<your access key>"}",
    secret_key="${secretKey ? secretKey : "<your secret key>"}",
    base="${Env.MODULE}/api"
)`;
	} else {
		return `# .env
MODULE="${Env.MODULE}"

#.env.local
ACCESS_KEY="${accessKey ? accessKey : "<your access key>"}"
SECRET_KEY="${secretKey ? secretKey : "<your secret key>"}"`;
	}
};

export { formatToDataTestId } from "@semoss/utility/text";
