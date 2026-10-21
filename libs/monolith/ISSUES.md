# Backend issues

These were found while syncing `@semoss/monolith` with Monolith. Each line names the
endpoint. The [sync skill](../../skills/semoss-sync.skill.md) adds new findings
here and removes ones that have been fixed. Response shapes marked
`@remarks Unverified response shape.` in the code are listed under each resource.

## `/api/auth/project`, `/api/auth/engine`, `/api/auth/insight`

- **Unverified shape:** `getProjectUsersNoCredentials` and `getEngineUsersNoCredentials` in Microsoft-directory mode (`MsGraphUtility.nextPage`).
  - Directory lookup is on by default when it's enabled.
  - A non-zero `offset` continues a search whose paging state is kept in the session.
- **GET and POST duplicates:** `getProjects` / `getProjectsPost` and `getEngines` / `getEnginesPost`.
  - Only the POST reads `metaFilters`; the GET parameter is commented out.
  - Neither one passes `effectivePermissions`, `createdBy`, `createdByMe`, the type sort or `onlyTemplates`, even though the reactors support them.
  - The project POST ignores `onlyFavorites`.
- `GET /api/auth/insight/getProjectInsights`:
  - Owner rows use the key `CONSTANT_OWNER` instead of `permission`, because of an unaliased `QueryConstantSelector`.
  - It returns `[]` with no error when the caller has read-only access or none.
- `POST /api/auth/engine/setEngineDiscoverable` checks `adminOnlyEngineSetPublic` and returns 403 with the message "User session is invalid".
- `POST /api/auth/insight/setInsightFavorite` declares an extra unannotated `String appId` entity parameter next to the form. Two entity parameters is invalid or fragile in JAX-RS. The parameter is unused.
- **Unused query parameters:** `searchTerm` on `getUserProjectPermission` and on `getProjectInsights`.
- `GET /api/auth/insight/getInsightUsers`:
  - `userId` is really a search term (it matches id, name, username and email).
  - Member rows have no `type` or `end_date`, unlike project and engine members.
- **Inconsistent field names:** project deny uses `requestids`; engine and insight deny use `requestIds`.
- **Inconsistent `endDate`:**
  - Project endpoints read a top-level `endDate`.
  - Engine and insight endpoints hard-code it to `null`, except the engine bulk add and edit, which read `endDate` on each row.
- `POST /api/auth/insight/addInsightUserPermissions` returns 400 instead of 403 when the caller has no permission.
- The single-user insight add, edit and remove endpoints skip the `adminOnlyInsightAddAccess` check that the bulk insight endpoints apply.
- `POST /api/auth/insight/addInsightUserPermission` silently adds the target user to the project as READ_ONLY.
- **Inconsistent success bodies:**
  - `propagateProjectDependencyPermission` returns `{ "Successfully processed permission propagation": true }`.
  - The `set*Visibility`, `setProjectFavorite` and `setEngineFavorite` endpoints return a bare `true`.
  - `setInsightFavorite` returns `{ success: true }`.
- **Approval batches ignore each request's `type`:** `approvalChanges` passes a null type. Notifications still use the type.
- `GET /api/auth/insight/getInsights` takes `limit` and `offset` as strings, with no numeric validation.
- **Legacy duplicate keys:**
  - Engine rows repeat `app_*` and `database_*` aliases.
  - Insight rows repeat `app_id`, `app_name` and `app_insight_id`; the backend has a TODO to remove them.
- **`userT` is a no-op on project lists:** the vote code is commented out.
- **Loose favorite types:** `*_favorite` columns come from a coalesce to 0, so they are typed `boolean | number`.

## `/api/auth` (UserResource), config, session, themes, form, health, token, adminconfig

