import { Env, get, post } from "@semoss/sdk/react";
import { Role } from "@/types";

export const getEngines = async (
  admin: boolean,
  search: string,
  engineType: string,
  offset?: number,
  limit?: number
) => {
  let url = `${Env.MODULE}/api/auth/`;
  if (admin) {
    url += "admin/";
  }
  url += "engine/getEngines?";
  url += `engineTypes=${engineType}`;
  search ? (url += `&filterWord=${search}`) : "";
  offset ? (url += `&offset=${offset}`) : "";
  limit ? (url += `&limit=${limit}`) : "";
  // get the response
  const response = await get<Record<string, any>[]>(url).catch((error) => {
    throw Error(error);
  });
  // there was no response, that is an error
  if (!response) {
    throw Error("No Response to get Apps");
  }
  return response.data;
};

export const getUserEnginePermission = async (id: string) => {
  const response = await get<{
    permission: Role;
  }>(
    `${Env.MODULE}/api/auth/engine/getUserEnginePermission?engineId=${id}`
  ).catch((error) => {
    throw Error(error);
  });
  // there was no response, that is an error
  if (!response) {
    throw Error("No roles for the app user");
  }
  return response.data;
};

export const getEngineUsers = async (
  admin: boolean,
  databaseId: string,
  user: string,
  permission: string,
  offset?: number,
  limit?: number,
  projectId?
) => {
  let url = `${Env.MODULE}/api/auth/`;
  if (admin) {
    url += "admin/";
  }

  url += "engine/getEngineUsers?";
  url += `engineId=${databaseId}`;
  user ? (url += `&searchTerm=${user}`) : "";
  permission ? (url += `&permission=${permission}`) : "";
  offset ? (url += `&offset=${offset}`) : "";
  limit ? (url += `&limit=${limit}`) : "";

  // get the response
  const response = await get<{
    members: {
      id: string;
      name: string;
      permission: string;
    }[];
    totalMembers: number;
  }>(url).catch((error) => {
    throw Error(error);
  });
  // there was no response, that is an error
  if (!response) {
    throw Error("No Response to get users associated with app");
  }
  console.warn(
    "Project Id is not a necessary param, optional due to the similarity of usage for getInsightUsers",
    projectId
  );
  return response.data;
};

export const getEngineUsersNoCredentials = async (
  admin: boolean,
  engineId: string,
  limit: number,
  offset: number,
  searchTerm: string
) => {
  let url = `${Env.MODULE}/api/auth/`;
  // Currently no admin ENDPOINT;
  if (admin) {
    url += "admin/";
  }
  url += `engine/getEngineUsersNoCredentials?engineId=${engineId}&limit=${limit}&offset=${offset}&searchTerm=${searchTerm}`;
  // get the response
  const response = await get<
    {
      id: string;
      email: string;
      name: string;
      type: string;
      username: string;
    }[]
  >(url).catch((error) => {
    throw Error(error);
  });
  // there was no response, that is an error
  if (!response) {
    throw Error("No Response to get non credentialed users");
  }
  return response;
};

export const addEngineUserPermissions = async (
  admin: boolean,
  appId: string,
  users: any[]
) => {
  let url = `${Env.MODULE}/api/auth/`;
  // No Admin endpoint currently
  if (admin) {
    url += "admin/";
  }
  url += "engine/addEngineUserPermissions";
  const postData = {
    engineId: appId,
    userpermissions: users,
  };

  const response = await post<{
    success: boolean;
  }>(url, postData, {
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
  });
  return response;
  // figure out whether we want to do .catch here
};

export const removeEngineUserPermissions = async (
  admin: boolean,
  appId: string,
  users: any[]
) => {
  let url = `${Env.MODULE}/api/auth/`;
  if (admin) {
    url += "admin/";
  }
  url += "engine/removeEngineUserPermissions";
  const postData = {
    engineId: appId,
    userpermissions: users,
  };

  const response = await post<{
    success: boolean;
  }>(url, postData, {
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
  });
  return response;
};

