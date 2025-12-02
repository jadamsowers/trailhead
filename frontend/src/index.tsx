import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { AuthProvider as CustomAuthProvider } from "./contexts/AuthContext";
import { metadataUrl } from "./auth/client";
import { initializeTheme } from "./utils/themeManager";
import { initApiClient } from "./utils/initClient";

// Workaround (dev-only): some auth servers (e.g. local Authentik dev)
// occasionally return an HTML error page for the discovery URL.
// The OIDC client validates `Content-Type` and will fail if it is
// not JSON. Enable a narrow, dev-only wrapper that will attempt to
// parse the response as JSON regardless of the header and provide
// helpful debug logs when parsing fails.
// Make the fetch wrapper global: some auth servers return an HTML error
// page for the discovery URL which breaks the OIDC client's content-type
// validation. This wrapper is narrowly scoped to the discovery path and
// attempts to parse the body as JSON if the header is incorrect.
const _originalFetch = (window as any).fetch.bind(window);
(window as any).fetch = async (input: any, init?: any) => {
  const url = typeof input === "string" ? input : input?.url;
  try {
    if (url && url.includes("/.well-known/openid-configuration")) {
      console.debug("[OIDC-FETCH-WRAP] fetching discovery URL", url);
      const resp = await _originalFetch(input, init);
      const ct = resp.headers.get("content-type") || "";
      // Log response details including the resolved response URL and common server headers
      const respUrl = (resp as Response).url;
      const serverHeader =
        resp.headers.get("server") ||
        resp.headers.get("x-powered-by") ||
        "<none>";
      console.debug("[OIDC-FETCH-WRAP] discovery response", {
        requestedUrl: url,
        responseUrl: respUrl,
        status: resp.status,
        contentType: ct,
        serverHeader,
      });

      // If the server already reports JSON, return as-is
      if (ct.includes("application/json") || ct.includes("+json")) {
        return resp;
      }

      // Try to read text and parse as JSON even when content-type is wrong
      const text = await resp.text();
      try {
        const parsed = JSON.parse(text);
        const body = JSON.stringify(parsed);
        console.debug("[OIDC-FETCH-WRAP] parsed discovery JSON despite bad CT");
        return new Response(body, {
          status: resp.status,
          statusText: resp.statusText,
          headers: { "content-type": "application/json" },
        });
      } catch (e) {
        // Not valid JSON — log a truncated body to help debugging.
        const snippet = text ? text.slice(0, 1000) : "<empty body>";
        console.warn("[OIDC-FETCH-WRAP] discovery response not JSON", {
          requestedUrl: url,
          responseUrl: respUrl,
          status: resp.status,
          contentType: ct,
          bodySnippet: snippet,
          parseError: String(e),
        });

        // If we have an explicit absolute `metadataUrl` and the response
        // appears to be the frontend index (HTML), attempt to re-fetch
        // using the absolute metadata URL — this fixes cases where the
        // request was routed to the frontend dev server by mistake.
        try {
          if (metadataUrl && !metadataUrl.includes(window.location.host)) {
            console.debug(
              "[OIDC-FETCH-WRAP] retrying discovery using metadataUrl",
              metadataUrl
            );
            const retryResp = await _originalFetch(metadataUrl, init);
            const retryCt = retryResp.headers.get("content-type") || "";
            if (
              retryCt.includes("application/json") ||
              retryCt.includes("+json")
            ) {
              return retryResp;
            }
            const retryText = await retryResp.text();
            try {
              const retryParsed = JSON.parse(retryText);
              return new Response(JSON.stringify(retryParsed), {
                status: retryResp.status,
                statusText: retryResp.statusText,
                headers: { "content-type": "application/json" },
              });
            } catch (re) {
              console.warn("[OIDC-FETCH-WRAP] retry also did not return JSON", {
                metadataUrl,
                retryStatus: retryResp.status,
                retryContentType: retryCt,
                retryBodySnippet: retryText
                  ? retryText.slice(0, 1000)
                  : "<empty body>",
                retryParseError: String(re),
              });
            }
          }
        } catch (retryErr) {
          console.error("[OIDC-FETCH-WRAP] retry attempt failed", retryErr);
        }

        return resp;
      }
    }
  } catch (e) {
    // If our wrapper fails, fall back to original fetch to avoid masking
    // other network errors.
    console.error("[OIDC-FETCH-WRAP] wrapper error", e);
    return _originalFetch(input, init);
  }

  return _originalFetch(input, init);
};

// Initialize generated API client
initApiClient();

// Initialize theme before rendering
initializeTheme();

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <CustomAuthProvider>
      <App />
    </CustomAuthProvider>
  </React.StrictMode>
);
