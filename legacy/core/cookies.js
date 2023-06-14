export function load(LEGACY_GOOGLE_ANALYTICS, GOOGLE_ANALYTICS_TAG) {
    if (LEGACY_GOOGLE_ANALYTICS) {
        // // create the google analytics
        window.ga =
            window.ga ||
            function () {
                (window.ga.q = window.ga.q || []).push(arguments);
            };
        window.ga.l = +new Date();
        window.ga('create', GOOGLE_ANALYTICS_TAG, 'auto');
        window.ga('send', 'pageview');

        // append it
        const gaScript = document.createElement('script');
        gaScript.type = 'text/javascript';
        gaScript.async = true;
        gaScript.src = 'https://www.google-analytics.com/analytics.js';
        document.head.append(gaScript);
    } else {
        var addGoogleAnalytics = document.createElement('script');
        addGoogleAnalytics.setAttribute(
            'src',
            'https://www.googletagmanager.com/gtag/js?id=' +
                GOOGLE_ANALYTICS_TAG
        );
        addGoogleAnalytics.async = 'true';
        document.head.appendChild(addGoogleAnalytics);

        var addDataLayer = document.createElement('script');
        var dataLayerData = document.createTextNode(
            "window.dataLayer = window.dataLayer || []; \n function gtag(){dataLayer.push(arguments);} \n gtag('js', new Date()); \n gtag('config', '" +
                GOOGLE_ANALYTICS_TAG +
                "');"
        );
        addDataLayer.appendChild(dataLayerData);
        document.head.appendChild(addDataLayer);
    }
}