export const setEngineGlobal = async (
  admin: boolean,
  engineId: string,
  global: boolean
) => {
  let url = `${Env.MODULE}/api/auth/`;
  if (admin) {
    url += "admin/";
  }
  // change to database
  url += "engine/setEngineGlobal";
  const postData = {
    engineId: encodeURIComponent(engineId),
    global: encodeURIComponent(global),
  };
  const postRecordData = processPostData(postData);
  const response = await post<{
    success: boolean;
  }>(url, postRecordData, {}).catch((error) => {
    throw Error(error);
  });
  return response;
};

export const setEngineVisiblity = async (
  admin: boolean,
  engineId: string,
  visible: boolean
) => {
  let url = `${Env.MODULE}/api/auth/`;
  if (admin) {
    url += "admin/";
  }
  url += "engine/setEngineDiscoverable";
  const postData = {
    engineId: engineId,
    discoverable: visible,
  };

  const response = await post<{
    success: boolean;
  }>(url, postData, {
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
  });
  return response;
};

export const setEngineFavorite = async (
  engineId: string,
  favorite: boolean
) => {
  let url = `${Env.MODULE}/api/auth/`;
  url += "engine/setEngineFavorite";
  const postData = {
    engineId: engineId,
    isFavorite: favorite,
  };

  const response = await post<{
    success: boolean;
  }>(url, processPostData(postData), {
    // headers: {
    //   "content-type": "application/x-www-form-urlencoded",
    // },
  });
  return response;
};

export const approveEngineUserAccessRequest = async (
  admin: boolean,
  engineId: string,
  requests: any[]
) => {
  let url = `${Env.MODULE}/api/auth/`;
  if (admin) {
    url += "admin/";
  }
  url += "engine/approveEngineUserAccessRequest";
  const postData = {
    engineId: engineId,
    requests: requests,
  };
  const response = await post<{
    success: boolean;
  }>(url, postData, {
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
  });
  return response;
};

export const denyEngineUserAccessRequest = async (
  admin: boolean,
  engineId: string,
  userIds: string[]
) => {
  let url = `${Env.MODULE}/api/auth/`;
  if (admin) {
    url += "admin/";
  }
  url += "engine/denyEngineUserAccessRequest";
  const postData = {
    engineId: engineId,
    requestIds: userIds,
  };
  const response = await post<{
    success: boolean;
  }>(url, postData, {
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
  });
  return response;
};

export const addEnginePermission = async (
  groupId: string,
  engineId: string,
  permission: number,
  type?: string,
  endDate?: string
) => {
  let url = `${Env.MODULE}/api/auth/admin/`;
  url += "group/addGroupEnginePermission";
  const postData = {
    groupId: groupId,
    engineId: engineId,
    permission: permission,
  };
  if (type) {
    postData["type"] = type;
  }
  if (endDate) {
    postData["endDate"] = endDate;
  }

  const response = await post<{
    success: boolean;
  }>(url, postData, {
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
  });
  return response;
};

export const editEnginePermission = async (
  groupId: string,
  engine: {
    engineid: string;
    permission: string;
    type?: string;
    endDate?: string;
  }
) => {
  let url = `${Env.MODULE}/api/auth/admin/`;
  url += "group/editGroupEnginePermission";
  const postData = {
    groupId: groupId,
    engineId: engine.engineid,
    permission: engine.permission,
  };
  if (engine.type) {
    postData["type"] = engine.type;
  }
  if (engine.endDate) {
    postData["endDate"] = engine.endDate;
  }

  const response = await post<{
    success: boolean;
  }>(url, postData, {
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
  });
  return response;
};

export const deleteEnginePermission = async (
  groupId: string,
  groupType: string,
  engine: {
    engineid: string;
    type?: string;
  }
) => {
  let url = `${Env.MODULE}/api/auth/admin/`;
  url += "group/removeGroupEnginePermission";
  const postData = {
    groupId: groupId,
    engineId: engine.engineid,
  };
  if (groupType) {
    postData["type"] = engine.type;
  }

  const response = await post<{
    success: boolean;
  }>(url, postData, {
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
  });
  return response;
};

const processPostData = (data: any) => {
  let postRecordData: Record<string, unknown> = {};
  Object.keys(data).forEach((item) => {
    postRecordData[item] = data[item];
  });
  return postRecordData;
};
