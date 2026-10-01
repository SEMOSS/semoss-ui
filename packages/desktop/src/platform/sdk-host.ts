import { Env } from "@semoss/sdk";
import { installNativeFetchBridge } from "@/api/transport";
import { moduleUrlFor } from "@/config/profiles";
import type { DesktopInstanceProfile, InstanceConfig } from "@/types";

export const configureSdkHost = (
	profile: DesktopInstanceProfile,
): (() => void) => {
	Env.update({
		MODULE: moduleUrlFor(profile),
	});
	return installNativeFetchBridge(profile);
};

export const updateSdkHostConfig = (config: InstanceConfig): void => {
	Env.update({ CSRF: Boolean(config.csrf) });
};