- **Security, `/api/form/*`:** `throwErrorIfNotAdmin` and `throwErrorIfNotSysAdmin` throw inside their own `try/catch(Exception)`, so the admin checks never fail. Any CAC or SAML user can call `modifyUserAccess`, `renameInstance` and `certifyInstance`.
- **Security, `GET /token/getToken`:** hands out an IP-bound token with no credentials when API-user token checking is off.
- **Security, `GET /api/auth/loginProperties` and `getAllLoginProperties`:** return `social.properties`, including OAuth client secrets, to admins.
- **Security:** `FormResource` queries and `AdminThemeUtils.setActiveTheme` build SQL by string concatenation, relying only on escaping.
- **Bug, `/token/getToken`:** in cluster mode `dateAdded` actually holds the IP address. `SecurityTokenUtils` returns `{ val, ipaddr, clientid }`.
- **Bug, `GET /api/themes/getAdminThemes`:** `Integer` limit and offset are unboxed to `int`, so leaving either out throws a NullPointerException (500). The wrapper makes both required.
- **Bug, `AdminStartupFilter`:** calls `sendError(302/404)` but doesn't return, so the filter chain still runs.
- **Bug, `SchedulerFilter`:** an invalid `-execId` returns an empty 200.
- **Bug, `GET /api/auth/login/producthunt`:** has `@Path` but no HTTP verb, so it acts as a sub-resource locator and the route is broken.
- **Errors returned with a 200:** `POST /adminconfig/setInitialAdmins` without `ids` returns 200 with `{ errorMessage }`. `GET /api/auth/userinfo/{provider}` also returns 200 with `{ errorMessage }` on failure.
- **`POST /api/form/modifyUserAccess`:** throws a NullPointerException when `addOrRemove` is missing.
- **`GET /api/form/getUserInstanceAuth`:** has the typo `@Produces("applicaiton/json")`.
- **Error bodies don't use `{ errorMessage }`:**
  - `/api/form/*` returns a bare JSON string.
  - `/api/themes/*` returns `{ error }`, or `false` with a 400.
  - `/api/session/*` returns `{ output: "Invalid session" }`.
  - The `/api/auth` login-property routes return a bare string with a 400, or a 401 for "not admin".
- **Logins redirect by default:** `login`, `loginLDAP`, `loginLinOTP` and `logout` redirect unless `disableRedirect=true`. A native login then follows a 302 to an HTML page instead of returning JSON. Callers should pass `disableRedirect: true`.
- **`POST /api/session/invalidateSession`:** always answers 302, so the promise always rejects. The wrapper clears the session in `.finally`.
- **Input mangling:** passwords (`login`, `loginLDAP`, `createUser`, `changeADPassword`) and theme `json` go through `inputSQLSanitizer`, which doubles `'`.
- **Unverified or loose shapes:**
  - `loginLinOTP` is unverified.
  - Loosely typed: `getConfig` pipeline and widget filters, `/api/schedule/executePixel` `output`, and the extra Microsoft Graph fields in `/api/authorization/searchForUser`.
- **GET and POST duplicates:** `/token/getToken` (`getToken` / `getTokenPost`).
- **Odd parameters:**
  - The scheduler form keys have a leading dash (`-execId`, `-jobId`, `-jobGroup`, `-userAccess`).
  - The `login2/*` routes take `connectionId` as a query parameter.
- **`/api/session/cleanSession`:** blocks for 10 seconds by design.
- **Health probes:** a 503 from `/health/ready` or `/health/details` surfaces as `ApiError`, with the body in `data`.

## `/api/auth/group*`, `/api/auth/permissionBatch`, `/api/auth/user`

- **Security, `POST /api/auth/user/setupResetPassword`:** needs no session and uses the caller's `url` for the link in the reset email. An attacker can send a genuine reset email whose link delivers the token to a host they control, so the account can be taken over.
- **Security, `GET /api/auth/group/{engine,project,insight}/getGroup*Permission`:** uses `respondAllowingAnonymous` and never checks the caller. Any session, anonymous included, can read any group's permission on any resource.
- **`GET /api/auth/user/getUserAccessKeys`:** allows anonymous sessions.
- **`POST /api/auth/user/deleteUser`:** is a stub. It returns a null `Response` and deletes nothing.
- **`POST /api/auth/user/editUser`:** always overwrites both EMAIL and NAME, so a missing field is saved as `""`.
- **Passwords are altered:** `resetPassword` and `changePassword` run `inputSQLSanitizer` on the password.
- **`POST /api/auth/user/changePassword`:**
  - Answers 401 for every failure, including bad input.
  - Wrong-password errors return `{ success: false, userId, message }` with no `errorMessage`.
