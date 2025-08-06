import axios from "axios";
import { makeAutoObservable } from "mobx";

import { Env } from "@semoss/sdk/react";

import { Role } from "@/types";
import { RootStore } from "@/stores";

/**
 * Store that manages instances of the insights and handles applicaiton level querying
 */

/**
 * @deprecated Will be removed in future release, use SDK instead
 */
export class MonolithStore {
  private _root: RootStore;

  constructor(root: RootStore) {
    // register the root
    this._root = root;

    // make it observable
    makeAutoObservable(this);
  }

  // *********************************************************
  // Actions
  // *********************************************************
  /**
   * Get the config
   */
  async config() {
    // get the response
    const response = await axios
      .get<{
        logins: { [key: string]: unknown };
        /**
         * List of available providers (logins) that are available
         */
        availableProviders: {
          provider: string;
          name: string;
          isOauth: boolean;
        }[];
        [key: string]: unknown;
      }>(`${Env.MODULE}/api/config`)
      .catch((error) => {
        throw Error(error);
      });

    // there was an error, no response
    if (!response) {
      throw Error("No Config Response");
    }

    // save the config data
    return response.data;
  }

  /**
   * Run a pixel string
   *
   * @param insightID - insightID to execute the pixel against
   * @param pixel - pixel to execute
   */
  async run<O extends unknown[] | []>(insightID: string, pixel: string) {
    // build the expression
    let postData = "";

    postData += "expression=" + encodeURIComponent(pixel);
    if (insightID) {
      postData += "&insightId=" + encodeURIComponent(insightID);
    }

    const response = await axios
      .post<{
        insightID: string;
        pixelReturn: {
          isMeta: boolean;
          operationType: string[];
          additionalOutput: { output: string }[];
          output: O[number];
          pixelExpression: string;
          pixelId: string;
        }[];
      }>(`${Env.MODULE}/api/engine/runPixel`, postData, {
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
      })
      .catch((error) => {
        throw Error(error);
      });

    // there was no response, that is an error
    if (!response) {
      throw Error("No Pixel Response");
    }

    // collect the errors
    const errors: string[] = [];
    for (const p of response.data.pixelReturn) {
      const { output, operationType } = p;

      if (operationType.indexOf("ERROR") > -1) {
        errors.push(output as string);
      }
    }

    return {
      errors: errors,
      insightId: response.data.insightID,
      pixelReturn: response.data.pixelReturn,
    };
  }

  /**
   * Run a pixel off of the query insight
   *
   * @param pixel - pixel to execute
   */
  //TODO: switch to extend unknown
  async runQuery<O extends any[] | []>(pixel: string, insightId?: string) {
    const { configStore } = this._root;

    return this.run<O>(insightId ?? configStore.store.insightID, pixel);
  }

