import { createViteConfig, DEV_SERVER_PORTS } from "@semoss/config";

export default createViteConfig({
	rootDir: import.meta.dirname,
	port: DEV_SERVER_PORTS.auditlog,
	enableSvgr: true,
});