- **401 for most failures:** `setupResetPassword` and `resetPassword` return 401 for most errors, including an invalid token.
- **`POST /api/auth/user/deleteUserAccessKey`:** returns 400 with `{ success: false }` when the delete fails.
- **`GET /api/auth/group/getNonGroupMembers`:** `msGraphLookup` defaults to true, so it searches Microsoft Graph when the directory is enabled. Directory fields are unverified.
- **Parameter naming:** the group engine endpoints mix `engineId` (add) with `appId` (get, edit, remove).
- **Key casing:** `getGroupsWithAccessTo{Engine,Project,Insight}` use upper-case keys (`ID`, `TYPE`, `PERMISSION` as a 1/2/3 id, `DATEADDED`, `ENDDATE`). The other group lists use lower case, and the insight version has no `ENDDATE`.
- **Inconsistent anonymous access:** `getGroupsWithAccessToInsight` and `getAvailableGroupsForInsight` reject anonymous sessions, but the engine and project versions allow them.
- **`getGroup*Permission`:** returns `{}` when the group has no access (Gson drops null values).
- **Unverified shapes, permission batches:**
  - `getPermissions`: price and usage limits.
  - `getPermissionsToCopy`: usage limits.
  - `getEffectivePermissions`: the model `usage` fields.
  - `getUsageLimitPath`: step enums.
  - `getMyUsageLimitPath(s)`: steps.
- **Target types:** `getEffectivePermissions` accepts only `PROJECT` or `ENGINE`, and `getPermissions` rejects `INSIGHT`, although the shared `toTarget` parser accepts every target type.

## `/api/engine` (NameServer), `/api/project-{id}`, engine-type routes, exec, share

**Deprecated:**
- `POST /api/engine/partial` is `@Deprecated`. Use `pixelJobStreaming`.
- These sit under NameServer's "Legacy code that isn't really used anymore" section:
  - `GET /api/engine/mediawiki/tags`
  - `GET /api/engine/all`
  - `GET /api/engine/add` (its body is commented out, so it does nothing)
  - `GET /api/engine/central/context/getAutoCompleteResults`
  - `POST /api/engine/central/context/getSearchInsightsResults`
- `OldEngineResource` (`/api/engine/e-{engine}/*`: `insight`, `output`, `commitFormData`, `getAuditLogForEngine`) is `@Deprecated`. Use `runPixel`.

**Findings:**
- **Security: the polling endpoints don't check job ownership.** `console`, `error`, `partial`, `pixelJobStreaming` and `terminate` take any jobId and never check the session, so any user can read another job's output or cancel it. Only `status` and `result` check.
- **Security, `POST /api/project-{id}/runReactor/{name}`:** runs any custom reactor with only view access.
  - Its error message mentions updating the SMSS.
  - The not-found message prints `null` instead of the reactor name.
- **No access checks in the engine-type resources themselves:** database, storage, vector, function and model routes rely on the reactor to enforce access. `database-{id}/reload` has no pre-check.
- **Locators return error `Response`s instead of throwing:** the NameServer `i-` and `e-` locators, `exec` and `share`. The intended 400/401 may never be sent.
- **`GET /api/model-{id}/llmStreaming`:** loops until `PROGRESS_COMPLETE`, so a job that ends as ERROR or CANCELED never ends the SSE loop and holds a thread.
- **`GET /api/project-{id}/downloadProjectAsset/{relPath}`:**
  - `{relPath}` matches a single segment, and Tomcat rejects `%2F`, so nested asset paths can't be reached.
  - It reads files as UTF-8 strings, which corrupts binary assets.
