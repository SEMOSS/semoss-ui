//! The SEMOSS Playground desktop app's native side: the HTTP bridge every SDK
//! request goes through, the sign in windows, the keychain, downloads, and the
//! desktop tools. The web app calls these commands through
//! `src/platform/tauri.ts`; nothing here keeps a secret anywhere but the
//! system keychain.

use std::{collections::HashMap, path::PathBuf, sync::Mutex, time::Duration};

use base64::{engine::general_purpose::STANDARD, Engine};
use reqwest::{
    header::{HeaderMap, HeaderName, HeaderValue, COOKIE, SET_COOKIE},
    redirect::Policy,
    Client, Method,
};
use serde::{Deserialize, Serialize};
use tauri::{
    webview::Cookie as WebviewCookie, AppHandle, Emitter, Manager, State, Url, WebviewUrl,
    WebviewWindow, WebviewWindowBuilder, WindowEvent,
};
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_notification::NotificationExt;
use tauri_plugin_opener::OpenerExt;

/// The largest response the bridge hands back.
const MAX_RESPONSE_BYTES: usize = 64 * 1024 * 1024;
/// The request headers the bridge forwards; anything else is refused.
const ALLOWED_REQUEST_HEADERS: [&str; 6] = [
    "accept",
    "content-type",
    "x-csrf-token",
    "x-requested-with",
    "authorization",
    "bearer-provider",
];
/// The response headers the page reads back.
const RETURNED_RESPONSE_HEADERS: [&str; 3] =
    ["content-type", "content-disposition", "x-csrf-token"];
/// The keychain service every secret is kept under.
const KEYCHAIN_SERVICE: &str = "semoss-desktop";
/// Sign in windows' labels start with this; see `open_auth_window`.
const AUTH_WINDOW_PREFIX: &str = "semoss-auth-";

