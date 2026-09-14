import {
	createViteConfig,
	DEV_SERVER_PORTS,
	localeManualChunks,
} from "@semoss/config";

export default createViteConfig({
	rootDir: import.meta.dirname,
	port: DEV_SERVER_PORTS.terminal,
	manualChunks: localeManualChunks,
	define: (env, isProduction) => ({
		"import.meta.env.ACCESS_KEY": isProduction
			? undefined
			: JSON.stringify(env.ACCESS_KEY),
		"import.meta.env.SECRET_KEY": isProduction
			? undefined
			: JSON.stringify(env.SECRET_KEY),
	}),
});
