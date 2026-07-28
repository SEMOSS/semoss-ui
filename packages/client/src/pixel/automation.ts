export const listAutomationRuns = (appId: string, limit = 25) =>
	`ListAutomationRuns(project=["${appId}"], limit=[${limit}]);`;

export const getAutomation = (appId: string) =>
	`GetAutomation(project=["${appId}"])`;

export const myEngines = () =>
	`MyEngines(engineTypes=["DATABASE","MODEL","VECTOR","STORAGE","FUNCTION"], limit=[100]);`;

export const myProjects = () => `MyProjects(limit=[100], offset=[0]);`;

export const getAutomationConfig = (appId: string) =>
	`GetAutomationConfig(project=["${appId}"]);`;

export const getAutomationRun = (appId: string, runId: string) =>
	`GetAutomationRun(project=["${appId}"], runId=["${runId}"]);`;

export const triggerAutomation = (appId: string) =>
	`TriggerAutomation(project=["${appId}"], manual=["true"]);`;

export const saveAutomation = (appId: string, json: string) =>
	`SaveAutomation(project=["${appId}"], json=["${json}"]);`;

export const saveAutomationConfig = (appId: string, json: string) =>
	`SaveAutomationConfig(project=["${appId}"], config=["${json}"]);`;

export const cancelAutomationRun = (appId: string, runId: string) =>
	`CancelAutomationRun(project=["${appId}"], runId=["${runId}"]);`;