/// The instance in use: the only place the bridge sends requests.
#[derive(Default)]
struct ActiveInstance(Mutex<Option<Url>>);

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct NativeHttpRequest {
    url: String,
    method: String,
    #[serde(default)]
    headers: HashMap<String, String>,
    body_base64: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct NativeHttpResponse {
    status: u16,
    status_text: String,
    headers: HashMap<String, String>,
    body_base64: String,
}

#[derive(Clone, Serialize)]
struct AuthWindowEvent {
    label: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    url: Option<String>,
}

/// Parse an instance's module address: https, or http only on this machine.
fn parse_module_url(module_url: &str) -> Result<Url, String> {
    let url = Url::parse(module_url).map_err(|_| "The server address is invalid.".to_owned())?;
    let is_local = matches!(url.host_str(), Some("localhost" | "127.0.0.1" | "[::1]"));
    if url.scheme() != "https" && !(url.scheme() == "http" && is_local) {
        return Err("The server must use https (http only for localhost).".to_owned());
    }
    if !url.username().is_empty() || url.password().is_some() || url.fragment().is_some() {
        return Err("The server address has parts it cannot have.".to_owned());
    }
    Ok(url)
}

/// Whether a request's address is under the instance's module path.
fn is_under_instance(url: &Url, instance: &Url) -> bool {
    if url.scheme() != instance.scheme()
        || url.host_str() != instance.host_str()
        || url.port_or_known_default() != instance.port_or_known_default()
    {
        return false;
    }
    let base = instance.path().trim_end_matches('/');
    let path = url.path();
    path == base
        || path
            .strip_prefix(base)
            .is_some_and(|rest| rest.starts_with('/'))
}

fn network_client() -> Result<Client, String> {
    Client::builder()
        // the SDK treats the session's 302 as signed out; keep it a 302
        .redirect(Policy::none())
        .timeout(Duration::from_secs(300))
        .user_agent("SEMOSS Playground Desktop")
        .build()
        .map_err(|_| "Unable to start the network client.".to_owned())
}

/// Choose the instance the bridge may reach, before any request.
#[tauri::command]
fn set_active_instance(state: State<ActiveInstance>, module_url: String) -> Result<(), String> {
    let url = parse_module_url(&module_url)?;
    *state.0.lock().map_err(|_| "The app's state is unavailable.")? = Some(url);
    Ok(())
}

/// Whether an instance answers: its `/api/config` reads as JSON. Sends no cookies.
#[tauri::command]
async fn check_instance(module_url: String) -> Result<(), String> {
    let url = parse_module_url(&module_url)?;
    let config = format!("{}/api/config", url.as_str().trim_end_matches('/'));
    let response = network_client()?
        .get(config)
        .header("accept", "application/json")
        .send()
        .await
        .map_err(|error| format!("{error}"))?;
    if !response.status().is_success() {
        return Err(format!("The server answered {}.", response.status().as_u16()));
    }
    let body = response
        .bytes()
        .await
        .map_err(|_| "Unable to read the server's answer.".to_owned())?;
    serde_json::from_slice::<serde_json::Value>(&body)
        .map_err(|_| "The server did not answer as SEMOSS does.".to_owned())?;
    Ok(())
}

fn cookie_header(webview: &WebviewWindow, url: &Url) -> Result<Option<String>, String> {
    let cookies = webview
        .cookies_for_url(url.clone())
        .map_err(|_| "Unable to read the session's cookies.".to_owned())?;
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
    match url.path().rfind('/') {
        Some(0) | None => "/".to_owned(),
        Some(index) => url.path()[..index].to_owned(),
    }
}

/// Keep the session's cookies in the webview's jar, which the sign in windows share.
fn sync_response_cookies(
    webview: &WebviewWindow,
    url: &Url,
    headers: &HeaderMap,
) -> Result<(), String> {
    let host = url.host_str().ok_or("The response has no host.")?;
    for value in headers.get_all(SET_COOKIE) {
        let value = value.to_str().map_err(|_| "The server sent an invalid cookie.")?;
        let mut cookie = WebviewCookie::parse(value.to_owned())
            .map_err(|_| "The server sent an invalid cookie.".to_owned())?;
        if cookie.domain().is_none() {
            cookie.set_domain(host.to_owned());
        }
        if cookie.path().is_none() {
            cookie.set_path(default_cookie_path(url));
        }
        if cookie.max_age().is_some_and(|max_age| max_age.is_zero()) {
            webview
                .delete_cookie(cookie)
                .map_err(|_| "Unable to remove an expired cookie.".to_owned())?;
        } else {
            webview
                .set_cookie(cookie)
                .map_err(|_| "Unable to keep the session's cookie.".to_owned())?;
        }
    }
    Ok(())
}

/// Send one of the page's requests to the instance in use, with the
/// session's cookies, and hand back the response's bytes.
#[tauri::command]
async fn native_http_request(
    webview: WebviewWindow,
    state: State<'_, ActiveInstance>,
    request: NativeHttpRequest,
) -> Result<NativeHttpResponse, String> {
    let instance = state
        .0
        .lock()
        .map_err(|_| "The app's state is unavailable.")?
        .clone()
        .ok_or("No server is in use.")?;
    let url = Url::parse(&request.url).map_err(|_| "The request address is invalid.")?;
    if !is_under_instance(&url, &instance) {
        return Err("The request is outside the server in use.".to_owned());
    }
    let method = match request.method.as_str() {
        "GET" => Method::GET,
        "POST" => Method::POST,
        _ => return Err("The request method is not allowed.".to_owned()),
    };

    let mut builder = network_client()?.request(method, url.as_str());
    for (name, value) in &request.headers {
        let name = name.to_ascii_lowercase();
        if !ALLOWED_REQUEST_HEADERS.contains(&name.as_str()) {
            return Err(format!("The request header '{name}' is not allowed."));
        }
        let name = HeaderName::from_bytes(name.as_bytes()).map_err(|_| "Invalid header name.")?;
        let value = HeaderValue::from_str(value).map_err(|_| "Invalid header value.")?;
        builder = builder.header(name, value);
    }
    if let Some(cookie) = cookie_header(&webview, &url)? {
        builder = builder.header(COOKIE, cookie);
    }
    if let Some(body) = request.body_base64 {
        let bytes = STANDARD
            .decode(body)
            .map_err(|_| "The request body is invalid.".to_owned())?;
        builder = builder.body(bytes);
    }

    let response = builder
        .send()
        .await
        .map_err(|error| format!("The request failed: {error}"))?;
    let status = response.status();
    let headers = response.headers().clone();
    if response.content_length().unwrap_or_default() > MAX_RESPONSE_BYTES as u64 {
        return Err("The response is too large.".to_owned());
    }
    sync_response_cookies(&webview, &url, &headers)?;
    let bytes = response
        .bytes()
        .await
        .map_err(|_| "Unable to read the response.".to_owned())?;
    if bytes.len() > MAX_RESPONSE_BYTES {
        return Err("The response is too large.".to_owned());
    }

    let mut returned = HashMap::new();
    for name in RETURNED_RESPONSE_HEADERS {
        if let Some(value) = headers.get(name).and_then(|value| value.to_str().ok()) {
            returned.insert(name.to_owned(), value.to_owned());
        }
    }
    Ok(NativeHttpResponse {
        status: status.as_u16(),
        status_text: status.canonical_reason().unwrap_or("").to_owned(),
        headers: returned,
        body_base64: STANDARD.encode(bytes),
    })
}

fn require_auth_label(label: &str) -> Result<(), String> {
    if label.starts_with(AUTH_WINDOW_PREFIX) {
        Ok(())
    } else {
        Err("Only sign in windows can be opened this way.".to_owned())
    }
}

/// Open a sign in window on a page (or blank). It shares the main window's
/// cookie jar, gets no capability (its pages are remote), and reports each
/// navigation and its close to the page.
#[tauri::command]
fn open_auth_window(app: AppHandle, label: String, url: String) -> Result<(), String> {
    require_auth_label(&label)?;
    let target = Url::parse(&url).map_err(|_| "The sign in address is invalid.")?;
    if !matches!(target.scheme(), "https" | "http" | "about") {
        return Err("The sign in address is not a web page.".to_owned());
    }
    let navigated_app = app.clone();
    let navigated_label = label.clone();
    let window = WebviewWindowBuilder::new(&app, &label, WebviewUrl::External(target))
        .title("Sign in")
        .inner_size(480.0, 680.0)
        .center()
        .on_navigation(move |url| {
            let _ = navigated_app.emit(
                "auth-window://navigated",
                AuthWindowEvent {
                    label: navigated_label.clone(),
                    url: Some(url.to_string()),
                },
            );
            true
        })
        .build()
        .map_err(|error| format!("Unable to open the sign in window: {error}"))?;
    let closed_app = app.clone();
    window.on_window_event(move |event| {
        if let WindowEvent::Destroyed = event {
            let _ = closed_app.emit(
                "auth-window://closed",
                AuthWindowEvent {
                    label: label.clone(),
                    url: None,
                },
            );
        }
    });
    Ok(())
}

/// Send a sign in window to a page.
#[tauri::command]
fn navigate_auth_window(app: AppHandle, label: String, url: String) -> Result<(), String> {
    require_auth_label(&label)?;
    let target = Url::parse(&url).map_err(|_| "The sign in address is invalid.")?;
    if !matches!(target.scheme(), "https" | "http") {
        return Err("The sign in address is not a web page.".to_owned());
    }
    app.get_webview_window(&label)
        .ok_or("The sign in window is closed.")?
        .navigate(target)
        .map_err(|error| format!("{error}"))
}

/// Close a sign in window, if it is still open.
#[tauri::command]
fn close_auth_window(app: AppHandle, label: String) -> Result<(), String> {
    require_auth_label(&label)?;
    if let Some(window) = app.get_webview_window(&label) {
        window.close().map_err(|error| format!("{error}"))?;
    }
    Ok(())
}

fn keychain_entry(account: &str) -> Result<keyring::Entry, String> {
    keyring::Entry::new(KEYCHAIN_SERVICE, account)
        .map_err(|_| "The system keychain is unavailable.".to_owned())
}

/// Read a secret from the system keychain; none kept is `null`.
#[tauri::command]
fn secret_get(account: String) -> Result<Option<String>, String> {
    match keychain_entry(&account)?.get_password() {
        Ok(secret) => Ok(Some(secret)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(_) => Err("Unable to read the system keychain.".to_owned()),
    }
}

/// Keep a secret in the system keychain.
#[tauri::command]
fn secret_set(account: String, value: String) -> Result<(), String> {
    keychain_entry(&account)?
        .set_password(&value)
        .map_err(|_| "Unable to write to the system keychain.".to_owned())
}

/// Forget a secret; none kept is not an error.
#[tauri::command]
fn secret_delete(account: String) -> Result<(), String> {
    match keychain_entry(&account)?.delete_credential() {
        Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
        Err(_) => Err("Unable to write to the system keychain.".to_owned()),
    }
}

/// Ask where to save a download and write it there. The page never picks
/// the path. Returns whether it was saved; closing the dialog is not an error.
#[tauri::command]
async fn save_file_with_dialog(
    app: AppHandle,
    default_name: String,
    data_base64: String,
) -> Result<bool, String> {
    let bytes = STANDARD
        .decode(data_base64)
        .map_err(|_| "The file's contents are invalid.".to_owned())?;
    let Some(path) = app
        .dialog()
        .file()
        .set_file_name(default_name)
        .blocking_save_file()
    else {
        return Ok(false);
    };
    let path: PathBuf = path
        .into_path()
        .map_err(|_| "The chosen location is not a file.".to_owned())?;
    std::fs::write(&path, bytes).map_err(|error| format!("Unable to save the file: {error}"))?;
    Ok(true)
}

/// Desktop tool `desktop_notify`: show a notification.
#[tauri::command]
fn desktop_notify(app: AppHandle, title: String, body: String) -> Result<String, String> {
    app.notification()
        .builder()
        .title(title)
        .body(body)
        .show()
        .map_err(|error| format!("Unable to show the notification: {error}"))?;
    Ok("Shown".to_owned())
}

/// Desktop tool `desktop_open_path`: show a file or folder in the file
/// manager. It never opens or runs it.
#[tauri::command]
fn desktop_reveal_path(app: AppHandle, path: String) -> Result<String, String> {
    let path = PathBuf::from(path);
    if !path.is_absolute() {
        return Err("The path must be absolute.".to_owned());
    }
    if !path.exists() {
        return Err("There is nothing at that path.".to_owned());
    }
    app.opener()
        .reveal_item_in_dir(&path)
        .map_err(|error| format!("Unable to show the path: {error}"))?;
    Ok(format!("Shown {} in its folder", path.display()))
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
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init())
        .manage(ActiveInstance::default())
        .invoke_handler(tauri::generate_handler![
            set_active_instance,
            check_instance,
            native_http_request,
            open_auth_window,
            navigate_auth_window,
            close_auth_window,
            secret_get,
            secret_set,
            secret_delete,
            save_file_with_dialog,
            desktop_notify,
            desktop_reveal_path
        ])
        .run(tauri::generate_context!())
        .expect("error while running SEMOSS Playground");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn requests_stay_under_the_instance() {
        let instance = parse_module_url("https://host.example/Monolith").unwrap();
        let ok = Url::parse("https://host.example/Monolith/api/config").unwrap();
        let sibling = Url::parse("https://host.example/Monolith-evil/api").unwrap();
        let other = Url::parse("https://evil.example/Monolith/api").unwrap();
        assert!(is_under_instance(&ok, &instance));
        assert!(!is_under_instance(&sibling, &instance));
        assert!(!is_under_instance(&other, &instance));
    }

    #[test]
    fn plain_http_is_only_for_this_machine() {
        assert!(parse_module_url("http://localhost:9090/Monolith").is_ok());
        assert!(parse_module_url("http://host.example/Monolith").is_err());
        assert!(parse_module_url("https://user:pw@host.example/Monolith").is_err());
    }
}
