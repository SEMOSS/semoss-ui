import type {
	DesktopInstanceProfile,
	DesktopUser,
	InstanceConfig,
} from "@/types";
import { runPixel } from "./pixel";

interface UserInfo {
	id?: string;
	name?: string;
	email?: string;
	lastLogin?: string;
}

export const fetchCurrentUser = async (
	profile: DesktopInstanceProfile,
	config: InstanceConfig,
): Promise<DesktopUser> => {
	const { outputs } = await runPixel<Record<string, UserInfo>>(
		profile,
		config,
		"META | GetUserInfo(); META | GetUserMetadata();",
	);
	const output = (outputs[0] || {}) as Record<string, UserInfo>;
	const provider = Object.entries(output)[0];

	if (!provider) {
		throw new Error("The instance returned no authenticated user.");
	}

	const [providerName, user] = provider;
	const metadata = (outputs[1] || {}) as Record<string, string | string[]>;
	const modelMetadata = metadata["text-generation-model"];
	return {
		id: user.id || "",
		name: user.name || user.email || "User",
		email: user.email || "",
		provider: providerName,
		lastLogin: user.lastLogin,
		defaultTextGenerationModelId: Array.isArray(modelMetadata)
			? modelMetadata[0] || ""
			: modelMetadata || "",
	};
};