- **`GET /api/project-{id}/embedLogo`:** reads the image into a `String`, which corrupts it. Its `insightId` is unused.
- **`POST /api/engine/e-{engine}/getAuditLogForEngine`:** double-encodes its JSON, and its errors too.
- **Error envelopes:** ProjectResource and EngineRouteResource send many 401s as `{ error }` instead of `{ errorMessage }`.
- **Errors returned with a 200:**
  - `do-{method}` on a non-legacy insight
  - `getSearchInsightsResults` with a bad filter
  - `jdbc_json` and `jdbc_csv` failures; these also leak server stack frames
- **`POST /api/engine/runReactorMCP` isn't proper JSON-RPC:**
  - The response has no `jsonrpc` or `id`.
  - `method` is never checked.
  - An unknown reactor fails outside the `try` block (500).
- **Insight leaks:**
  - `exec/.../getInsightState` stores and re-runs the insight but never drops it.
  - OldEngine `output` creates an insight on every call.
- **Wrong alias helper:** `exec` resolves the project alias with the engine helper `SecurityQueryUtils.testUserEngineIdForAlias`.
- **NPE with no session:** `getAutoCompleteResults` and `getSearchInsightsResults`.
  - `getSearchInsightsResults` also runs its `filterData` JSON through `inputSQLSanitizer` and ignores `tags`.
- **Unused parameters:**
  - `runPixelAsync`: `dropLogging`
  - the `i-` locator: `dataFrameType`
  - the `e-` locator: `api`
  - `add`: `api` and `database`
- **Duplicate routes:**
  - `image/upload` is an alias of `projectImage/upload`.
  - `jdbc_json` and `jdbc_csv` are each both GET and POST, with identical parameters.
- **`jdbc_csv` with a single frame:** calls `query` instead of `queryCSV`, then treats the result as a file path.
- **SQL bodies:** `jdbc*` can read SQL from a raw request body, but the wrappers send `sql` in the query string, so long SQL is limited by URL length.
- **`result` and `status`:** return the bare string `"NULL"` with a 200 when there is nothing.
- **`centralNameServer` locator:** leads to `CentralNameServer`, whose HTTP methods are all commented out.
- **Unverified shapes:**
  - pixel step `output` values from the engine-type routes, exec and share
  - `getPipeline` `idMapping` and `pixelParsing`
  - agent-run events, `pendingActions` and `progress`
  - `pixelJobStreaming` chunks and `partial` keys
  - `all` and `getSearchInsightsResults` (only key columns are typed)
  - `do-{method}`, the legacy `insight` and `output` returns, the `jdbc*` outputs and the audit log

## `/api/auth/admin/*`

- **401 instead of 403 for non-admins:** the engine, insight and user admin resources use the old `performAdminCheck`. The group, project, model-usage and permission-batch resources use `respondAsAdmin`, which answers 403.
- **`POST /api/auth/admin/user/registerUser`:**
  - Its status codes are inverted: 400 for a non-admin, 401 for an invalid email, phone or password.
  - It runs the password through `inputSQLSanitizer`.
- **`POST /api/auth/admin/user/editUser`:**
  - Rewrites the whole row: missing fields are cleared, and admin, publisher and exporter become false.
  - A missing `id` or `type` throws an uncaught NullPointerException (500).