  /**
   * Download a file by using a unique key
   *
   * @param insightID - insightID to download the file
   * @param fileKey - id for the file to download
   */
  async download(insightID: string, fileKey: string) {
    return new Promise<void>((resolve) => {
      // create the download url
      const url = `${
        Env.MODULE
      }/api/engine/downloadFile?insightId=${insightID}&fileKey=${encodeURIComponent(
        fileKey
      )}`;

      // fake clicking a link
      const link: HTMLAnchorElement = document.createElement("a");

      link.href = url;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);

      // resolve the promise
      resolve();
    });
  }

  /**
   * Run a download a file off of the query insight
   *
   * @param fileKey - id for the file to download
   */
  async downloadQuery(fileKey: string) {
    const { configStore } = this._root;

    return this.download(configStore.store.insightID, fileKey);
  }

  /**
   * Allow the user to login
   *
   * @param username - username to login with
   * @param password - password to login with
   * @returns true if successful
   */
  async login(username: string, password: string): Promise<boolean> {
    const postData = `username=${encodeURIComponent(
      username
    )}&password=${encodeURIComponent(password)}&disableRedirect=true`;

    try {
      const response = await axios.post(
        `${Env.MODULE}/api/auth/login`,
        postData,
        {
          headers: {
            "content-type": "application/x-www-form-urlencoded",
          },
          validateStatus: () => true,
        }
      );

      if (response?.data?.errorMessage) {
        throw new Error(response.data.errorMessage);
      }

      return true;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Allow the user to login with lin otp
   *
   * @param username - username to login with
   * @param password - password to login with
   * @returns true if successful
   */
  async loginOTP(
    username: string,
    password: string
  ): Promise<"success" | "change-password"> {
    const postData = `username=${encodeURIComponent(
      username
    )}&pin=${encodeURIComponent(password)}&disableRedirect=true`;

    // track the status
    let status: "success" | "change-password" = "success";

    await axios
      .post(`${Env.MODULE}/api/auth/loginLinOTP`, postData, {
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
      })
      .catch((error) => {
        if (
          error.response &&
          error.response.status === 401 &&
          error.response.data &&
          error.response.data.requirePwdChange
        ) {
          status = "change-password";
          return;
        }

        // throw the message
        throw Error(error);
      });

    return status;
  }

  /**
   * Confirm the OTP from LinOTP
   *
   * @param otp - otp to login with
   * @returns true if successful
   */
  async confirmOTP(otp: string): Promise<boolean> {
    const postData = `otp=${encodeURIComponent(otp)}&disableRedirect=true`;

    await axios
      .post(`${Env.MODULE}/api/auth/loginLinOTP`, postData, {
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
      })
      .catch((error) => {
        // throw the message
        throw Error(error.response.data.errorMessage);
      });

    return true;
  }

  /**
   * Allow the user to login with lin otp
   *
   * @param username - username to login with
   * @param password - password to login with
   * @returns true if successful
   */
  async loginLDAP(
    username: string,
    password: string
  ): Promise<"success" | "change-password"> {
    const postData = `username=${encodeURIComponent(
      username
    )}&pin=${encodeURIComponent(password)}&disableRedirect=true`;

    // track the status
    let status: "success" | "change-password" = "success";

    await axios
      .post(`${Env.MODULE}/api/auth/loginLDAP`, postData, {
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
      })
      .catch((error) => {
        if (
          error.response &&
          error.response.status === 401 &&
          error.response.data &&
          error.response.data.requirePwdChange
        ) {
          status = "change-password";
          return;
        }

        // throw the message
        throw Error(error);
      });

    return status;
  }

  /**
   * @name createUser
   * @desc this call will run createUser endpoint
   * @param name, name of new user
   * @param username, username of new user
   * @param email, email of new user
   * @param password, password of new user
   * @param phone, phone of new user
   * @param phoneextension, phoneextension of new user
   * @param countrycode, countrycode of new user
   * @returns $http promise
   */
  async registerUser(
    name: string,
    username: string,
    email: string,
    password: string,
    phone: string,
    phoneextension: string,
    countrycode: string
  ) {
    const create: string =
      "name=" +
      encodeURIComponent(name) +
      "&username=" +
      encodeURIComponent(username) +
      "&email=" +
      encodeURIComponent(email) +
      "&password=" +
      encodeURIComponent(password) +
      "&phone=" +
      encodeURIComponent(phone) +
      "&phoneextension=" +
      encodeURIComponent(phoneextension) +
      "&countrycode=" +
      encodeURIComponent(countrycode);
    try {
      const response = await axios.post(
        `${Env.MODULE}/api/auth/createUser`,
        create,
        {
          headers: {
            "content-type": "application/x-www-form-urlencoded",
          },
          validateStatus: () => true,
        }
      );

      if (response.data?.errorMessage) {
        throw new Error(response.data.errorMessage);
      }
      return response.data;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  /**     *
   * @returns true if successful
   */
  async logout(): Promise<boolean> {
    await axios
      .get(`${Env.MODULE}/api/auth/logout/all`, {
        validateStatus: function (status) {
          return true;
        },
      })
      .catch((err) => {
        throw Error(err);
      });

    return true;
  }

  /**
   * Allow the user to login using oauth
   *
   * @param provider - provider to login with
   * @returns true if successful
   */
  async oauth(provider: string): Promise<boolean> {
    // check if the user is logged in
    const response = await axios
      .get<{ name: string }>(`${Env.MODULE}/api/auth/userinfo/${provider}`)
      .catch((error) => {
        throw Error(error);
      });

    //check if they are already logged in
    if (response.data && response.data.name) {
      return true;
    }

    return new Promise((resolve) => {
      const url = `${Env.MODULE}/api/auth/login/${provider}`;
      const popUpWindow = window.top.open(
        url,
        "_blank",
        "height=600,width=400,top=300,left=" + 600
      );

      // setup an interval to see if the popup window is closed or successful
      const interval = setInterval(async () => {
        try {
          if (
            !popUpWindow ||
            popUpWindow.closed ||
            popUpWindow.closed === undefined
          ) {
            clearInterval(interval);
          } else if (
            popUpWindow.document.location.href.indexOf(
              `${window.location.host}`
            ) > -1
          ) {
            clearInterval(interval);

            // close it
            popUpWindow.close();

            // try to get the info again
            const response = await this.oauth(provider);

            // close it
            resolve(response);
          }
        } catch (err) {
          // do nothing
          // this is to work around the blocked frame error that comes up
        }
      }, 1000);
    });
  }

  /**
   * @name getLoginProperties
   * @returns
   */
  async getLoginProperties() {
    const url = `${Env.MODULE}/api/auth/loginProperties`;

    const response = await axios.get(url).catch((error) => {
      throw Error(error);
    });

    return response.data;
  }

  async modifyLoginProperties(provider, properties) {
    const url = `${Env.MODULE}/api/auth/modifyLoginProperties/` + provider;
    let postData = "";

    postData += "modifications=" + JSON.stringify(properties);

    const response = await axios
      .post<boolean>(url, postData, {
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
      })
      .catch((error) => {
        throw Error(error);
      });

    return response.data;
  }

  /**
   * @name isAdminUser
   * @description Determines whether user is admin or
   * @returns boolean
   */
  async isAdminUser() {
    const url = `${Env.MODULE}/api/auth/admin/user/isAdminUser`;

    const response = await axios.get(url).catch((error) => {
      throw Error(error);
    });

    if (!response) {
      throw Error("No Response to isAdminUSer");
    }

    return response.data;
  }

  /**
   * @name createAdminTheme
   * @param data the data that will be sent to the BE to define a theme
   * @desc this call will create a new theme defined by the admin
   */
  async createAdminTheme(data: { name: string; json: any; isActive: boolean }) {
    const url = `${Env.MODULE}/api/themes/createAdminTheme`;

    let postData = "";

    postData += "name=" + encodeURIComponent(data.name);
    postData += "&json=" + encodeURIComponent(JSON.stringify(data.json));
    postData += "&isActive=" + encodeURIComponent(data.isActive);

    const response = await axios.post<boolean>(url, postData, {
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
    });

    return response.data;

    // Sets an Active theme with material ui properties
    // const map = JSON.parse(data['theme']['THEME_MAP']);
    // const material_map = {
    //     ...map,
    //     materialTheme: lightTheme,
    // };

    // console.log(JSON.stringify(material_map));
    // monolithStore.createAdminTheme({
    //     name: 'SEMOSS-TEST-DARK',
    //     isActive: true,
    //     json: material_map,
    // });
  }

  // ----------------------------------------------------------------------
  // Engine
  // ----------------------------------------------------------------------
  /**
   * @name getEngines
   * @param admin - is admin user
   * @returns AppInterface[]
   */
  async getEngines(
    admin: boolean,
    search: string,
    engineType: string,
    offset?: number,
    limit?: number
  ) {
    let url = `${Env.MODULE}/api/auth/`;

    if (admin) {
      url += "admin/";
    }

    url += "engine/getEngines";

    const params = {};

    params["engineTypes"] = engineType;
    search && (params["filterWord"] = search);

    offset && (params["offset"] = offset);

    limit && (params["limit"] = limit);

    // get the response
    const response = await axios
      .get(url, {
        params: params,
      })
      .catch((error) => {
        throw Error(error);
      });

    // there was no response, that is an error
    if (!response) {
      throw Error("No Response to get Apps");
    }

    return response.data;
  }

  /**
   * @name getUserEnginePermission
   * @desc Get a user's role for the engine
   * @param id - id of engine (db, storage, model)
   */
  async getUserEnginePermission(id: string) {
    const response = await axios
      .get<{ permission: Role }>(
        `${Env.MODULE}/api/auth/engine/getUserEnginePermission`,
        {
          params: { engineId: id },
        }
      )
      .catch((error) => {
        throw Error(error);
      });

    // there was no response, that is an error
    if (!response) {
      throw Error("No roles for the app user");
    }

    return response.data;
  }

  /**
   * @name approveEngineUserAccessRequest
   * @param admin
   * @param engineId
   * @param requests
   * @returns
   */
  async approveEngineUserAccessRequest(
    admin: boolean,
    engineId: string,
    requests: any[]
  ) {
    let url = `${Env.MODULE}/api/auth/`,
      postData = "";

    if (admin) {
      url += "admin/";
    }
    url += "engine/approveEngineUserAccessRequest";

    postData += "engineId=" + encodeURIComponent(engineId);
    postData += "&requests=" + encodeURIComponent(JSON.stringify(requests));

    const response = await axios.post<{ success: boolean }>(url, postData, {
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
    });

    return response;
  }

  // ----------------------------------------------------------------------
  // Database Level
  // ----------------------------------------------------------------------
  /**
   * @name getDatabases
   * @param admin - is admin user
   * @returns AppInterface[]
   */
  async getDatabases(admin: boolean) {
    let url = `${Env.MODULE}/api/auth/`;

    if (admin) {
      url += "admin/";
    }

    url += "database/getDatabases";
    // get the response
    const response = await axios
      .get<
        {
          app_global: boolean;
          app_id: string;
          app_name: string;
          app_permission: string;
          app_visibility: boolean;
        }[]
      >(url)
      .catch((error) => {
        throw Error(error);
      });

    // there was no response, that is an error
    if (!response) {
      throw Error("No Response to get Apps");
    }

    return response.data;
  }

  // ----- Users Start -----

  // ----- Users End -----

  // ----------------------------------------------------------------------
  // Teams Start
  // ----------------------------------------------------------------------

  
  /**
   * @name addTeam
   * @param groupId
   * @param description
   * @param type
   * @returns
   */
  async addTeam(groupId: string, description: string, type?: string) {
    let url = `${Env.MODULE}/api/auth/admin/`,
      postData = "";

    url += "group/addGroup";

    postData += "groupId=" + encodeURIComponent(groupId);
    postData += "&description=" + encodeURIComponent(description);
    if (type) {
      postData += "&type=" + encodeURIComponent(type);
    }

    const response = await axios.post<{ success: boolean }>(url, postData, {
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
    });

    return response;
  }

  /**
   * @name editTeam
   * @param groupId
   * @param description
   * @param type
   * @returns
   */
  async editTeam(
    groupId: string,
    description: string,
    type?: string,
    previousTeamName?: string,
    previousType?: string
  ) {
    let url = `${Env.MODULE}/api/auth/admin/`,
      postData = "";

    url += "group/editGroupDetails";

    postData += "groupId=" + encodeURIComponent(previousTeamName);
    postData += "&newGroupId=" + encodeURIComponent(groupId);
    postData += "&newDescription=" + encodeURIComponent(description);
    postData += "&type=" + encodeURIComponent(previousType);
    postData += "&newType=" + encodeURIComponent(type);

    const response = await axios.post<{ success: boolean }>(url, postData, {
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
    });

    return response;
  }

  /**
   * @name deleteTeam
   * @param groupId
   * @param description
   * @param type
   * @returns
   */
  async deleteTeam(groupid: string, type?: string) {
    let url = `${Env.MODULE}/api/auth/admin/`,
      postData = "";

    url += "group/deleteGroup";

    postData += "groupId=" + encodeURIComponent(groupid);

    if (type) {
      postData += "&type=" + encodeURIComponent(type);
    }

    const response = await axios.post<{ success: boolean }>(url, postData, {
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
    });

    return response;
  }

  /**
   * @name getTeamUsers
   * @param groupId
   * @param limit
   * @param offSet
   * @param searchTerm
   */
  async getTeamUsers(
    groupId: string,
    limit: number,
    offset: number,
    searchTerm: string
  ) {
    let url = `${Env.MODULE}/api/auth/admin/`;

    url += "group/getGroupMembers";

    const params = {};

    groupId && (params["groupId"] = groupId);
    limit && (params["limit"] = limit);
    offset && (params["offset"] = offset);
    searchTerm && (params["searchTerm"] = searchTerm);

    const response = await axios
      .get(url, {
        params: params,
      })
      .catch((error) => {
        throw Error(error);
      });

    // there was no response, that is an error
    if (!response) {
      throw Error("No Response to get group members");
    }

    return response.data;
  }

  /**
   * @name editProjectPermission
   * @param groupId
   * @param type
   * @param projectId
   * @param permission
   * @param endDate
   * @returns
   */
  async editProjectPermisison(
    groupId: string,
    groupType: string,
    project: {
      projectid: string;
      permission: number;
      project_type?: string;
      endDate?: string;
    }
  ) {
    let url = `${Env.MODULE}/api/auth/admin/`,
      postData = "";

    url += "group/editGroupProjectPermission";

    postData += "groupId=" + encodeURIComponent(groupId);
    postData += "&projectId=" + encodeURIComponent(project.projectid);
    postData += "&permission=" + encodeURIComponent(project.permission);

    if (groupType) {
      postData += "&type=" + encodeURIComponent(groupType);
    }
    if (project.endDate) {
      postData += "&endDate=" + encodeURIComponent(project.endDate);
    }

    const response = await axios.post<{ success: boolean }>(url, postData, {
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
    });

    return response;
  }

  /**
   * @name deleteProjectPermission
   * @param groupId
   * @param type
   * @param projectId
   * @returns
   */
  async deleteProjectPermission(
    groupId,
    groupType: string,
    project: {
      projectid: string;
      group_type?: string;
    }
  ) {
    let url = `${Env.MODULE}/api/auth/admin/`,
      postData = "";

    url += "group/removeGroupProjectPermission";

    postData += "groupId=" + encodeURIComponent(groupId);
    postData += "&projectId=" + encodeURIComponent(project.projectid);
    if (groupType) {
      postData += "&type=" + encodeURIComponent(groupType);
    }

    const response = await axios.post<{ success: boolean }>(url, postData, {
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
    });

    return response;
  }

  /**
   * @name getTeamProjects
   * @param groupId
   * @param limit
   * @param offSet
   * @param searchTerm
   */
  async getTeamProjects(
    groupId: string,
    groupType: string,
    limit: number,
    offset: number,
    searchTerm: string,
    onlyApps: boolean,
    type?: string
  ) {
    let url = `${Env.MODULE}/api/auth/admin/`;

    url += "group/getProjectsForGroup";

    const params = {};

    groupId && (params["groupId"] = groupId);
    groupType && (params["groupType"] = groupType);
    limit && (params["limit"] = limit);
    offset && (params["offset"] = offset);
    searchTerm && (params["searchTerm"] = searchTerm);

    // searchTerm
    //     ? (params['searchTerm'] = searchTerm)
    //     : (params['searchTerm'] = '');
    onlyApps && (params["onlApps"] = onlyApps);
    type ? (params["type"] = type) : (params["type"] = null);

    const response = await axios
      .get(url, {
        params: params,
      })
      .catch((error) => {
        throw Error(error);
      });

    // there was no response, that is an error
    if (!response) {
      throw Error("No Response to get group members");
    }

    return response.data;
  }

  /**
   * @name getUnassignedTeamProjects
   * @param groupId
   * @param limit
   * @param offSet
   * @param searchTerm
   */
  async getUnassignedTeamProjects(
    groupId: string,
    groupType: string,
    limit: number,
    offset: number,
    searchTerm: string
  ) {
    let url = `${Env.MODULE}/api/auth/admin/`;

    url += "group/getAvailableProjectsForGroup";

    const params = {};

    groupId && (params["groupId"] = groupId);
    groupType && (params["groupType"] = groupType);
    limit && (params["limit"] = limit);
    offset && (params["offset"] = offset);
    searchTerm && (params["searchTerm"] = searchTerm);

    const response = await axios
      .get(url, {
        params: params,
      })
      .catch((error) => {
        throw Error(error);
      });

    // there was no response, that is an error
    if (!response) {
      throw Error("No Response to get group members");
    }

    return response.data;
  }

  // ---------- Teams End -----------------

  // ----------------------------------------------------------------------
  // Project Level
  // ----------------------------------------------------------------------
  // ----------------------------------------------------------------------
  // Insight Level
  // ----------------------------------------------------------------------

  async getInsights() {
    console.error("needs to be added on BE");
  }

  // Verified Project Member actions

  async uploadFile(
    files: File[],
    insightId: string | null,
    projectId?: string | null,
    path?: string | null
  ) {
    let param = "";
    if (insightId || projectId || path) {
      if (insightId) {
        if (param.length > 0) {
          param += "&";
        }
        param += `insightId=${insightId}`;
      }

      if (projectId) {
        if (param.length > 0) {
          param += "&";
        }
        param += `projectId=${projectId}`;
      }

      if (path) {
        if (param.length > 0) {
          param += "&";
        }
        param += `path=${path}`;
      }

      param = `?${param}`;
    }

    const url = `${Env.MODULE}/api/uploadFile/baseUpload${param}`,
      fd: FormData = new FormData();

    if (Array.isArray(files)) {
      for (let i = 0; i < files.length; i++) {
        fd.append("file", files[i]);
      }
    } else {
      // pasted data
      fd.append("file", files);
    }

    const response = await axios.post<
      {
        fileName: string;
        fileLocation: string;
      }[]
    >(url, fd, {
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
    });

    return response.data;
  }

  async uploadImage(
    files: File[],
    projectId: string | null,
    insightId?: string | null
  ) {
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
    } else {
      const { configStore } = this._root;
      fd.append("insightId", configStore.store.insightID);
    }

    if (projectId) {
      fd.append("projectId", projectId);
    }

    const response = await axios.post<
      {
        app_id: string;
        app_name: string;
        message: string;
      }[]
    >(url, fd, {
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
    });

    return response.data;
  }

  // ----------------------------------------------------------------------
  // Member Level
  // ----------------------------------------------------------------------

  /**
   * @name createUser
   * @param admin
   * @param user
   * @returns
   */
  async createUser(admin: boolean, user: any) {
    let url = `${Env.MODULE}/api/auth/`;

    if (admin) {
      url += "admin/";
    }
    url += "user/registerUser";

    let newUserInfo = "";

    if (user.id) {
      newUserInfo += "userId=" + encodeURIComponent(user.id);
    }
    if (user.type) {
      newUserInfo += "&type=" + encodeURIComponent(user.type);
    }
    if (user.type === "NATIVE") {
      newUserInfo += "&username=" + encodeURIComponent(user.id);
    } else if (user.username) {
      newUserInfo += "&username=" + encodeURIComponent(user.username);
    }
    if (user.password) {
      newUserInfo += "&password=" + encodeURIComponent(user.password);
    }
    if (user.admin) {
      newUserInfo += "&admin=" + encodeURIComponent(user.admin);
    }
    if (user.publisher) {
      newUserInfo += "&publisher=" + encodeURIComponent(user.publisher);
    }
    if (user.exporter) {
      newUserInfo += "&exporter=" + encodeURIComponent(user.exporter);
    }
    if (user.name) {
      newUserInfo += "&name=" + encodeURIComponent(user.name);
    }
    if (user.email) {
      newUserInfo += "&email=" + encodeURIComponent(user.email);
    }
    if (user.phone) {
      newUserInfo += "&phone=" + encodeURIComponent(user.phone);
    }
    if (user.phoneextension) {
      newUserInfo +=
        "&phoneextension=" + encodeURIComponent(user.phoneextension);
    }

    if (user.model_usage_restriction) {
      if (user.model_usage_restriction === "null") {
        user.model_usage_restriction = null;
      }
      newUserInfo +=
        "&modelUsageRestriction=" +
        encodeURIComponent(user.model_usage_restriction);
    }
    if (user.model_usage_frequency) {
      newUserInfo +=
        "&modelUsageFrequency=" +
        encodeURIComponent(user.model_usage_frequency);
    }
    if (user.model_max_tokens) {
      newUserInfo +=
        "&modelMaxTokens=" + encodeURIComponent(user.model_max_tokens);
    }
    if (user.model_max_response_time) {
      newUserInfo +=
        "&modelMaxResponseTime=" +
        encodeURIComponent(user.model_max_response_time);
    }

    const response = await axios.post<boolean>(url, newUserInfo, {
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
    });

    return response;
  }
}

