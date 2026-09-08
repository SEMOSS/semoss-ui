import { Env, get, post, runPixel } from "@semoss/sdk";

interface CreateAppFromTemplateOptions {
	/** Display name for the cloned project. */
	name: string;
	/** Optional project ID of the source template. */
	templateId?: string;
	/** Whether the cloned project is globally visible. */
	isGlobal: boolean;
	/** Optional project description. */
	description?: string;
}

/**
 * Create an app project from a template and optionally set its description.
 * @param options - Clone configuration.
 * @return The new project ID.
 */
export const createAppFromTemplate = async (
	options: CreateAppFromTemplateOptions,
): Promise<string> => {
	const name = options.name.trim();
	const response = await runPixel<[{ project_id?: string }]>(
		options.templateId
			? `CreateAppFromTemplate(project=[${JSON.stringify(name)}], projectTemplate=[${JSON.stringify(options.templateId)}], global=[${JSON.stringify(String(options.isGlobal))}]);`
			: `CreateProject(project=[${JSON.stringify(name)}], global=[${JSON.stringify(String(options.isGlobal))}], projectType=["CODE"], portal=[true]);`,
	);

	if (response.errors.length > 0) {
		throw new Error(response.errors.join(""));
	}

	const projectId = response.pixelReturn[0]?.output?.project_id;
	if (!projectId) {
		throw new Error("CreateAppFromTemplate did not return a project ID");
	}

	const description = options.description?.trim();
	if (description) {
		const metadataResponse = await runPixel<[boolean]>(
			`SetProjectMetadata(project=[${JSON.stringify(projectId)}], meta=[${JSON.stringify({ description })}]);`,
		);

		if (metadataResponse.errors.length > 0) {
			throw new Error(metadataResponse.errors.join(""));
		}
	}

	return projectId;
};

export const setProjectFavorite = async (
	projectId: string,
	favorite: boolean,
) => {
	let url = `${Env.MODULE}/api/auth/`;

	const postData: Record<string, unknown> = {
		projectId: projectId,
		isFavorite: favorite,
	};
	url += "project/setProjectFavorite";

	const response = await post<{
		success: boolean;
	}>(url, processPostData(postData), {});
	return response;
};

export const addProject = async (
	groupId: string,
	projectId: string,
	permission: number,
	type?: string,
	endDate?: string,
) => {
	let url = `${Env.MODULE}/api/auth/admin/`;
	url += "group/addGroupProjectPermission";
	let postData: Record<string, unknown> = {
		groupId: groupId,
		projectId: projectId,
		permission: permission,
	};
	if (type) {
		postData = {
			...postData,
			type: type,
		};
	}
	if (endDate) {
		postData = {
			...postData,
			endDate: endDate,
		};
	}

	const response = await post<{
		success: boolean;
	}>(url, postData, {});
	return response;
};

export const editProjectPermisison = async (
	groupId: string,
	groupType: string,
	project: {
		projectid: string;
		permission: number;
		project_type?: string;
		endDate?: string;
	},
) => {
	let url = `${Env.MODULE}/api/auth/admin/`;
	url += "group/editGroupProjectPermission";
	let postData: Record<string, unknown> = {
		groupId: groupId,
		projectId: project.projectid,
		permission: project.permission,
	};
	if (groupType) {
		postData = {
			...postData,
			type: project.project_type,
		};
	}
	if (project.endDate) {
		postData = {
			...postData,
			endDate: project.endDate,
		};
	}

	const response = await post<{
		success: boolean;
	}>(url, postData, {});
	return response;
};

export const deleteProjectPermission = async (
	groupId,
	groupType: string,
	project: {
		projectid: string;
		group_type?: string;
	},
) => {
	let url = `${Env.MODULE}/api/auth/admin/`;
	url += "group/removeGroupProjectPermission";
	let postData: Record<string, unknown> = {
		groupId: groupId,
		projectId: project.projectid,
	};
	if (groupType) {
		postData = {
			...postData,
			type: groupType,
		};
	}
	const response = await post<{
		success: boolean;
	}>(url, processPostData(postData), {});
	return response;
};

export const getProjects = async (
	admin: boolean,
	search?: string,
	offset?: number,
	limit?: number,
) => {
	let url = `${Env.MODULE}/api/auth/`;
	if (admin) {
		url += "admin/";
	}
	url += "project/getProjects?";
	url += search ? `&filterWord=${search}` : "";
	url += offset ? `&offset=${offset}` : "";
	url += limit ? `&limit=${limit}` : "";
	const response = await get<
		{
			project_global: boolean;
			project_id: string;
			project_name: string;
			project_display_name?: string;
			project_type?: string;
			project_permission: string;
			project_visibility: boolean;
		}[]
	>(url).catch((error) => {
		throw Error(error);
	});
	// there was no response, that is an error
	if (!response) {
		throw Error("No Response to get Projects");
	}
	return response.data;
};

export const setProjectGlobal = async (admin, appId, global: boolean) => {
	let url = `${Env.MODULE}/api/auth/`;
	const postData = {
		projectId: appId,
		public: global,
	};
	if (admin) {
		url += "admin/";
	}
	url += "project/setProjectGlobal";

	const response = await post<{
		success: boolean;
	}>(url, postData, {});
	return response;
};

export const setProjectTemplate = async (
	admin: boolean,
	appId: string,
	isTemplate: boolean,
) => {
	let url = `${Env.MODULE}/api/auth/`;
	const postData = {
		projectId: appId,
		template: isTemplate,
	};
	if (admin) {
		url += "admin/";
	}
	url += "project/setProjectTemplate";

	return post<{ success: boolean }>(url, postData, {});
};

export const setProjectVisiblity = async (admin, appId, visible) => {
	let url = `${Env.MODULE}/api/auth/`;

	const postData = {
		projectId: appId,
		discoverable: visible,
	};
	if (admin) {
		url += "admin/";
	}
	url += "project/setProjectDiscoverable";

	const response = await post<{
		success: boolean;
	}>(url, postData, {});
	return response;
};

export const uploadImage = async (
	files: File[],
	projectId: string | null,
	insightId?: string | null,
) => {
	const url = `${Env.MODULE}/api/images/projectImage/upload`,
		fd: FormData = new FormData();

	if (Array.isArray(files)) {
		for (let i = 0; i < files.length; i++) {
			fd.append("file", files[i]);
		}
	} else {
		// pasted data
		fd.append("file", files);
	}

	if (insightId) {
		fd.append("insightId", insightId);
	}

	if (projectId) {
		fd.append("projectId", projectId);
	}

	const response = await post<
		{
			app_id: string;
			app_name: string;
			message: string;
		}[]
	>(url, fd, {});

	return response.data;
};

const processPostData = (data: Record<string, unknown>) => {
	const postRecordData: Record<string, unknown> = {};
	Object.keys(data).forEach((item) => {
		postRecordData[item] = data[item];
	});
	return postRecordData;
};

export const updateProjectSmssProperties = async (
	projectId: string,
	smssProps: string,
) => {
	return await post<{
		success: boolean;
	}>(
		`${Env.MODULE}/api/project-${projectId}/updateSmssFile`,
		{
			smss: smssProps,
			engineId: projectId,
		},
		{},
	);
};
