import axios, { isAxiosError } from 'axios';
import { useEffect } from 'react';
import { Env, CSRF, fetchCsrfTokenIfNeeded, getCsrfToken} from "@semoss/sdk/react";
import { ThemeProvider, Toaster } from "@semoss/ui/next";
import { RootStoreContext } from '@/contexts';
import { RootStore } from '@/stores';
import { AppWrapper } from './AppWrapper';

// use the environment variable to set the module
Env.update({
	MODULE: import.meta.env.MODULE || "/Monolith",
});

// add interceptors
axios.interceptors.request.use(
	async (config) => {
		// Check if the request is a GET request
		if (config.method === "get" && config.params) {
			config.paramsSerializer = (params) => {
				return Object.keys(params)
					.map((key) => {
						if (params[key] === undefined) {
							return "";
						}

						return `${encodeURIComponent(key)}=${encodeURIComponent(
							params[key],
						)}`;
					})
					.filter((p) => {
						if (p) {
							return true;
						}

						return false;
					})
					.join("&");
			};
		}

		// Check the CSRF before login or after the configStore is set, then add the token
		if (CSRF.isEnabled || _store.configStore.store.config.csrf) {
			if (config.method === "post") {
				// Use the centralized CSRF token from fetch.ts
				const token =
					getCsrfToken() || (await fetchCsrfTokenIfNeeded());
				if (token) {
					config.headers["X-CSRF-Token"] = token;
				}
			}
		}
		return config;
	},
	(error) => {
		// Handle request error
		return Promise.reject(error);
	},
);

axios.interceptors.response.use(
	(response) => response,
	(error) => {
		getError(error);
	},
);

// create a new root store
const _store = new RootStore();

//get error from request or response
function getError(error) {
	if (error.status === 302 && error.headers && error.headers.redirect) {
		window.location.replace(error.headers.redirect);
	}

	if (isAxiosError(error)) {
		const { response } = error;
		if (
			response.status === 302 &&
			response.headers &&
			response.headers.redirect
		) {
			window.location.replace(response.headers.redirect);
		}
	}

	const apiMessage = error.response?.data?.errorMessage;
	if (apiMessage && typeof apiMessage === "string") {
		// Exception for returning the errorMessage provided via the API if available.
		return Promise.reject(apiMessage);
	} else if (error.message) {
		// return the message if it exists
		return Promise.reject(error.message);
	} else {
		// reject with generic error
		return Promise.reject("Error");
	}
}

export const App = () => {
	useEffect(() => {
		// load the environment from the document in (production)
		try {
			if (!document) {
				return;
			}

			const env = JSON.parse(
				document.getElementById("semoss-env")?.textContent || null,
			) as {
				MODULE: string;
			};

			// update the enviornment variables with the module
			if (env) {
				Env.update({
					MODULE: env.MODULE,
				});
			}
		} catch (_e) {}
		// intialize it
		_store.configStore.initialize().then(() => {
			// set as enabled
			CSRF.isEnabled = _store.configStore.store.config.csrf;
			Env.update({ CSRF: _store.configStore.store.config.csrf });
		});
	}, []);

	//  NCRT ASK - (https://play.semoss.org/ncrt/SemossWeb/packages/client/dist/#!/)
	if (window.location.href.includes("client/dist/#!/")) {
		window.location.href = window.location.href.replace(
			/(client\/dist\/)#!/,
			"$1#",
		);
	}

	return (
		<RootStoreContext.Provider value={_store}>
			<ThemeProvider defaultTheme="light">
				<AppWrapper />
				<Toaster />
			</ThemeProvider>
		</RootStoreContext.Provider>
	);
};
