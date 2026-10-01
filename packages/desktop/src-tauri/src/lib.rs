use std::{
    collections::HashMap,
    fs::{create_dir_all, OpenOptions},
    io::Write,
    path::PathBuf,
    sync::Mutex,
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};

use reqwest::{
    header::{HeaderMap, HeaderName, HeaderValue, CONTENT_TYPE, COOKIE, SET_COOKIE},
    redirect::Policy,
    Client, Method, Url,
};
use serde::{Deserialize, Serialize};
use tauri::{webview::Cookie as WebviewCookie, AppHandle, Manager, WebviewWindow};

const MAX_RESPONSE_BYTES: usize = 32 * 1024 * 1024;
const ALLOWED_HEADERS: [&str; 4] = ["accept", "content-type", "x-csrf-token", "x-requested-with"];
static LOG_LOCK: Mutex<()> = Mutex::new(());

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct CompiledProfile {
    id: String,
    endpoint: String,
    module: String,
    allow_insecure_http: bool,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct NativeHttpRequest {
    profile_id: String,
    url: String,
    method: String,
    #[serde(default)]
    headers: HashMap<String, String>,
    body: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct NativeHttpResponse {
    status: u16,
    status_text: String,
    headers: HashMap<String, String>,
    body: String,
}

fn log_path(app: &AppHandle) -> Result<PathBuf, String> {
    let directory = app
        .path()
        .app_log_dir()
        .map_err(|error| format!("Unable to resolve the AI Core log directory: {error}"))?;
    create_dir_all(&directory)
        .map_err(|error| format!("Unable to create the AI Core log directory: {error}"))?;
    Ok(directory.join("ai-core.log"))
}

fn write_log(app: &AppHandle, level: &str, message: &str) {
    let Ok(_guard) = LOG_LOCK.lock() else {
        return;
    };
    let Ok(path) = log_path(app) else {
        return;
    };
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_secs())
        .unwrap_or_default();
    if let Ok(mut file) = OpenOptions::new().create(true).append(true).open(path) {
        let sanitized = message.replace(['\r', '\n'], " ");
        let _ = writeln!(file, "{timestamp} [{}] {sanitized}", level.to_uppercase());
    }
}

#[tauri::command]
fn desktop_log(app: AppHandle, level: String, message: String) {
    write_log(&app, &level, &message);
}

#[tauri::command]
fn desktop_log_path(app: AppHandle) -> Result<String, String> {
    log_path(&app).map(|path| path.to_string_lossy().into_owned())
}

fn profiles() -> Result<Vec<CompiledProfile>, String> {
    let raw = option_env!("SEMOSS_DESKTOP_PROFILES")
        .ok_or_else(|| "No desktop instance profiles were compiled into this build.".to_owned())?;
    serde_json::from_str(raw).map_err(|_| "The compiled desktop profiles are invalid.".to_owned())
}

fn validate_request(
    request: &NativeHttpRequest,
) -> Result<(Url, Method, HashMap<String, String>), String> {
    let profile = profiles()?
        .into_iter()
        .find(|profile| profile.id == request.profile_id)
        .ok_or_else(|| "The selected desktop instance profile is not allowed.".to_owned())?;

    if profile.endpoint.trim().is_empty() {
        return Err("Local development requests must use the web transport.".to_owned());
    }

    let base = Url::parse(&format!(
        "{}{}",
        profile.endpoint.trim_end_matches('/'),
        profile.module
    ))
    .map_err(|_| "The compiled profile URL is invalid.".to_owned())?;
    let url = Url::parse(&request.url).map_err(|_| "The request URL is invalid.".to_owned())?;

    if url.username() != "" || url.password().is_some() || url.fragment().is_some() {
        return Err("The request URL contains unsupported components.".to_owned());
    }
    if url.scheme() != "https"
        && !(profile.allow_insecure_http
            && url.scheme() == "http"
            && matches!(url.host_str(), Some("localhost" | "127.0.0.1" | "::1")))
    {
        return Err("The request URL does not use an allowed transport.".to_owned());
    }
    if url.scheme() != base.scheme()
        || url.host_str() != base.host_str()
        || url.port_or_known_default() != base.port_or_known_default()
    {
        return Err("The request URL is outside the selected profile origin.".to_owned());
    }

    let base_path = base.path().trim_end_matches('/');
    let request_path = url.path();
    if request_path != base_path
        && !request_path
            .strip_prefix(base_path)
            .is_some_and(|remainder| remainder.starts_with('/'))
    {
        return Err("The request URL is outside the selected profile module.".to_owned());
    }

    let method = Method::from_bytes(request.method.as_bytes())
        .map_err(|_| "The request method is invalid.".to_owned())?;
    if !matches!(method, Method::GET | Method::POST) {
        return Err("The request method is not allowed.".to_owned());
    }

    let headers = request
        .headers
        .iter()
        .map(|(name, value)| (name.to_ascii_lowercase(), value.clone()))
        .collect::<HashMap<_, _>>();
    if let Some(name) = headers
        .keys()
        .find(|name| !ALLOWED_HEADERS.contains(&name.as_str()))
    {
        return Err(format!("The request header '{name}' is not allowed."));
    }

    Ok((url, method, headers))
}

fn cookie_header(webview: &WebviewWindow, url: &Url) -> Result<Option<String>, String> {
    let cookies = webview
        .cookies_for_url(url.clone())
        .map_err(|_| "Unable to read the desktop session cookies.".to_owned())?;
    if cookies.is_empty() {
        return Ok(None);
    }

    Ok(Some(
        cookies
            .iter()
            .map(|cookie| format!("{}={}", cookie.name(), cookie.value()))
            .collect::<Vec<_>>()
            .join("; "),
    ))
}

fn default_cookie_path(url: &Url) -> String {
    let path = url.path();
    match path.rfind('/') {
        Some(0) | None => "/".to_owned(),
        Some(index) => path[..index].to_owned(),
    }
}

fn sync_response_cookies(
    webview: &WebviewWindow,
    url: &Url,
    headers: &HeaderMap,
) -> Result<(), String> {
    let host = url
        .host_str()
        .ok_or_else(|| "The response URL has no host.".to_owned())?;

    for value in headers.get_all(SET_COOKIE) {
        let value = value
            .to_str()
            .map_err(|_| "The server returned an invalid session cookie.".to_owned())?;
        let mut cookie = WebviewCookie::parse(value.to_owned())
            .map_err(|_| "The server returned an invalid session cookie.".to_owned())?;
        if cookie.domain().is_none() {
            cookie.set_domain(host.to_owned());
        }
        if cookie.path().is_none() {
            cookie.set_path(default_cookie_path(url));
        }

        if cookie.max_age().is_some_and(|max_age| max_age.is_zero()) {
            webview
                .delete_cookie(cookie)
                .map_err(|_| "Unable to remove an expired desktop session cookie.".to_owned())?;
        } else {
            webview
                .set_cookie(cookie)
                .map_err(|_| "Unable to update the desktop session cookies.".to_owned())?;
        }
    }

    Ok(())
}

#[tauri::command]
async fn native_http_request(
    app: AppHandle,
    webview: WebviewWindow,
    request: NativeHttpRequest,
) -> Result<NativeHttpResponse, String> {
    let started = Instant::now();
    let profile_id = request.profile_id.clone();
    let (url, method, request_headers) = match validate_request(&request) {
        Ok(validated) => validated,
        Err(error) => {
            write_log(
                &app,
                "error",
                &format!("HTTP validation failed profile={profile_id}: {error}"),
            );
            return Err(error);
        }
    };
    let request_summary = format!("{} {} profile={profile_id}", method, url.path());
    write_log(&app, "info", &format!("HTTP start {request_summary}"));
    let client = Client::builder()
        .redirect(Policy::none())
        .timeout(Duration::from_secs(60))
        .user_agent("AI Core")
        .build()
        .map_err(|error| {
            let message = "Unable to initialize the desktop network client.".to_owned();
            write_log(
                &app,
                "error",
                &format!("HTTP client failed {request_summary}: {error}"),
            );
            message
        })?;

    let mut builder = client.request(method, url.clone());
    for (name, value) in request_headers {
        let name = HeaderName::from_bytes(name.as_bytes())
            .map_err(|_| "A request header name is invalid.".to_owned())?;
        let value = HeaderValue::from_str(&value)
            .map_err(|_| "A request header value is invalid.".to_owned())?;
        builder = builder.header(name, value);
    }
    if let Some(cookie) = cookie_header(&webview, &url)? {
        builder = builder.header(COOKIE, cookie);
    }
    if let Some(body) = request.body {
        builder = builder.body(body);
    }

    let response = builder.send().await.map_err(|error| {
        let message = format!("The desktop request failed: {error}");
        write_log(
            &app,
            "error",
            &format!("HTTP failed {request_summary}: {error}"),
        );
        message
    })?;
    let status = response.status();
    let response_headers = response.headers().clone();
    let content_length = response.content_length().unwrap_or_default();
    if content_length > MAX_RESPONSE_BYTES as u64 {
        write_log(
            &app,
            "error",
            &format!("HTTP response too large {request_summary} bytes={content_length}"),
        );
        return Err("The server response exceeds the desktop transport limit.".to_owned());
    }

    sync_response_cookies(&webview, &url, &response_headers)?;
    let bytes = response
        .bytes()
        .await
        .map_err(|_| "Unable to read the server response.".to_owned())?;
    if bytes.len() > MAX_RESPONSE_BYTES {
        write_log(
            &app,
            "error",
            &format!(
                "HTTP response too large {request_summary} bytes={}",
                bytes.len()
            ),
        );
        return Err("The server response exceeds the desktop transport limit.".to_owned());
    }
    let body = String::from_utf8(bytes.to_vec())
        .map_err(|_| "The server returned a non-text response.".to_owned())?;

    let mut headers = HashMap::new();
    if let Some(value) = response_headers.get(CONTENT_TYPE) {
        if let Ok(value) = value.to_str() {
            headers.insert(CONTENT_TYPE.as_str().to_owned(), value.to_owned());
        }
    }
    if let Some(value) = response_headers.get("x-csrf-token") {
        if let Ok(value) = value.to_str() {
            headers.insert("x-csrf-token".to_owned(), value.to_owned());
        }
    }
    write_log(
        &app,
        "info",
        &format!(
            "HTTP complete {request_summary} status={} duration_ms={}",
            status.as_u16(),
            started.elapsed().as_millis()
        ),
    );
    Ok(NativeHttpResponse {
        status: status.as_u16(),
        status_text: status
            .canonical_reason()
            .unwrap_or("Unknown Status")
            .to_owned(),
        headers,
        body,
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.unminimize();
                let _ = window.set_focus();
            }
        }))
        .setup(|app| {
            write_log(app.handle(), "info", "AI Core process started");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            native_http_request,
            desktop_log,
            desktop_log_path
        ])
        .run(tauri::generate_context!())
        .expect("error while running AI Core");
}
