const cookieName = "csrf-token"
const allowedScopes = new Set([
  "repo",
  "public_repo",
  "user",
  "read:user",
  "user:email",
])

function getAllowedDomains(): string[] {
  const configuredDomains = (process.env.ALLOWED_DOMAINS ?? "")
    .split(",")
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean)
  const canonicalDomain = process.env.OAUTH_BASE_URL

  if (canonicalDomain) {
    try {
      const url = new URL(canonicalDomain)
      if (
        url.protocol === "https:" &&
        url.pathname === "/" &&
        !url.search &&
        !url.hash
      ) {
        configuredDomains.push(url.hostname.toLowerCase())
      }
    } catch {
      // Invalid OAuth base URLs are rejected by getClientCredentials.
    }
  }

  return [...new Set(configuredDomains)]
}

function isAllowedDomain(hostname: string): boolean {
  const normalized = hostname.toLowerCase()
  return getAllowedDomains().some((allowed) =>
    allowed.startsWith("*.")
      ? normalized.endsWith(allowed.slice(1)) && normalized !== allowed.slice(2)
      : normalized === allowed,
  )
}

export function getCookie(request: Request, name: string): string | undefined {
  const cookieHeader = request.headers.get("cookie") ?? ""
  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))

  return cookie?.slice(name.length + 1)
}

function clearCookie(request: Request): string {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : ""
  return `${cookieName}=deleted; HttpOnly; Max-Age=0; Path=/; SameSite=Lax${secure}`
}

function serialize(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c")
}

export function authorizationResponse(
  request: Request,
  options: {
    provider?: string
    token?: string
    error?: string
    errorCode?: string
  },
): Response {
  const provider = options.provider ?? "github"
  const isError = Boolean(options.error)
  const state = isError ? "error" : "success"
  const content = isError
    ? { provider, error: options.error, errorCode: options.errorCode }
    : { provider, token: options.token }
  const trustedPatterns = getAllowedDomains().map((domain) => {
    const escaped = domain.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    return `^${escaped.replace(/\\\*/g, ".+")}$`
  })
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>GitHub authorization</title></head><body><script>
(() => {
  const provider = ${serialize(provider)};
  const trustedPatterns = ${serialize(trustedPatterns)};
  const hasToken = ${serialize(Boolean(options.token))};
  const payload = ${serialize(`authorization:${provider}:${state}:${JSON.stringify(content)}`)};
  const isTrusted = (origin) => {
    try {
      const { hostname } = new URL(origin);
      return trustedPatterns.some((pattern) => new RegExp(pattern).test(hostname));
    } catch {
      return false;
    }
  };
  window.addEventListener("message", ({ data, origin }) => {
    if (data !== \`authorizing:\${provider}\`) return;
    if (hasToken && !isTrusted(origin)) return;
    window.opener?.postMessage(payload, origin);
  });
  window.opener?.postMessage(\`authorizing:\${provider}\`, "*");
})();
</script></body></html>`

  return new Response(html, {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/html; charset=utf-8",
      "Set-Cookie": clearCookie(request),
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    },
  })
}

export function configurationError(request: Request): Response {
  return authorizationResponse(request, {
    error: "GitHub authorization is not configured for this deployment.",
    errorCode: "MISCONFIGURED_CLIENT",
  })
}

export function getClientCredentials(): {
  clientId: string
  clientSecret: string
  callbackUrl: string
} | null {
  const clientId = process.env.GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET
  const baseUrl = process.env.OAUTH_BASE_URL

  if (!clientId || !clientSecret || !baseUrl) return null

  try {
    const url = new URL(baseUrl)
    if (
      url.protocol !== "https:" ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    ) {
      return null
    }
    return {
      clientId,
      clientSecret,
      callbackUrl: new URL("/callback", url).toString(),
    }
  } catch {
    return null
  }
}

export function auth(request: Request): Response {
  const url = new URL(request.url)
  const provider = url.searchParams.get("provider") ?? ""
  const siteId = url.searchParams.get("site_id") ?? ""

  if (provider !== "github") {
    return authorizationResponse(request, {
      provider,
      error: "Only the GitHub backend is supported.",
      errorCode: "UNSUPPORTED_BACKEND",
    })
  }

  if (!siteId || !isAllowedDomain(siteId)) {
    return authorizationResponse(request, {
      error: "This site is not allowed to use the GitHub authenticator.",
      errorCode: "UNSUPPORTED_DOMAIN",
    })
  }

  const credentials = getClientCredentials()
  if (!credentials) {
    return configurationError(request)
  }

  const requestedScopes = (url.searchParams.get("scope") ?? "")
    .split(/[\s,]+/)
    .filter(Boolean)
  const scope =
    requestedScopes.length > 0 &&
    requestedScopes.every((item) => allowedScopes.has(item))
      ? requestedScopes.join(",")
      : "repo,user"
  const state = crypto.randomUUID().replace(/-/g, "")
  const authorizationUrl = new URL("https://github.com/login/oauth/authorize")
  authorizationUrl.search = new URLSearchParams({
    client_id: credentials.clientId,
    redirect_uri: credentials.callbackUrl,
    scope,
    state,
  }).toString()
  const secure = url.protocol === "https:" ? "; Secure" : ""

  return new Response(null, {
    status: 302,
    headers: {
      "Cache-Control": "no-store",
      Location: authorizationUrl.toString(),
      "Set-Cookie": `${cookieName}=github_${state}; HttpOnly; Path=/; Max-Age=600; SameSite=Lax${secure}`,
    },
  })
}

export async function callback(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const provider = "github"
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")
  const expectedCookie = getCookie(request, cookieName)
  const csrfToken = expectedCookie?.match(/^github_([a-f0-9]{32})$/)?.[1]

  if (url.searchParams.has("error")) {
    return authorizationResponse(request, {
      provider,
      error: "GitHub sign-in was cancelled or denied.",
      errorCode: "AUTH_CODE_REQUEST_FAILED",
    })
  }
  if (!code || !state) {
    return authorizationResponse(request, {
      provider,
      error: "GitHub did not return an authorization code.",
      errorCode: "AUTH_CODE_REQUEST_FAILED",
    })
  }
  if (!csrfToken || state !== csrfToken) {
    return authorizationResponse(request, {
      provider,
      error: "The sign-in request could not be verified. Please try again.",
      errorCode: "CSRF_DETECTED",
    })
  }

  const credentials = getClientCredentials()
  if (!credentials) {
    return configurationError(request)
  }

  try {
    const response = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          client_id: credentials.clientId,
          client_secret: credentials.clientSecret,
          redirect_uri: credentials.callbackUrl,
        }),
      },
    )

    if (!response.ok) {
      return authorizationResponse(request, {
        provider,
        error: "GitHub could not complete sign-in. Please try again.",
        errorCode: "TOKEN_REQUEST_FAILED",
      })
    }

    const result: unknown = await response.json()
    if (
      typeof result !== "object" ||
      result === null ||
      !("access_token" in result) ||
      typeof result.access_token !== "string" ||
      !result.access_token
    ) {
      return authorizationResponse(request, {
        provider,
        error: "GitHub returned an invalid sign-in response.",
        errorCode: "MALFORMED_RESPONSE",
      })
    }

    return authorizationResponse(request, {
      provider,
      token: result.access_token,
    })
  } catch (error) {
    console.error("GitHub OAuth token exchange failed.", error)
    return authorizationResponse(request, {
      provider,
      error: "GitHub could not complete sign-in. Please try again.",
      errorCode: "TOKEN_REQUEST_FAILED",
    })
  }
}