- **`POST /api/auth/admin/insight/deleteProjectInsights`:** answers 401 when the delete fails, and its Javadoc is copy-pasted.
- **Security:** `SecurityAdminUtils.getAllUserInsightAccess` (behind `getAllProjectInsightUsers`) builds raw SQL with `projectId` and `userId`. Only `inputSQLSanitizer` protects it.
- **`GET /api/auth/admin/engine/getAllUserEngines`:** selects the alias `app_permission` twice (the id, then the name).
- **Unused parameter:** `GET /api/auth/admin/insight/getProjectInsights` accepts `searchTerm` but never uses it.
- **Unsanitized input:** `getNumUsers` and `getNumAPIUsers` don't sanitize `filterWord`, unlike their list endpoints.
- **Wrong Javadoc:** `AdminModelUsageResource` says non-admins get 401; it actually answers 403.
- **Group resource naming:**
  - Write endpoints take `type`, while read endpoints take `groupType`.
  - `deleteGroupMember` vs `removeGroupManager`.
  - Engine deny takes `requestIds`, while insight deny takes `requestids`.
  - The Java method behind `updateInsightUserPermissions` is named `updateAppUserPermissions`.
- **Permission formats:** engine, insight and project grants take names (`OWNER`, `EDIT`, `READ_ONLY`), but group grants take ids (1, 2, 3).
- **Hard-coded `endDate = null`:** end dates are silently unsupported on the engine and insight admin grants.
- **Directory lookup by default:** `msGraphLookup` defaults to true when the directory is enabled. Send `false` to search the security database.
- **Unverified shapes:**
  - the Microsoft directory lookups (`getEngineUsersNoCredentials`, `getNonGroupMembers`)
  - `price` in `getPermissions`
  - the `usage` rows in `getEffectivePermissions`
  - `engine_tool_app`

## All resources

- **Nulls are dropped:** Gson isn't configured with `serializeNulls`, so null values are left out of response maps. Fields typed `X | null` may actually be missing.

## `/api/model/*`, `/api/ext/*`, uploads, images, browser sessions, `/github`, `/msgraph`

**Deprecated:**
- `POST /api/images/databaseImage/upload` is `@Deprecated`. Use `uploadEngineImage` (`/api/images/engine/upload`).
  - It also sets `message` twice, so the old text wins.
- `POST /api/images/databaseImage/delete` is `@Deprecated`. Use `deleteEngineImage`.

**Findings:**
- **Security, `POST /api/browser-sessions/{id}/recording/save`:**
  - Writes into any `project`'s assets folder with no permission check and no sanitizing.
  - Its response leaks the absolute server path.
- **Security, MCP:**
  - `access_key` is declared as a query parameter but never read, which invites putting secrets in URLs.
  - `initSession` dereferences a null `user` (NPE).
- **Security, `GET /github/install/app`:** stores `projectId` with no owner check; the check only happens later, in the callback.
- **A2A `agentCard`:** no auth check, which is probably intended for discovery. It reveals workspace names and descriptions.
- **Content negotiation picks the method:** `POST /api/ext/a2a/workspace/{id}/rpc` and `POST /api/ext/mcp/{toolbox_id}/comms` are each two Java methods, chosen only by `Accept`. The wrappers set `Accept`.
- **OpenAI-compatible routes:**
  - `chat/completions` casts `append_full_prompt` to `String`, so a boolean throws a 500.
  - `embeddings` requires `input` to be a list; a single string fails.
  - `/completions`:
    - requires a string `prompt`
    - has no `/v1` alias
    - always returns `finish_reason: "length"`
    - fakes streaming by sending the whole answer as one chunk
  - The GET `/models` routes declare `@Consumes("application/json")`.
  - `responses` doesn't add `insight_id` to the session hash.
- **Error bodies don't use `errorMessage`:**
  - Anthropic returns `{ type: "error", error }`.
  - `browser-sessions` returns `{ error }`.
  - GitHub and msgraph return `{ status, reason }`.
  - A2A returns a JSON-RPC `error`.
- **Wrong status codes:**
  - A2A returns an unsupported JSON-RPC method (-32601) with HTTP 200.
  - FileUploader and ImageUploader return 400 for auth and permission failures.
- **msgraph `subscribe` and `renew`:** read `getParameter`. The Javadoc shows query parameters, but form bodies also work.
- **Unverified shapes:**
  - A2A `agentCard` and `rpc` (Gson reflection over a2a-java-sdk classes)
  - MCP `comms`
  - `browser-sessions` `recording` steps
