import * as http from "node:http";
import * as https from "node:https";
import { Env, Insight, upload } from "@semoss/sdk";
import type { InstanceConfig } from "../types.js";
import { initializeAndTestInsight } from "./insightHelpers.js";
import { getDefaultLogger } from "./logger.js";

/**
 * Download a file using Node.js http/https
 */
export async function downloadWithHttp(
	downloadUrl: string,
	accessKey: string,
	secretKey: string,
): Promise<ArrayBuffer> {
	const logger = getDefaultLogger();
	return new Promise((resolve, reject) => {
		logger.debug(`📡 Downloading via HTTP(S): ${downloadUrl}`);

		try {
			const parsedUrl = new URL(downloadUrl);
			const protocol = parsedUrl.protocol === "https:" ? https : http;

			// Create Basic auth header
			const credentials = Buffer.from(
				`${accessKey}:${secretKey}`,
			).toString("base64");

			const options = {
				hostname: parsedUrl.hostname,
				port:
					parsedUrl.port ||
					(parsedUrl.protocol === "https:" ? 443 : 80),
				path: parsedUrl.pathname + parsedUrl.search,
				method: "GET",
				headers: {
					Authorization: `Basic ${credentials}`,
				},
			};

			const req = protocol.request(options, (response) => {
				logger.debug(
					`📡 HTTP Response received - Status: ${response.statusCode}, Headers: ${JSON.stringify(response.headers)}`,
				);

				if (response.statusCode !== 200) {
					const errorMsg = `Download failed with status code: ${response.statusCode}`;

					const chunks: Buffer[] = [];
					response.on("data", (chunk: Buffer) => {
						chunks.push(chunk);
					});
					response.on("end", () => {
						const responseBody = Buffer.concat(
							chunks as Uint8Array[],
						).toString("utf-8");
						logger.debug(
							`📋 ERROR RESPONSE (${responseBody.length} bytes):\n${"=".repeat(80)}\n${responseBody}\n${"=".repeat(80)}`,
						);
						reject(new Error(errorMsg));
					});
					return;
				}

				const chunks: Buffer[] = [];

				response.on("data", (chunk: Buffer) => {
					chunks.push(chunk);
				});

				response.on("end", () => {
					const buffer = Buffer.concat(chunks as Uint8Array[]);
					logger.debug(`📦 Downloaded ${buffer.length} bytes`);
					const firstBytes = buffer.slice(0, 4).toString("hex");
					logger.debug(
						`📥 First 4 bytes (hex): ${firstBytes} (should start with "504b" for zip)`,
					);

					resolve(
						(buffer.buffer as ArrayBuffer).slice(
							buffer.byteOffset,
							buffer.byteOffset + buffer.byteLength,
						),
					);
				});

				response.on("error", (err) => {
					reject(err);
				});
			});

			req.on("error", (err) => {
				logger.debug(`❌ HTTP Request Error: ${err.message}`);
				reject(err);
			});

			req.end();
		} catch (err) {
			reject(err);
		}
	});
}

/**
 * Upload a downloaded project to a target SEMOSS instance
 */
export async function uploadAppToServer(
	instance: InstanceConfig,
	downloadResult: ArrayBuffer,
): Promise<void> {
	// Set up SDK environment with the target instance credentials
	Env.update({
		ACCESS_KEY: instance.accessKey,
		MODULE: instance.module,
		SECRET_KEY: instance.secretKey,
	});

	const insight = new Insight();
	await initializeAndTestInsight(insight);

	// Convert ArrayBuffer to File for upload
	const arrayBuffer = new ArrayBuffer(downloadResult.byteLength);
	const view = new Uint8Array(arrayBuffer);
	view.set(new Uint8Array(downloadResult));
	const file = new File([view], "project-export.zip", {
		type: "application/zip",
	});

	// Upload the file
	const uploaded = await upload(
		file as unknown as File | File[],
		insight.insightId,
		null,
		"",
	);

	// Import the uploaded project
	const { pixelReturn } = await insight.actions.run(
		`UploadProjectApp(filePath=["${uploaded[0].fileLocation}"], global=[false]);`,
	);

	const { operationType, output } = pixelReturn[0];
	if (String(operationType).includes("ERROR")) {
		throw new Error(`UploadProjectApp failed: ${String(output)}`);
	}
}

/**
 * Export an app from a source instance and download the zip as an ArrayBuffer
 */
export async function exportAppFromInstance(
	instance: InstanceConfig,
	appId: string,
): Promise<ArrayBuffer> {
	const logger = getDefaultLogger();

	// Set up SDK environment with the source instance credentials
	Env.update({
		ACCESS_KEY: instance.accessKey,
		MODULE: instance.module,
		SECRET_KEY: instance.secretKey,
	});

	const insight = new Insight();
	await initializeAndTestInsight(insight);

	const { pixelReturn } = await insight.actions.run<[string]>(
		`ExportProjectApp(project=['${appId}']);`,
	);
	const { operationType: exportOpType, output: exportOutput } =
		pixelReturn[0];

	if (!exportOpType?.includes("FILE_DOWNLOAD")) {
		throw new Error(
			"ExportProjectApp did not return a FILE_DOWNLOAD operation",
		);
	}

	const downloadUrl = `${instance.module}/api/engine/downloadFile?insightId=${insight.insightId}&fileKey=${encodeURIComponent(exportOutput)}`;

	logger.debug(`Downloading exported app from ${instance.module}...`);

	return await downloadWithHttp(
		downloadUrl,
		instance.accessKey || "",
		instance.secretKey || "",
	);
}
