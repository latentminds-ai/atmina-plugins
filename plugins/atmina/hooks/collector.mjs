import { existsSync as existsSync5 } from "node:fs";
import { homedir as homedir3 } from "node:os";
import { fileURLToPath } from "node:url";

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
var PERMITTED_SIDS = ["S-1-5-18", "S-1-5-32-544"];
function accessIsPrivate(access) {
  if (!access || !/^S-1-\d+(?:-\d+)+$/.test(access.user_sid))
    return false;
  return access.allowed_sids.every((sid) => sid === access.user_sid || PERMITTED_SIDS.includes(sid));
}
function nearestExisting(path) {
  let current = path;
  while (!existsSync(current)) {
    const parent = dirname(current);
    if (parent === current)
      break;
    current = parent;
  }
  return current;
}
var READ_ACCESS = [
  "$ErrorActionPreference = 'Stop'",
  "[Security.Principal.WindowsIdentity]::GetCurrent().User.Value",
  "$acl = [IO.Directory]::GetAccessControl($env:ATMINA_ACCESS_PATH)",
  "foreach ($rule in $acl.GetAccessRules($true, $true, [Security.Principal.SecurityIdentifier])) { if ($rule.AccessControlType -eq 'Allow') { $rule.IdentityReference.Value } }"
].join("; ");
var powershellAccessReader = (path) => {
  try {
    const windows = process.env.SystemRoot ?? "C:\\Windows";
    const output = execFileSync(join(windows, "System32", "WindowsPowerShell", "v1.0", "powershell.exe"), ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", READ_ACCESS], {
      encoding: "utf8",
      env: {
        ...Object.fromEntries(Object.entries(process.env).filter(([key]) => key.toLowerCase() !== "psmodulepath")),
        ATMINA_ACCESS_PATH: path
      },
      stdio: ["ignore", "pipe", "ignore"],
      windowsHide: true,
      timeout: 30000
    });
    const [user, ...allowed] = output.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    return user ? { user_sid: user, allowed_sids: allowed } : null;
  } catch {
    return null;
  }
};

import { readdirSync as readdirSync4, statSync as statSync3 } from "node:fs";
import { basename as basename3, join as join7 } from "node:path";

var jsonBodySerializer = {
  bodySerializer: (body) => JSON.stringify(body, (_key, value) => typeof value === "bigint" ? value.toString() : value)
};
var extraPrefixesMap = {
  $body_: "body",
  $headers_: "headers",
  $path_: "path",
  $query_: "query"
};
var extraPrefixes = Object.entries(extraPrefixesMap);
function createSseClient({
  onRequest,
  onSseError,
  onSseEvent,
  responseTransformer,
  responseValidator,
  sseDefaultRetryDelay,
  sseMaxRetryAttempts,
  sseMaxRetryDelay,
  sseSleepFn,
  url,
  ...options
}) {
  let lastEventId;
  const sleep = sseSleepFn ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  const createStream = async function* () {
    let retryDelay = sseDefaultRetryDelay ?? 3000;
    let attempt = 0;
    const signal = options.signal ?? new AbortController().signal;
    while (true) {
      if (signal.aborted)
        break;
      attempt++;
      const headers = options.headers instanceof Headers ? options.headers : new Headers(options.headers);
      if (lastEventId !== undefined) {
        headers.set("Last-Event-ID", lastEventId);
      }
      try {
        const requestInit = {
          redirect: "follow",
          ...options,
          body: options.serializedBody,
          headers,
          signal
        };
        let request = new Request(url, requestInit);
        if (onRequest) {
          request = await onRequest(url, requestInit);
        }
        const _fetch = options.fetch ?? globalThis.fetch;
        const response = await _fetch(request);
        if (!response.ok)
          throw new Error(`SSE failed: ${response.status} ${response.statusText}`);
        if (!response.body)
          throw new Error("No body in SSE response");
        const reader = response.body.pipeThrough(new TextDecoderStream).getReader();
        let buffer = "";
        const abortHandler = () => {
          try {
            reader.cancel();
          } catch {}
        };
        signal.addEventListener("abort", abortHandler);
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done)
              break;
            buffer += value;
            buffer = buffer.replace(/\r\n?/g, `
`);
            const chunks = buffer.split(`

`);
            buffer = chunks.pop() ?? "";
            for (const chunk of chunks) {
              const lines = chunk.split(`
`);
              const dataLines = [];
              let eventName;
              for (const line of lines) {
                if (line.startsWith("data:")) {
                  dataLines.push(line.replace(/^data:\s*/, ""));
                } else if (line.startsWith("event:")) {
                  eventName = line.replace(/^event:\s*/, "");
                } else if (line.startsWith("id:")) {
                  lastEventId = line.replace(/^id:\s*/, "");
                } else if (line.startsWith("retry:")) {
                  const parsed = Number.parseInt(line.replace(/^retry:\s*/, ""), 10);
                  if (!Number.isNaN(parsed)) {
                    retryDelay = parsed;
                  }
                }
              }
              let data;
              let parsedJson = false;
              if (dataLines.length) {
                const rawData = dataLines.join(`
`);
                try {
                  data = JSON.parse(rawData);
                  parsedJson = true;
                } catch {
                  data = rawData;
                }
              }
              if (parsedJson) {
                if (responseValidator) {
                  await responseValidator(data);
                }
                if (responseTransformer) {
                  data = await responseTransformer(data);
                }
              }
              onSseEvent?.({
                data,
                event: eventName,
                id: lastEventId,
                retry: retryDelay
              });
              if (dataLines.length) {
                yield data;
              }
            }
          }
        } finally {
          signal.removeEventListener("abort", abortHandler);
          reader.releaseLock();
        }
        break;
      } catch (error) {
        onSseError?.(error);
        if (sseMaxRetryAttempts !== undefined && attempt >= sseMaxRetryAttempts) {
          break;
        }
        const backoff = Math.min(retryDelay * 2 ** (attempt - 1), sseMaxRetryDelay ?? 30000);
        await sleep(backoff);
      }
    }
  };
  const stream = createStream();
  return { stream };
}

var separatorArrayExplode = (style) => {
  switch (style) {
    case "label":
      return ".";
    case "matrix":
      return ";";
    case "simple":
      return ",";
    default:
      return "&";
  }
};
var separatorArrayNoExplode = (style) => {
  switch (style) {
    case "form":
      return ",";
    case "pipeDelimited":
      return "|";
    case "spaceDelimited":
      return "%20";
    default:
      return ",";
  }
};
var separatorObjectExplode = (style) => {
  switch (style) {
    case "label":
      return ".";
    case "matrix":
      return ";";
    case "simple":
      return ",";
    default:
      return "&";
  }
};
var serializeArrayParam = ({
  allowReserved,
  explode,
  name,
  style,
  value
}) => {
  if (!explode) {
    const joinedValues2 = (allowReserved ? value : value.map((v) => encodeURIComponent(v))).join(separatorArrayNoExplode(style));
    switch (style) {
      case "label":
        return `.${joinedValues2}`;
      case "matrix":
        return `;${name}=${joinedValues2}`;
      case "simple":
        return joinedValues2;
      default:
        return `${name}=${joinedValues2}`;
    }
  }
  const separator = separatorArrayExplode(style);
  const joinedValues = value.map((v) => {
    if (style === "label" || style === "simple") {
      return allowReserved ? v : encodeURIComponent(v);
    }
    return serializePrimitiveParam({
      allowReserved,
      name,
      value: v
    });
  }).join(separator);
  return style === "label" || style === "matrix" ? separator + joinedValues : joinedValues;
};
var serializePrimitiveParam = ({
  allowReserved,
  name,
  value
}) => {
  if (value === undefined || value === null) {
    return "";
  }
  if (typeof value === "object") {
    throw new Error("Deeply-nested arrays/objects aren’t supported. Provide your own `querySerializer()` to handle these.");
  }
  return `${name}=${allowReserved ? value : encodeURIComponent(value)}`;
};
var serializeObjectParam = ({
  allowReserved,
  explode,
  name,
  style,
  value,
  valueOnly
}) => {
  if (value instanceof Date) {
    return valueOnly ? value.toISOString() : `${name}=${value.toISOString()}`;
  }
  if (style !== "deepObject" && !explode) {
    let values = [];
    Object.entries(value).forEach(([key, v]) => {
      values = [...values, key, allowReserved ? v : encodeURIComponent(v)];
    });
    const joinedValues2 = values.join(",");
    switch (style) {
      case "form":
        return `${name}=${joinedValues2}`;
      case "label":
        return `.${joinedValues2}`;
      case "matrix":
        return `;${name}=${joinedValues2}`;
      default:
        return joinedValues2;
    }
  }
  const separator = separatorObjectExplode(style);
  const joinedValues = Object.entries(value).map(([key, v]) => serializePrimitiveParam({
    allowReserved,
    name: style === "deepObject" ? `${name}[${key}]` : key,
    value: v
  })).join(separator);
  return style === "label" || style === "matrix" ? separator + joinedValues : joinedValues;
};

var PATH_PARAM_RE = /\{[^{}]+\}/g;
var defaultPathSerializer = ({ path, url: _url }) => {
  let url = _url;
  const matches = _url.match(PATH_PARAM_RE);
  if (matches) {
    for (const match of matches) {
      let explode = false;
      let name = match.substring(1, match.length - 1);
      let style = "simple";
      if (name.endsWith("*")) {
        explode = true;
        name = name.substring(0, name.length - 1);
      }
      if (name.startsWith(".")) {
        name = name.substring(1);
        style = "label";
      } else if (name.startsWith(";")) {
        name = name.substring(1);
        style = "matrix";
      }
      const value = path[name];
      if (value === undefined || value === null) {
        continue;
      }
      if (Array.isArray(value)) {
        url = url.replace(match, serializeArrayParam({ explode, name, style, value }));
        continue;
      }
      if (typeof value === "object") {
        url = url.replace(match, serializeObjectParam({
          explode,
          name,
          style,
          value,
          valueOnly: true
        }));
        continue;
      }
      if (style === "matrix") {
        url = url.replace(match, `;${serializePrimitiveParam({
          name,
          value
        })}`);
        continue;
      }
      const replaceValue = encodeURIComponent(style === "label" ? `.${value}` : value);
      url = url.replace(match, replaceValue);
    }
  }
  return url;
};
var getUrl = ({
  baseUrl,
  path,
  query,
  querySerializer,
  url: _url
}) => {
  const pathUrl = _url.startsWith("/") ? _url : `/${_url}`;
  let url = (baseUrl ?? "") + pathUrl;
  if (path) {
    url = defaultPathSerializer({ path, url });
  }
  let search = query ? querySerializer(query) : "";
  if (search.startsWith("?")) {
    search = search.substring(1);
  }
  if (search) {
    url += `?${search}`;
  }
  return url;
};
function getValidRequestBody(options) {
  const hasBody = options.body !== undefined;
  const isSerializedBody = hasBody && options.bodySerializer;
  if (isSerializedBody) {
    if ("serializedBody" in options) {
      const hasSerializedBody = options.serializedBody !== undefined && options.serializedBody !== "";
      return hasSerializedBody ? options.serializedBody : null;
    }
    return options.body !== "" ? options.body : null;
  }
  if (hasBody) {
    return options.body;
  }
  return;
}

var getAuthToken = async (auth, callback) => {
  const token = typeof callback === "function" ? await callback(auth) : callback;
  if (!token) {
    return;
  }
  if (auth.scheme === "bearer") {
    return `Bearer ${token}`;
  }
  if (auth.scheme === "basic") {
    return `Basic ${btoa(token)}`;
  }
  return token;
};

var createQuerySerializer = ({
  parameters = {},
  ...args
} = {}) => {
  const querySerializer = (queryParams) => {
    const search = [];
    if (queryParams && typeof queryParams === "object") {
      for (const name in queryParams) {
        const value = queryParams[name];
        if (value === undefined || value === null) {
          continue;
        }
        const options = parameters[name] || args;
        if (Array.isArray(value)) {
          const serializedArray = serializeArrayParam({
            allowReserved: options.allowReserved,
            explode: true,
            name,
            style: "form",
            value,
            ...options.array
          });
          if (serializedArray)
            search.push(serializedArray);
        } else if (typeof value === "object") {
          const serializedObject = serializeObjectParam({
            allowReserved: options.allowReserved,
            explode: true,
            name,
            style: "deepObject",
            value,
            ...options.object
          });
          if (serializedObject)
            search.push(serializedObject);
        } else {
          const serializedPrimitive = serializePrimitiveParam({
            allowReserved: options.allowReserved,
            name,
            value
          });
          if (serializedPrimitive)
            search.push(serializedPrimitive);
        }
      }
    }
    return search.join("&");
  };
  return querySerializer;
};
var getParseAs = (contentType) => {
  if (!contentType) {
    return "stream";
  }
  const cleanContent = contentType.split(";")[0]?.trim();
  if (!cleanContent) {
    return;
  }
  if (cleanContent.startsWith("application/json") || cleanContent.endsWith("+json")) {
    return "json";
  }
  if (cleanContent === "multipart/form-data") {
    return "formData";
  }
  if (["application/", "audio/", "image/", "video/"].some((type) => cleanContent.startsWith(type))) {
    return "blob";
  }
  if (cleanContent.startsWith("text/")) {
    return "text";
  }
  return;
};
var checkForExistence = (options, name) => {
  if (!name) {
    return false;
  }
  if (options.headers.has(name) || options.query?.[name] || options.headers.get("Cookie")?.includes(`${name}=`)) {
    return true;
  }
  return false;
};
async function setAuthParams(options) {
  for (const auth of options.security ?? []) {
    if (checkForExistence(options, auth.name)) {
      continue;
    }
    const token = await getAuthToken(auth, options.auth);
    if (!token) {
      continue;
    }
    const name = auth.name ?? "Authorization";
    switch (auth.in) {
      case "query":
        if (!options.query) {
          options.query = {};
        }
        options.query[name] = token;
        break;
      case "cookie":
        options.headers.append("Cookie", `${name}=${token}`);
        break;
      case "header":
      default:
        options.headers.set(name, token);
        break;
    }
  }
}
var buildUrl = (options) => getUrl({
  baseUrl: options.baseUrl,
  path: options.path,
  query: options.query,
  querySerializer: typeof options.querySerializer === "function" ? options.querySerializer : createQuerySerializer(options.querySerializer),
  url: options.url
});
var mergeConfigs = (a, b) => {
  const config = { ...a, ...b };
  if (config.baseUrl?.endsWith("/")) {
    config.baseUrl = config.baseUrl.substring(0, config.baseUrl.length - 1);
  }
  config.headers = mergeHeaders(a.headers, b.headers);
  return config;
};
var headersEntries = (headers) => {
  const entries = [];
  headers.forEach((value, key) => {
    entries.push([key, value]);
  });
  return entries;
};
var mergeHeaders = (...headers) => {
  const mergedHeaders = new Headers;
  for (const header of headers) {
    if (!header) {
      continue;
    }
    const iterator = header instanceof Headers ? headersEntries(header) : Object.entries(header);
    for (const [key, value] of iterator) {
      if (value === null) {
        mergedHeaders.delete(key);
      } else if (Array.isArray(value)) {
        for (const v of value) {
          mergedHeaders.append(key, v);
        }
      } else if (value !== undefined) {
        mergedHeaders.set(key, typeof value === "object" ? JSON.stringify(value) : value);
      }
    }
  }
  return mergedHeaders;
};

class Interceptors {
  fns = [];
  clear() {
    this.fns = [];
  }
  eject(id) {
    const index = this.getInterceptorIndex(id);
    if (this.fns[index]) {
      this.fns[index] = null;
    }
  }
  exists(id) {
    const index = this.getInterceptorIndex(id);
    return Boolean(this.fns[index]);
  }
  getInterceptorIndex(id) {
    if (typeof id === "number") {
      return this.fns[id] ? id : -1;
    }
    return this.fns.indexOf(id);
  }
  update(id, fn) {
    const index = this.getInterceptorIndex(id);
    if (this.fns[index]) {
      this.fns[index] = fn;
      return id;
    }
    return false;
  }
  use(fn) {
    this.fns.push(fn);
    return this.fns.length - 1;
  }
}
var createInterceptors = () => ({
  error: new Interceptors,
  request: new Interceptors,
  response: new Interceptors
});
var defaultQuerySerializer = createQuerySerializer({
  allowReserved: false,
  array: {
    explode: true,
    style: "form"
  },
  object: {
    explode: true,
    style: "deepObject"
  }
});
var defaultHeaders = {
  "Content-Type": "application/json"
};
var createConfig = (override = {}) => ({
  ...jsonBodySerializer,
  headers: defaultHeaders,
  parseAs: "auto",
  querySerializer: defaultQuerySerializer,
  ...override
});

var createClient = (config = {}) => {
  let _config = mergeConfigs(createConfig(), config);
  const getConfig = () => ({ ..._config });
  const setConfig = (config2) => {
    _config = mergeConfigs(_config, config2);
    return getConfig();
  };
  const interceptors = createInterceptors();
  const beforeRequest = async (options) => {
    const opts = {
      ..._config,
      ...options,
      fetch: options.fetch ?? _config.fetch ?? globalThis.fetch,
      headers: mergeHeaders(_config.headers, options.headers),
      serializedBody: undefined
    };
    if (opts.security) {
      await setAuthParams(opts);
    }
    if (opts.requestValidator) {
      await opts.requestValidator(opts);
    }
    if (opts.body !== undefined && opts.bodySerializer) {
      opts.serializedBody = opts.bodySerializer(opts.body);
    }
    if (opts.body === undefined || opts.serializedBody === "") {
      opts.headers.delete("Content-Type");
    }
    const resolvedOpts = opts;
    const url = buildUrl(resolvedOpts);
    return { opts: resolvedOpts, url };
  };
  const request = async (options) => {
    const throwOnError = options.throwOnError ?? _config.throwOnError;
    const responseStyle = options.responseStyle ?? _config.responseStyle;
    let request2;
    let response;
    try {
      const { opts, url } = await beforeRequest(options);
      const requestInit = {
        redirect: "follow",
        ...opts,
        body: getValidRequestBody(opts)
      };
      request2 = new Request(url, requestInit);
      for (const fn of interceptors.request.fns) {
        if (fn) {
          request2 = await fn(request2, opts);
        }
      }
      const _fetch = opts.fetch;
      response = await _fetch(request2);
      for (const fn of interceptors.response.fns) {
        if (fn) {
          response = await fn(response, request2, opts);
        }
      }
      const result = {
        request: request2,
        response
      };
      if (response.ok) {
        const parseAs = (opts.parseAs === "auto" ? getParseAs(response.headers.get("Content-Type")) : opts.parseAs) ?? "json";
        if (response.status === 204 || response.headers.get("Content-Length") === "0") {
          let emptyData;
          switch (parseAs) {
            case "arrayBuffer":
            case "blob":
            case "text":
              emptyData = await response[parseAs]();
              break;
            case "formData":
              emptyData = new FormData;
              break;
            case "stream":
              emptyData = response.body;
              break;
            case "json":
            default:
              emptyData = {};
              break;
          }
          return opts.responseStyle === "data" ? emptyData : {
            data: emptyData,
            ...result
          };
        }
        let data;
        switch (parseAs) {
          case "arrayBuffer":
          case "blob":
          case "formData":
          case "text":
            data = await response[parseAs]();
            break;
          case "json": {
            const text = await response.text();
            data = text ? JSON.parse(text) : {};
            break;
          }
          case "stream":
            return opts.responseStyle === "data" ? response.body : {
              data: response.body,
              ...result
            };
        }
        if (parseAs === "json") {
          if (opts.responseValidator) {
            await opts.responseValidator(data);
          }
          if (opts.responseTransformer) {
            data = await opts.responseTransformer(data);
          }
        }
        return opts.responseStyle === "data" ? data : {
          data,
          ...result
        };
      }
      const textError = await response.text();
      let jsonError;
      try {
        jsonError = JSON.parse(textError);
      } catch {}
      throw jsonError ?? textError;
    } catch (error) {
      let finalError = error;
      for (const fn of interceptors.error.fns) {
        if (fn) {
          finalError = await fn(finalError, response, request2, options);
        }
      }
      finalError = finalError || {};
      if (throwOnError) {
        throw finalError;
      }
      return responseStyle === "data" ? undefined : {
        error: finalError,
        request: request2,
        response
      };
    }
  };
  const makeMethodFn = (method) => (options) => request({ ...options, method });
  const makeSseFn = (method) => async (options) => {
    const { opts, url } = await beforeRequest(options);
    return createSseClient({
      ...opts,
      body: opts.body,
      method,
      onRequest: async (url2, init) => {
        let request2 = new Request(url2, init);
        for (const fn of interceptors.request.fns) {
          if (fn) {
            request2 = await fn(request2, opts);
          }
        }
        return request2;
      },
      serializedBody: getValidRequestBody(opts),
      url
    });
  };
  const _buildUrl = (options) => buildUrl({ ..._config, ...options });
  return {
    buildUrl: _buildUrl,
    connect: makeMethodFn("CONNECT"),
    delete: makeMethodFn("DELETE"),
    get: makeMethodFn("GET"),
    getConfig,
    head: makeMethodFn("HEAD"),
    interceptors,
    options: makeMethodFn("OPTIONS"),
    patch: makeMethodFn("PATCH"),
    post: makeMethodFn("POST"),
    put: makeMethodFn("PUT"),
    request,
    setConfig,
    sse: {
      connect: makeSseFn("CONNECT"),
      delete: makeSseFn("DELETE"),
      get: makeSseFn("GET"),
      head: makeSseFn("HEAD"),
      options: makeSseFn("OPTIONS"),
      patch: makeSseFn("PATCH"),
      post: makeSseFn("POST"),
      put: makeSseFn("PUT"),
      trace: makeSseFn("TRACE")
    },
    trace: makeMethodFn("TRACE")
  };
};
var client = createClient(createConfig());

var activateMcpConnection = (options) => (options?.client ?? client).post({
  security: [{ scheme: "bearer", type: "http" }],
  url: "/api/v1/account/mcp-connections/activate",
  ...options
});
var registerCaptureSession = (options) => (options.client ?? client).post({
  security: [{ scheme: "bearer", type: "http" }],
  url: "/api/v1/sessions/ingest",
  ...options,
  headers: {
    "Content-Type": "application/json",
    ...options.headers
  }
});
var confirmCaptureUploads = (options) => (options.client ?? client).post({
  security: [{ scheme: "bearer", type: "http" }],
  url: "/api/v1/sessions/uploads/confirm",
  ...options,
  headers: {
    "Content-Type": "application/json",
    ...options.headers
  }
});
var requestCaptureUploads = (options) => (options.client ?? client).post({
  security: [{ scheme: "bearer", type: "http" }],
  url: "/api/v1/sessions/uploads/request",
  ...options,
  headers: {
    "Content-Type": "application/json",
    ...options.headers
  }
});
var getWhoami = (options) => (options?.client ?? client).get({
  security: [{ scheme: "bearer", type: "http" }],
  url: "/api/v1/whoami",
  ...options
});
var getVersion = (options) => (options?.client ?? client).get({ url: "/version", ...options });

var COLLECTOR_CLIENT_ID = "atmina-collector";
var COLLECTOR_SCOPES = "offline_access mcp:read mcp:write";
var DEVICE_CODE_GRANT = "urn:ietf:params:oauth:grant-type:device_code";
var DEVICE_AUTHORIZATION_PATH = "/api/auth/device/code";
var TOKEN_PATH = "/api/auth/oauth2/token";
var REQUIRED_CONTRACT = { major: 2, minor: 2 };
var CAPTURE_CAPABILITY = "session.capture";
var MINIMUM_DEVICE_INTERVAL_S = 1;
var RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);
var RETRY_BASE_MS = 500;
var RETRY_CAP_MS = 30000;
var RETRY_ATTEMPTS = 5;
var REGISTER_REFUSALS = [
  "validation_error",
  "out_of_bounds",
  "history_boundary_unproven",
  "local_capture_disabled",
  "adapter_not_admitted",
  "not_a_member",
  "not_enrolled",
  "native_id_held",
  "episode_expiring",
  "parent_not_registered",
  "internal_error",
  "rate_limited"
];
var REQUEST_REFUSALS = [
  "validation_error",
  "report_invalid",
  "incomplete_artifact_set",
  "history_boundary_unproven",
  "local_capture_disabled",
  "adapter_not_admitted",
  "not_a_member",
  "not_enrolled",
  "native_id_held",
  "episode_expiring",
  "forbidden",
  "not_found",
  "stale_revision",
  "revision_conflict",
  "payload_too_large",
  "internal_error",
  "provisioning",
  "rate_limited"
];
var CONFIRM_REFUSALS = [
  "validation_error",
  "report_invalid",
  "incomplete_artifact_set",
  "out_of_bounds",
  "history_boundary_unproven",
  "local_capture_disabled",
  "adapter_not_admitted",
  "not_a_member",
  "not_enrolled",
  "native_id_held",
  "episode_expiring",
  "forbidden",
  "not_found",
  "stale_revision",
  "revision_conflict",
  "artifact_mismatch",
  "manifest_mismatch",
  "payload_too_large",
  "internal_error",
  "provisioning",
  "rate_limited"
];
var PUBLISHED_REFUSALS = {
  register: REGISTER_REFUSALS,
  request: REQUEST_REFUSALS,
  confirm: CONFIRM_REFUSALS
};
function publishedRefusal(operation, code) {
  return PUBLISHED_REFUSALS[operation].includes(code) ? code : "unknown_refusal";
}
function uploadUrlAllowed(url, origin) {
  let target;
  let stage;
  try {
    target = new URL(url);
    stage = new URL(origin);
  } catch {
    return false;
  }
  if (target.protocol === "https:")
    return true;
  const loopback = (host) => host === "127.0.0.1" || host === "localhost";
  return target.protocol === "http:" && stage.protocol === "http:" && loopback(target.hostname) && loopback(stage.hostname);
}
function compatibleVersion(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version.contract_version);
  if (!match)
    return false;
  const [major, minor] = [Number(match[1]), Number(match[2])];
  return major === REQUIRED_CONTRACT.major && minor >= REQUIRED_CONTRACT.minor && version.enabled_capabilities.includes(CAPTURE_CAPABILITY);
}
function backoffMs(attempt, random, retryAfterSeconds) {
  const ceiling = Math.min(RETRY_CAP_MS, RETRY_BASE_MS * 2 ** attempt);
  const jittered = Math.floor(random() * ceiling);
  return Math.min(RETRY_CAP_MS, Math.max(jittered, (retryAfterSeconds ?? 0) * 1000));
}
function errorCode(error, status) {
  if (error !== null && typeof error === "object" && typeof error.error === "string")
    return error.error;
  return `http_${status}`;
}
function retryAfter(error) {
  const value = error !== null && typeof error === "object" ? error.retry_after_s : undefined;
  return typeof value === "number" && value >= 0 ? value : undefined;
}
async function form(ports, path, fields) {
  try {
    const response = await ports.fetch(new URL(path, ports.origin), {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        accept: "application/json"
      },
      body: new URLSearchParams(fields).toString()
    });
    const text = await response.text();
    let body = {};
    try {
      body = text ? JSON.parse(text) : {};
    } catch {
      body = {};
    }
    return {
      status: response.status,
      body: body !== null && typeof body === "object" ? body : {}
    };
  } catch {
    return null;
  }
}
function tokenCredential(body, now, previousRefresh) {
  const access = body.access_token;
  const refresh = body.refresh_token ?? previousRefresh;
  const expiresIn = typeof body.expires_in === "number" ? body.expires_in : 0;
  if (typeof access !== "string" || !access || typeof refresh !== "string")
    return null;
  return {
    access_token: access,
    refresh_token: refresh,
    expires_at: now + expiresIn * 1000
  };
}
async function authorizeDevice(ports, show) {
  const started = await form(ports, DEVICE_AUTHORIZATION_PATH, {
    client_id: COLLECTOR_CLIENT_ID,
    scope: COLLECTOR_SCOPES,
    resource: ports.origin
  });
  const body = started?.body ?? {};
  const deviceCode = body.device_code;
  const userCode = body.user_code;
  const uri = body.verification_uri_complete ?? body.verification_uri;
  if (started?.status !== 200 || typeof deviceCode !== "string" || typeof userCode !== "string" || typeof uri !== "string")
    return { kind: "refused", state: "server_unreachable" };
  show(uri, userCode);
  let interval = Math.max(MINIMUM_DEVICE_INTERVAL_S, typeof body.interval === "number" ? body.interval : 5);
  const deadline = ports.now() + (typeof body.expires_in === "number" ? body.expires_in : 900) * 1000;
  while (ports.now() < deadline) {
    await ports.sleep(interval * 1000);
    const polled = await form(ports, TOKEN_PATH, {
      grant_type: DEVICE_CODE_GRANT,
      device_code: deviceCode,
      client_id: COLLECTOR_CLIENT_ID,
      resource: ports.origin
    });
    if (!polled)
      continue;
    if (polled.status === 200) {
      const credential = tokenCredential(polled.body, ports.now());
      return credential ? { kind: "authorized", credential } : { kind: "refused", state: "server_unreachable" };
    }
    const error = polled.body.error;
    if (error === "authorization_pending")
      continue;
    if (error === "slow_down") {
      interval += 5;
      continue;
    }
    if (error === "access_denied")
      return { kind: "refused", state: "authorization_denied" };
    return { kind: "refused", state: "authorization_expired" };
  }
  return { kind: "refused", state: "authorization_expired" };
}

class CaptureApi {
  ports;
  credentials;
  client;
  constructor(ports, credentials) {
    this.ports = ports;
    this.credentials = credentials;
    this.client = createClient(createConfig({ baseUrl: ports.origin, fetch: ports.fetch }));
  }
  async refresh() {
    const current = this.credentials.read();
    if (!current)
      return "rejected";
    const exchanged = await form(this.ports, TOKEN_PATH, {
      grant_type: "refresh_token",
      refresh_token: current.refresh_token,
      client_id: COLLECTOR_CLIENT_ID,
      resource: this.ports.origin
    });
    if (!exchanged)
      return "unavailable";
    if (RETRYABLE_STATUSES.has(exchanged.status))
      return "unavailable";
    if (exchanged.body.error === "invalid_grant")
      return "revoked";
    const credential = exchanged.status === 200 ? tokenCredential(exchanged.body, this.ports.now(), current.refresh_token) : null;
    if (!credential)
      return "rejected";
    this.credentials.write(credential);
    return "refreshed";
  }
  async call(attempt, authenticated = true, operation) {
    let refreshed = false;
    for (let tries = 0;tries < RETRY_ATTEMPTS; tries++) {
      const token = authenticated ? this.credentials.read()?.access_token : undefined;
      if (authenticated && !token)
        return { kind: "unauthorized" };
      let result;
      try {
        result = await attempt(token);
      } catch {
        result = {};
      }
      const status = result.response?.status;
      if (status !== undefined && result.response.ok)
        return { kind: "ok", data: result.data };
      if (status === 401 && authenticated) {
        if (refreshed)
          return { kind: "unauthorized" };
        refreshed = true;
        const outcome = await this.refresh();
        if (outcome === "rejected")
          return { kind: "unauthorized" };
        if (outcome === "revoked")
          return { kind: "revoked" };
        if (outcome === "refreshed") {
          tries--;
          continue;
        }
      } else if (status !== undefined && !RETRYABLE_STATUSES.has(status)) {
        const code = errorCode(result.error, status);
        return {
          kind: "refused",
          status,
          code: operation ? publishedRefusal(operation, code) : code
        };
      }
      if (tries + 1 < RETRY_ATTEMPTS)
        await this.ports.sleep(backoffMs(tries, this.ports.random, retryAfter(result.error)));
    }
    return { kind: "unavailable" };
  }
  version() {
    return this.call(() => getVersion({ client: this.client }), false);
  }
  async preflight() {
    const outcome = await this.version();
    if (outcome.kind === "unavailable")
      return "unavailable";
    return outcome.kind === "ok" && compatibleVersion(outcome.data) ? "compatible" : "incompatible_api";
  }
  activate() {
    return this.call((auth) => activateMcpConnection({ client: this.client, auth }));
  }
  whoami() {
    return this.call((auth) => getWhoami({ client: this.client, auth }));
  }
  register(body) {
    return this.call((auth) => registerCaptureSession({ client: this.client, auth, body }), true, "register");
  }
  requestUploads(body) {
    return this.call((auth) => requestCaptureUploads({ client: this.client, auth, body }), true, "request");
  }
  confirm(body) {
    return this.call((auth) => confirmCaptureUploads({ client: this.client, auth, body }), true, "confirm");
  }
  put(url, headers, bytes) {
    return this.call(async () => {
      const response = await this.ports.fetch(url, {
        method: "PUT",
        headers,
        body: bytes
      });
      await response.arrayBuffer().catch(() => {
        return;
      });
      return { response, data: null };
    }, false);
  }
}

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join as join2, posix, win32 } from "node:path";

var CAPTURE_EVENT_TAGS = {
  SessionStart: "s",
  SessionEnd: "e"
};

import { realpathSync } from "node:fs";
var currentPlatform = () => process.platform === "win32" ? "win32" : "posix";
var nativeRealPath = (path) => realpathSync.native(path);
function isUncPath(path) {
  const slashed = path.replaceAll("\\", "/");
  if (/^\/\/\?\/[A-Za-z]:/.test(slashed))
    return false;
  return slashed.startsWith("//");
}
function canonicalPath(path, platform, realpath = nativeRealPath) {
  if (!path)
    return null;
  let resolved;
  try {
    resolved = realpath(path);
  } catch {
    return null;
  }
  if (platform !== "win32")
    return resolved.replace(/(.)\/+$/, "$1");
  let slashed = resolved.replaceAll("\\", "/");
  if (slashed.startsWith("//?/UNC/"))
    slashed = `//${slashed.slice(8)}`;
  else if (slashed.startsWith("//?/"))
    slashed = slashed.slice(4);
  slashed = slashed.replace(/^([a-z]):/, (_, drive) => `${drive.toUpperCase()}:`);
  return slashed.replace(/([^:/])\/+$/, "$1");
}
function segments(path) {
  return path.split("/").filter((segment) => segment !== "");
}
function withinRoot(path, root, platform) {
  const fold = (value) => platform === "win32" ? value.toUpperCase() : value;
  if (path.startsWith("//") !== root.startsWith("//"))
    return false;
  const inside = segments(path);
  const outer = segments(root);
  if (outer.length > inside.length)
    return false;
  return outer.every((segment, index) => fold(segment) === fold(inside[index]));
}
function admittedCwd(cwd, roots, platform, realpath = nativeRealPath) {
  const canonical = canonicalPath(cwd, platform, realpath);
  return canonical !== null && roots.some((root) => withinRoot(canonical, root, platform));
}

var PART_STALE_MS = 60000;
var SESSION_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
var TAG_EVENTS = new Map(Object.entries(CAPTURE_EVENT_TAGS).map(([event, tag]) => [tag, event]));
var FILE_NAME = new RegExp(`(?:^|[\\\\/])([${Object.values(CAPTURE_EVENT_TAGS).join("")}])-[0-9a-f]{32}\\.json$`);
function nativeHookPath(path, platform) {
  if (platform !== "win32")
    return posix.isAbsolute(path) ? path : null;
  const msys = /^\/([A-Za-z])(?:\/(.*))?$/.exec(path);
  if (msys)
    return win32.normalize(`${msys[1].toUpperCase()}:\\${msys[2] ?? ""}`);
  if (path.startsWith("/") || !win32.isAbsolute(path))
    return null;
  return win32.normalize(path);
}
function parseMarker(file, bytes, observedAt, platform = currentPlatform()) {
  const event = TAG_EVENTS.get(FILE_NAME.exec(file)?.[1] ?? "");
  let input;
  try {
    input = JSON.parse(bytes);
  } catch {
    return null;
  }
  if (!event || input === null || typeof input !== "object")
    return null;
  const value = input;
  const text = (key) => typeof value[key] === "string" ? value[key] : null;
  const sessionId = text("session_id");
  const transcript = nativeHookPath(text("transcript_path") ?? "", platform);
  const cwd = text("cwd");
  if (text("hook_event_name") !== event || !sessionId || !SESSION_ID.test(sessionId) || !transcript || !transcript.endsWith(".jsonl") || cwd === null)
    return null;
  return {
    file,
    event,
    session_id: sessionId.toLowerCase(),
    transcript_path: transcript,
    cwd: nativeHookPath(cwd, platform) ?? "",
    source: text("source"),
    reason: text("reason"),
    observed_at: observedAt
  };
}
function readInbox(inbox) {
  let names;
  try {
    names = readdirSync(inbox);
  } catch {
    return { markers: [], rejected: [] };
  }
  const markers = [];
  const rejected = [];
  for (const name of names) {
    if (!name.endsWith(".json"))
      continue;
    const file = join2(inbox, name);
    try {
      const marker = parseMarker(file, readFileSync(file, "utf8"), statSync(file).mtimeMs);
      if (marker)
        markers.push(marker);
      else
        rejected.push(file);
    } catch {
      rejected.push(file);
    }
  }
  markers.sort((a, b) => a.observed_at - b.observed_at || (a.event === b.event ? 0 : a.event === "SessionStart" ? -1 : 1));
  return { markers, rejected };
}
function removeStaleParts(inbox, now, remove) {
  let removed = 0;
  let names;
  try {
    names = readdirSync(inbox);
  } catch {
    return 0;
  }
  for (const name of names) {
    if (!name.endsWith(".part"))
      continue;
    const file = join2(inbox, name);
    try {
      if (now - statSync(file).mtimeMs > PART_STALE_MS) {
        remove(file);
        removed++;
      }
    } catch {}
  }
  return removed;
}

import { readFileSync as readFileSync2, renameSync, rmSync } from "node:fs";
var HELD_FILE_CODES = ["EPERM", "EACCES", "EBUSY"];
var LOCAL_IO_RETRY_DELAYS_MS = [50, 100, 200, 400, 800, 1600];
var pauseCell = new Int32Array(new SharedArrayBuffer(4));
var nodeLocalIo = {
  read: (path) => readFileSync2(path),
  rename: (from, to) => renameSync(from, to),
  remove: (path) => rmSync(path, { recursive: true, force: true }),
  pause: (ms) => {
    Atomics.wait(pauseCell, 0, 0, ms);
  }
};

class LocalIoBusy extends Error {
  code;
  constructor(code) {
    super("local_io_busy");
    this.code = code;
  }
}
function heldFileCode(error) {
  const code = error?.code;
  return typeof code === "string" && HELD_FILE_CODES.includes(code) ? code : null;
}
function withHeldFileRetry(io, operation, retried) {
  let counted = false;
  for (let attempt = 0;; attempt++) {
    try {
      operation();
      return;
    } catch (error) {
      const code = heldFileCode(error);
      if (!code)
        throw error;
      if (!counted) {
        counted = true;
        retried();
      }
      const delay = LOCAL_IO_RETRY_DELAYS_MS[attempt];
      if (delay === undefined)
        throw new LocalIoBusy(code);
      io.pause(delay);
    }
  }
}

import {
  closeSync,
  openSync,
  readFileSync as readFileSync3,
  renameSync as renameSync3,
  rmSync as rmSync3,
  statSync as statSync2,
  utimesSync,
  writeSync
} from "node:fs";

import { createHash, randomBytes } from "node:crypto";
import { chmodSync, mkdirSync, renameSync as renameSync2, rmSync as rmSync2, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname as dirname2, isAbsolute, join as join3 } from "node:path";

var PLUGIN_NAME = "atmina";
var MARKETPLACE_NAME = "atmina";
var CURSOR_PLUGIN_DIR = "plugins/atmina-cursor";
var CURSOR_LOGO_REL = `${CURSOR_PLUGIN_DIR}/assets/logo.svg`;

var PLUGIN_DATA_ID = `${PLUGIN_NAME}@${MARKETPLACE_NAME}`.replace(/[^A-Za-z0-9_-]/g, "-");
function documentedPluginDataDirectory(env, home = homedir()) {
  const config = env.CLAUDE_CONFIG_DIR || (home ? join3(home, ".claude") : "");
  if (!config || !isAbsolute(config))
    return null;
  return join3(config, "plugins", "data", PLUGIN_DATA_ID);
}
function resolveDataDirectory(env, home = homedir()) {
  const hook = env.CLAUDE_PLUGIN_DATA;
  if (hook !== undefined && hook !== "")
    return isAbsolute(hook) ? hook : null;
  return documentedPluginDataDirectory(env, home);
}
function claudeProjectsDirectory(env, home = homedir()) {
  const config = env.CLAUDE_CONFIG_DIR || (home ? join3(home, ".claude") : "");
  if (!config || !isAbsolute(config))
    return null;
  return join3(config, "projects");
}
function layout(data) {
  const root = join3(data, "collector");
  return {
    data,
    root,
    config: join3(root, "config.json"),
    admission: join3(root, "admission.json"),
    credential: join3(root, "credential.json"),
    runtime: join3(root, "runtime"),
    lock: join3(root, "lock"),
    status: join3(root, "status.json"),
    inbox: join3(root, "inbox"),
    sessions: join3(root, "sessions"),
    spool: join3(root, "spool"),
    deletions: join3(root, "deletions.json")
  };
}
function hashedName(value) {
  return createHash("sha256").update(value).digest("hex").slice(0, 32);
}
function sha256Hex(value) {
  return createHash("sha256").update(value).digest("hex");
}
function randomHex(bytes) {
  return randomBytes(bytes).toString("hex");
}
var PRIVATE_FILE_MODE = 384;
var PRIVATE_DIRECTORY_MODE = 448;
function makePrivateDirectory(path) {
  mkdirSync(path, { recursive: true, mode: PRIVATE_DIRECTORY_MODE });
  chmodSync(path, PRIVATE_DIRECTORY_MODE);
}
function writeAtomic(path, content, rename = renameSync2) {
  makePrivateDirectory(dirname2(path));
  const part = join3(dirname2(path), `.${basename(path)}.${randomHex(6)}.part`);
  try {
    writeFileSync(part, content, { mode: PRIVATE_FILE_MODE });
    chmodSync(part, PRIVATE_FILE_MODE);
    rename(part, path);
  } catch (error) {
    rmSync2(part, { force: true });
    throw error;
  }
}

var HEARTBEAT_MS = 5000;
var STALE_AFTER_MS = 30000;
var UNREADABLE_GRACE_MS = 5000;
function readBody(path) {
  try {
    const body = JSON.parse(readFileSync3(path, "utf8"));
    if (body !== null && typeof body === "object" && typeof body.pid === "number" && typeof body.token === "string")
      return body;
  } catch {}
  return null;
}
function processAlive(pid) {
  if (!Number.isSafeInteger(pid) || pid <= 0)
    return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code === "EPERM";
  }
}
function lockIsStale(path, now = Date.now()) {
  let heartbeat;
  try {
    heartbeat = statSync2(path).mtimeMs;
  } catch {
    return true;
  }
  const body = readBody(path);
  if (body === null)
    return now - heartbeat > UNREADABLE_GRACE_MS;
  return !processAlive(body.pid) || now - heartbeat > STALE_AFTER_MS;
}

class CollectorLock {
  path;
  token;
  constructor(path, token) {
    this.path = path;
    this.token = token;
  }
  static acquire(path, now = Date.now()) {
    const token = randomHex(16);
    for (let attempt = 0;attempt < 2; attempt++) {
      try {
        const fd = openSync(path, "wx", 384);
        try {
          writeSync(fd, JSON.stringify({ pid: process.pid, token }));
        } finally {
          closeSync(fd);
        }
        return new CollectorLock(path, token);
      } catch (error) {
        if (error.code !== "EEXIST")
          return null;
      }
      if (attempt > 0 || !lockIsStale(path, now))
        return null;
      const aside = `${path}.${randomHex(6)}.stale`;
      try {
        renameSync3(path, aside);
        rmSync3(aside, { force: true });
      } catch {}
    }
    return null;
  }
  owns() {
    return readBody(this.path)?.token === this.token;
  }
  heartbeat(now = Date.now()) {
    if (!this.owns())
      return false;
    try {
      const time = new Date(now);
      utimesSync(this.path, time, time);
      return true;
    } catch {
      return false;
    }
  }
  release() {
    if (this.owns())
      rmSync3(this.path, { force: true });
  }
}

class LockLost extends Error {
  constructor() {
    super("lock_lost");
  }
}

var SPOOL_BYTE_LIMIT = 64 * 1024 * 1024;
var SPOOL_AGE_LIMIT_MS = 30 * 24 * 60 * 60000;
function spoolDrops(revisions, now) {
  const ordered = [...revisions].sort((a, b) => a.built_at - b.built_at);
  const drops = [];
  const kept = [];
  for (const revision of ordered) {
    if (now - revision.built_at > SPOOL_AGE_LIMIT_MS)
      drops.push({ key: revision.key, reason: "expired" });
    else
      kept.push(revision);
  }
  let total = kept.reduce((sum, revision) => sum + revision.bytes, 0);
  for (const revision of kept) {
    if (total <= SPOOL_BYTE_LIMIT)
      break;
    drops.push({ key: revision.key, reason: "spool_full" });
    total -= revision.bytes;
  }
  return drops;
}

import { existsSync as existsSync2, readFileSync as readFileSync4, readdirSync as readdirSync2 } from "node:fs";
import { join as join4 } from "node:path";
var READMISSION_CHECK_MS = 24 * 60 * 60000;
var emptyStatus = (now) => ({
  state: "idle",
  updated_at: now,
  last_confirm_at: null,
  confirmed_revisions: 0,
  not_captured: {},
  refusals: {},
  dropped: {},
  transformation_failures: {},
  local_io_retry: 0
});
function isPendingOrAdmitted(session) {
  return session.admission === "pending" || session.admission === "admitted";
}
function defaultSetState(fields) {
  return {
    archive_session_id: null,
    started_at: null,
    parent: null,
    revision: 0,
    confirmed_revision: null,
    pending: [],
    last_content: null,
    resync: false,
    deferred: null,
    gap: null,
    ...fields
  };
}
function pendingBytes(pending) {
  return pending.artifacts.reduce((sum, artifact) => sum + artifact.expected_bytes, 0);
}
function readJson(path) {
  try {
    return JSON.parse(readFileSync4(path, "utf8"));
  } catch {
    return null;
  }
}

class Store {
  paths;
  lock;
  io;
  retries = 0;
  constructor(paths, lock, io = nodeLocalIo) {
    this.paths = paths;
    this.lock = lock;
    this.io = io;
  }
  guard() {
    if (this.lock && !this.lock.owns())
      throw new LockLost;
  }
  retried = () => {
    this.retries++;
  };
  write(path, content) {
    this.guard();
    writeAtomic(path, content, (from, to) => withHeldFileRetry(this.io, () => this.io.rename(from, to), this.retried));
  }
  writeJson(path, value) {
    this.write(path, `${JSON.stringify(value)}
`);
  }
  config() {
    return readJson(this.paths.config);
  }
  remove(path) {
    this.guard();
    try {
      withHeldFileRetry(this.io, () => this.io.remove(path), this.retried);
    } catch (error) {
      if (!(error instanceof LocalIoBusy))
        throw error;
      this.recordDeletion(path);
    }
  }
  readSpooled(path) {
    let bytes = null;
    withHeldFileRetry(this.io, () => {
      bytes = this.io.read(path);
    }, this.retried);
    return bytes;
  }
  deletions() {
    return readJson(this.paths.deletions) ?? [];
  }
  recordDeletion(path) {
    const recorded = this.deletions();
    if (recorded.includes(path))
      return;
    try {
      this.writeJson(this.paths.deletions, [...recorded, path]);
    } catch (error) {
      if (!(error instanceof LocalIoBusy))
        throw error;
    }
  }
  completeDeletions() {
    const recorded = this.deletions();
    if (!recorded.length)
      return;
    this.guard();
    const left = recorded.filter((path) => {
      try {
        withHeldFileRetry(this.io, () => this.io.remove(path), this.retried);
        return false;
      } catch (error) {
        if (!(error instanceof LocalIoBusy))
          throw error;
        return true;
      }
    });
    try {
      if (left.length)
        this.writeJson(this.paths.deletions, left);
      else
        withHeldFileRetry(this.io, () => this.io.remove(this.paths.deletions), this.retried);
    } catch (error) {
      if (!(error instanceof LocalIoBusy))
        throw error;
    }
  }
  admission(config) {
    return readJson(this.paths.admission) ?? {
      from_ms: config.enabled_at,
      withdrawn: null,
      disabled: null
    };
  }
  saveAdmission(admission) {
    this.writeJson(this.paths.admission, admission);
  }
  credential() {
    return readJson(this.paths.credential);
  }
  saveCredential(credential) {
    this.writeJson(this.paths.credential, credential);
  }
  sessionPath(nativeSessionId) {
    return join4(this.paths.sessions, `${hashedName(nativeSessionId)}.json`);
  }
  session(nativeSessionId) {
    return readJson(this.sessionPath(nativeSessionId));
  }
  sessions() {
    if (!existsSync2(this.paths.sessions))
      return [];
    return readdirSync2(this.paths.sessions).filter((name) => name.endsWith(".json")).flatMap((name) => {
      const state = readJson(join4(this.paths.sessions, name));
      return state ? [state] : [];
    });
  }
  saveSession(state) {
    this.writeJson(this.sessionPath(state.native_session_id), state);
  }
  spoolPath(archiveSessionId, revision, kind) {
    return join4(this.paths.spool, hashedName(archiveSessionId), `${revision}-${kind}`);
  }
  status(now) {
    return readJson(this.paths.status) ?? emptyStatus(now);
  }
  updateStatus(now, change) {
    const status = this.status(now);
    change(status);
    const retries = this.retries;
    status.local_io_retry += retries;
    status.updated_at = now;
    this.writeJson(this.paths.status, status);
    this.retries -= retries;
  }
  flushRetries(now) {
    if (this.retries)
      this.updateStatus(now, () => {
        return;
      });
  }
}
function count(counts, key) {
  counts[key] = (counts[key] ?? 0) + 1;
}

import { closeSync as closeSync2, openSync as openSync2, readdirSync as readdirSync3, readFileSync as readFileSync5, readSync } from "node:fs";
import { basename as basename2, dirname as dirname3, join as join5 } from "node:path";

function canonicalJsonStringify(value) {
  if (value === null)
    return "null";
  if (value === undefined)
    return "undefined";
  if (Array.isArray(value)) {
    const items = value.map((v) => canonicalJsonStringify(v));
    return `[${items.join(",")}]`;
  }
  if (typeof value === "object") {
    const keys = Object.keys(value).sort();
    const parts = [];
    for (const k of keys) {
      const v = value[k];
      if (v === undefined)
        continue;
      parts.push(`${JSON.stringify(k)}:${canonicalJsonStringify(v)}`);
    }
    return `{${parts.join(",")}}`;
  }
  return JSON.stringify(value);
}
async function computeArgsHash(args) {
  const canonical = canonicalJsonStringify(args);
  const bytes = new TextEncoder().encode(canonical);
  const hashBuf = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hashBuf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

var REDACTED = "[REDACTED]";
var SCRUB_CLASSES = [
  {
    name: "private_key_block",
    pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g
  },
  { name: "aws_access_key", pattern: /\bAKIA[0-9A-Z]{16}\b/g },
  { name: "github_token", pattern: /\bgh[pousr]_[A-Za-z0-9]{30,}\b/g },
  { name: "slack_token", pattern: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g },
  { name: "anthropic_key", pattern: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/g },
  { name: "openai_key", pattern: /\bsk-[A-Za-z0-9_-]{20,}\b/g },
  {
    name: "jwt",
    pattern: /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g
  },
  {
    name: "db_url_credentials",
    pattern: /\b[a-z][a-z0-9+.-]*:\/\/[^\s:@/]+:[^\s@/]+@/g
  },
  { name: "bearer_header", pattern: /\b[Bb]earer\s+[A-Za-z0-9._~+/-]{16,}=*/g },
  {
    name: "email",
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g
  }
];
var ENTROPY_CANDIDATE = /\b[A-Za-z0-9+/_=-]{20,}\b/g;
var ENTROPY_THRESHOLD_BITS = 3.8;
function shannonBitsPerChar(s) {
  const freq = new Map;
  for (const ch of s)
    freq.set(ch, (freq.get(ch) ?? 0) + 1);
  let bits = 0;
  for (const n of freq.values()) {
    const p = n / s.length;
    bits -= p * Math.log2(p);
  }
  return bits;
}
function scrubText(input, options) {
  const by_class = {};
  let text = input;
  for (const { name, pattern } of SCRUB_CLASSES) {
    text = text.replace(pattern, () => {
      by_class[name] = (by_class[name] ?? 0) + 1;
      return name === "db_url_credentials" ? `${REDACTED}@` : REDACTED;
    });
  }
  if (options?.skipEntropyPass !== true) {
    text = text.replace(ENTROPY_CANDIDATE, (m) => {
      if (m.includes(REDACTED))
        return m;
      if (/^[a-z]+$/.test(m))
        return m;
      if (shannonBitsPerChar(m) < ENTROPY_THRESHOLD_BITS)
        return m;
      by_class["high_entropy"] = (by_class["high_entropy"] ?? 0) + 1;
      return REDACTED;
    });
  }
  const total_redactions = Object.values(by_class).reduce((a, b) => a + b, 0);
  return { text, report: { total_redactions, by_class } };
}
var CONTENT_TRANSFORMATION_IDENTITY = {
  id: "atmina-content-transformation",
  version: "1",
  policy_version: "atmina-content-transformation/1"
};
var POLICY_OPTIONS = {
  content: {},
  event_field: { skipEntropyPass: true }
};
function transformationReport(identity, failure_reason = null) {
  return {
    total_redactions: 0,
    by_class: {},
    transformer: identity,
    status: failure_reason ? "failed" : "transformed",
    failure_reason,
    provenance: "server"
  };
}
function createContentTransformer() {
  return {
    identity: CONTENT_TRANSFORMATION_IDENTITY,
    transform(value, classification, policy) {
      const report = transformationReport(CONTENT_TRANSFORMATION_IDENTITY);
      const ancestors = new Set;
      const structural = new Set(classification.structural);
      const scrub = (text) => {
        const result = scrubText(text, POLICY_OPTIONS[policy]);
        report.total_redactions += result.report.total_redactions;
        for (const [key, count2] of Object.entries(result.report.by_class))
          report.by_class[key] = (report.by_class[key] ?? 0) + count2;
        return result.text;
      };
      const walk = (input, path, exempt = false) => {
        exempt ||= structural.has(path);
        if (input == null || typeof input === "number" || typeof input === "boolean")
          return input;
        if (typeof input === "string")
          return exempt ? input : scrub(input);
        if (typeof input !== "object" || ancestors.has(input))
          throw new TypeError("unsupported_value");
        if (!Array.isArray(input) && Object.getPrototypeOf(input) !== Object.prototype && Object.getPrototypeOf(input) !== null)
          throw new TypeError("unsupported_value");
        ancestors.add(input);
        let output;
        if (Array.isArray(input)) {
          output = input.map((item) => walk(item, `${path}[*]`, exempt));
        } else {
          const object = {};
          for (const key of Object.keys(input).sort()) {
            const item = input[key];
            if (item === undefined)
              continue;
            const childPath = path ? `${path}.${key}` : key;
            const schemaKey = structural.has(childPath) || classification.structural.some((p) => p.startsWith(childPath + ".") || p.startsWith(childPath + "[*]"));
            const transformedKey = exempt || schemaKey ? key : scrub(key);
            let destination = transformedKey;
            let suffix = 2;
            while (Object.hasOwn(object, destination))
              destination = `${transformedKey}#${suffix++}`;
            Object.defineProperty(object, destination, {
              value: walk(item, childPath, exempt),
              enumerable: true,
              configurable: true,
              writable: true
            });
          }
          output = object;
        }
        ancestors.delete(input);
        return output;
      };
      try {
        return { status: "transformed", value: walk(value, ""), report };
      } catch (error) {
        if (!(error instanceof TypeError) || error.message !== "unsupported_value")
          throw error;
        return {
          status: "failed",
          failure_reason: "unsupported_value",
          report: transformationReport(CONTENT_TRANSFORMATION_IDENTITY, "unsupported_value")
        };
      }
    }
  };
}

function transformationReport2(identity, failure_reason = null) {
  return {
    total_redactions: 0,
    by_class: {},
    transformer: identity,
    status: failure_reason ? "failed" : "transformed",
    failure_reason,
    provenance: "server"
  };
}
function transformContent(transformer, value, classification, policy) {
  try {
    return transformer.transform(value, classification, policy);
  } catch {
    return {
      status: "failed",
      failure_reason: "implementation_error",
      report: transformationReport2(transformer.identity, "implementation_error")
    };
  }
}
function mergeTransformationReports(reports) {
  const first = reports[0];
  if (!first)
    throw new Error("Transformation reports must not be empty");
  const merged = {
    ...first,
    by_class: {},
    total_redactions: 0
  };
  for (const report of reports) {
    if (report.transformer?.id !== first.transformer?.id || report.transformer?.version !== first.transformer?.version || report.transformer?.policy_version !== first.transformer?.policy_version || report.provenance !== first.provenance)
      throw new Error("Transformation report identity mismatch");
    merged.total_redactions += report.total_redactions;
    for (const [key, count2] of Object.entries(report.by_class))
      merged.by_class[key] = (merged.by_class[key] ?? 0) + count2;
    if (report.status === "failed") {
      merged.status = "failed";
      merged.failure_reason = report.failure_reason;
    }
  }
  return merged;
}

function serializeTraceEvents(events) {
  return events.map((e) => canonicalJsonStringify(e)).join(`
`);
}

function traceKeyspacePrefix(company_team_id) {
  return `team/${company_team_id}/traces/`;
}
function traceObjectKeys(company_team_id, session_id) {
  const base = `${traceKeyspacePrefix(company_team_id)}${session_id}/`;
  return {
    raw: `${base}raw.jsonl`,
    normalized: `${base}normalized.jsonl`,
    manifest: `${base}manifest.json`,
    rendered: `${base}rendered.md`
  };
}

var HARNESS_TIMELINE_NORMALIZER_VERSION = 2;

var object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
var uuid = (value) => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
var prefixed = (prefix) => (value) => typeof value === "string" && new RegExp(`^${prefix}_[A-Za-z0-9_-]{1,180}$`).test(value);
var member = (values) => (value) => typeof value === "string" && values.includes(value);
var iso = (value) => typeof value === "string" && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(value) && Number.isFinite(Date.parse(value));
var observedModels = [
  "claude-opus-5-5",
  "claude-sonnet-5-5",
  "claude-opus-5",
  "claude-haiku-5-5",
  "claude-fable-5-1",
  "claude-haiku-4-5-20251001",
  "claude-opus-4-8",
  "<synthetic>"
];
var randomAgent = (value) => typeof value === "string" && /^a?[0-9a-f]{8,}$/.test(value);
var types = [
  "user",
  "assistant",
  "system",
  "attachment",
  "progress",
  "queue-operation",
  "last-prompt",
  "continued-in",
  "permission-mode",
  "api-request",
  "api-request-shape",
  "ai-title",
  "pr-link",
  "file-history-snapshot",
  "file-history-delta",
  "workflow-journal"
];
function at(record, path) {
  let value = record;
  for (const key of path.split("."))
    value = object(value) ? value[key] : undefined;
  return value;
}
function recordClassification(record, identities) {
  const structural = [];
  const known = new Set([
    "uuid",
    "parentUuid",
    "logicalParentUuid",
    "sessionId",
    "agentId",
    "isSidechain",
    "timestamp",
    "version",
    "type",
    "subtype",
    "attachment",
    "userType",
    "entrypoint",
    "promptId",
    "sourceToolAssistantUUID",
    "toolUseResult",
    "requestId",
    "requestRef",
    "message",
    "isApiErrorMessage",
    "error",
    "continuedInSessionId",
    "leafUuid",
    "session_id",
    "id",
    "mode",
    "cwd",
    "gitBranch",
    "slug",
    "lastPrompt",
    "title",
    "url",
    "params",
    "shape",
    "data",
    "snapshot",
    "delta"
  ]);
  let unsupported = !types.includes(String(record.type)) || Object.keys(record).some((key) => !known.has(key) && !(record.type === "workflow-journal" && key === "content"));
  const add = (path, valid) => {
    const value = at(record, path);
    if (value !== undefined) {
      if (valid(value))
        structural.push(path);
      else
        unsupported = true;
    }
  };
  for (const path of ["uuid", "sessionId"])
    add(path, uuid);
  for (const path of ["parentUuid", "logicalParentUuid"])
    add(path, (value) => value === null || uuid(value));
  add("agentId", (value) => randomAgent(value) && value === identities?.own_agent_id);
  add("type", member(types));
  add("timestamp", iso);
  add("version", (value) => typeof value === "string" && /^\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?$/.test(value));
  add("entrypoint", member(["cli", "claude-desktop"]));
  add("userType", member(["external", "internal"]));
  add("isSidechain", (value) => typeof value === "boolean");
  add("subtype", member([
    "compact_boundary",
    "clear",
    "api_error",
    "turn_duration",
    "stop_hook_summary",
    "local_command",
    "informational"
  ]));
  add("attachment.type", member([
    "file",
    "directory",
    "command",
    "hook",
    "selected_lines",
    "ide_selection",
    "todo"
  ]));
  if (record.type === "permission-mode")
    add("mode", member([
      "default",
      "acceptEdits",
      "bypassPermissions",
      "plan",
      "dontAsk",
      "auto"
    ]));
  if (record.type === "user") {
    for (const path of ["promptId", "sourceToolAssistantUUID"])
      add(path, uuid);
    for (const path of [
      "toolUseResult.agentId",
      "toolUseResult.resumedAgentId"
    ])
      add(path, (value) => randomAgent(value) && identities?.referenced_agent_ids.has(value) === true);
    add("toolUseResult.runId", () => false);
  }
  if (record.type === "continued-in")
    add("continuedInSessionId", uuid);
  if (record.type === "last-prompt")
    add("leafUuid", uuid);
  if (!["user", "assistant"].includes(String(record.type)))
    add("session_id", uuid);
  if (record.type === "assistant") {
    add("isApiErrorMessage", (value) => typeof value === "boolean");
    add("requestId", prefixed("req"));
    add("requestRef", prefixed("req"));
    add("message.id", (value) => uuid(value) || prefixed("msg")(value));
    add("message.model", member(observedModels));
    const usage = at(record, "message.usage");
    const walk = (value, path) => {
      if (!object(value))
        return;
      for (const [key, child] of Object.entries(value)) {
        const next = `${path}.${key}`;
        if (typeof child === "number" && Number.isFinite(child) && child >= 0)
          structural.push(next);
        else if (object(child))
          walk(child, next);
        else if (key === "service_tier" && member(["standard", "priority", "batch"])(child))
          structural.push(next);
        else
          unsupported = true;
      }
    };
    walk(usage, "message.usage");
  }
  if (record.type === "api-request")
    add("id", (value) => uuid(value) || prefixed("req")(value));
  if (object(record.message) && Object.keys(record.message).some((key) => ![
    "id",
    "model",
    "role",
    "content",
    "usage",
    "type",
    "stop_reason",
    "stop_sequence"
  ].includes(key)))
    unsupported = true;
  return { structural, unsupported };
}
function classifyClaudeCodeRecord(record, identities) {
  return { structural: recordClassification(record, identities).structural };
}
function transformClaudeCodeRecord(record, component = createContentTransformer(), identities) {
  const content = object(record.message) ? record.message.content : undefined;
  if (!Array.isArray(content))
    return transformContent(component, record, classifyClaudeCodeRecord(record, identities), "content");
  const base = {
    ...record,
    message: { ...record.message, content: [] }
  };
  const transformed = transformContent(component, base, classifyClaudeCodeRecord(record, identities), "content");
  if (transformed.status === "failed")
    return transformed;
  const reports = [transformed.report];
  const blocks = [];
  for (const block of content) {
    const structural = [];
    if (object(block)) {
      if (member([
        "text",
        "thinking",
        "tool_use",
        "tool_result",
        "image",
        "redacted_thinking"
      ])(block.type))
        structural.push("type");
      if (record.type === "assistant" && block.type === "tool_use" && prefixed("toolu")(block.id))
        structural.push("id");
      if (record.type === "user" && block.type === "tool_result" && prefixed("toolu")(block.tool_use_id))
        structural.push("tool_use_id");
    }
    const result = transformContent(component, block, { structural }, "content");
    if (result.status === "failed")
      return result;
    blocks.push(result.value);
    reports.push(result.report);
  }
  return {
    status: "transformed",
    value: {
      ...transformed.value,
      message: {
        ...transformed.value.message,
        content: blocks
      }
    },
    report: mergeTransformationReports(reports)
  };
}

class Refusal extends Error {
  reason;
  constructor(reason) {
    super(reason);
    this.reason = reason;
  }
}
function parse(text) {
  return text.split(/\r?\n/).filter((line) => line.trim()).map((line, position) => {
    const value = JSON.parse(line);
    if (!object(value))
      throw new Refusal("invalid_transcript");
    return { line, value, position };
  });
}
function claudeCodeNativeId(path) {
  const main = /^([0-9a-f-]{36})\.jsonl$/i.exec(path);
  if (main && uuid(main[1]))
    return main[1];
  const child = /^([0-9a-f-]{36})\/(subagents\/(?:workflows\/[A-Za-z0-9_-]+\/)?agent-[A-Za-z0-9_-]+)\.jsonl$/i.exec(path);
  return child && uuid(child[1]) ? `${child[1]}/${child[2]}` : null;
}
function responseKey(record) {
  const message = object(record.message) ? record.message : null;
  return record.type === "assistant" && message && typeof message.id === "string" ? JSON.stringify([message.id, record.requestId ?? null]) : null;
}
function sourcePath(records, source) {
  const nodes = new Map(records.filter((row) => uuid(row.value.uuid)).map((row) => [String(row.value.uuid), row.value]));
  const sourceLinks = new Map(source.filter((row) => uuid(row.value.uuid)).map((row) => [
    String(row.value.uuid),
    row.value.parentUuid ?? row.value.logicalParentUuid
  ]));
  if (!nodes.size)
    return new Set;
  const named = records.filter((row) => row.value.type === "last-prompt").at(-1)?.value.leafUuid;
  const parents = new Set([...nodes.values()].map((row) => row.parentUuid ?? row.logicalParentUuid).filter((value) => typeof value === "string"));
  const leaves = [...nodes.values()].filter((row) => !parents.has(String(row.uuid)));
  let leaf = typeof named === "string" ? named : String(leaves.at(-1)?.uuid ?? "");
  if (!sourceLinks.has(leaf))
    throw new Refusal("ambiguous_path");
  const checkedParent = (parent) => {
    if (parent === null || parent === undefined)
      return null;
    if (typeof parent !== "string" || !uuid(parent))
      throw new Refusal("ambiguous_path");
    if (!sourceLinks.has(parent))
      throw new Refusal("ambiguous_path");
    return parent;
  };
  const crossed = new Set;
  while (leaf && !nodes.has(leaf)) {
    if (crossed.has(leaf))
      throw new Refusal("ambiguous_path");
    crossed.add(leaf);
    leaf = checkedParent(sourceLinks.get(leaf));
  }
  if (leaf === null)
    throw new Refusal("no_eligible_content");
  const selected = new Set;
  let cursor = leaf;
  while (cursor) {
    if (selected.has(cursor))
      throw new Refusal("ambiguous_path");
    selected.add(cursor);
    const row = nodes.get(cursor);
    if (!row)
      break;
    const parent = checkedParent(row.parentUuid ?? row.logicalParentUuid);
    cursor = parent !== null && nodes.has(parent) ? parent : null;
  }
  return selected;
}
function omitImages(value, counts) {
  if (Array.isArray(value))
    return value.map((item) => omitImages(item, counts));
  if (!object(value))
    return value;
  const out = {};
  for (const [key, child] of Object.entries(value)) {
    if (value.type === "image" && key === "source" && object(child) && Object.hasOwn(child, "data")) {
      counts.omitted.image++;
      out[key] = { ...child, data: "[OMITTED: image]" };
    } else
      out[key] = omitImages(child, counts);
  }
  return out;
}
function omittedSource(record, counts) {
  if (record.type === "workflow-journal") {
    counts.omitted.workflow_journal++;
    return { ...record, content: "[OMITTED: workflow_journal]" };
  }
  return omitImages(record, counts);
}
function blocksOf(record) {
  const message = object(record.message) ? record.message : null;
  return message && Array.isArray(message.content) ? message.content : [];
}
var blockKeys = {
  text: ["type", "text"],
  thinking: ["type", "thinking", "signature"],
  redacted_thinking: ["type", "data"],
  tool_use: ["type", "id", "name", "input"],
  tool_result: ["type", "tool_use_id", "content", "is_error"],
  image: ["type", "source"]
};
function unsupported(record, identities) {
  if (recordClassification(record, identities).unsupported)
    return true;
  if (record.type === "user" || record.type === "assistant") {
    if (!iso(record.timestamp) || !object(record.message))
      return true;
    const content = record.message.content;
    if (!Array.isArray(content) && !(record.type === "user" && typeof content === "string"))
      return true;
  }
  return blocksOf(record).some((block) => !object(block) || ![
    "text",
    "thinking",
    "tool_use",
    "tool_result",
    "image",
    "redacted_thinking"
  ].includes(String(block.type)) || block.type === "tool_use" && !prefixed("toolu")(block.id) || block.type === "tool_result" && !prefixed("toolu")(block.tool_use_id) || block.type === "tool_use" && record.type !== "assistant" || block.type === "tool_result" && record.type !== "user" || Object.keys(block).some((key) => !(blockKeys[String(block.type)] ?? []).includes(key)));
}
function renderedText(record) {
  const message = object(record.message) ? record.message : null;
  if (message && typeof message.content === "string")
    return message.content;
  return blocksOf(record).filter((block) => object(block) && block.type === "text" && typeof block.text === "string").map((block) => String(block.text)).join(`
`);
}
async function sha256Hex2(text) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
var skillSegment = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
var skillSources = ["plugin", "bundled", "userSettings", "projectSettings"];
function skillBase(body) {
  const line = /^Base directory for this skill: (\S[^\n]*)$/m.exec(body)?.[1]?.replace(/\/+$/, "");
  if (!line || line.includes(REDACTED))
    return null;
  const plugin = /\/\.claude\/plugins\/cache\/[^/]+\/([^/]+)\/([^/]+)\/skills\/([^/]+)$/.exec(line);
  if (plugin && [plugin[1], plugin[2], plugin[3]].every((part) => skillSegment.test(part)))
    return { source: "plugin", qualified_name: `plugin:${plugin[1]}:${plugin[3]}`, plugin_version: plugin[2] };
  const user = /^(?:\/Users\/[^/]+|\/home\/[^/]+|\/root)\/\.claude\/skills\/([^/]+)$/.exec(line);
  if (user && skillSegment.test(user[1]))
    return { source: "userSettings", qualified_name: `userSettings:${user[1]}`, plugin_version: null };
  const project = /^\/.+\/\.claude\/skills\/([^/]+)$/.exec(line);
  if (project && skillSegment.test(project[1]))
    return { source: "projectSettings", qualified_name: `projectSettings:${project[1]}`, plugin_version: null };
  return null;
}
function qualifiedFromListing(name, qualifiers) {
  const bare = name?.split(":").at(-1);
  const seen = bare ? qualifiers.get(bare) : undefined;
  if (!seen || seen.size !== 1)
    return null;
  const qualified = [...seen][0];
  const parts = qualified.split(":");
  if (!skillSources.includes(parts[0]) || parts.at(-1) !== bare || !parts.every((part) => skillSegment.test(part)))
    return null;
  return { source: parts[0], qualified_name: qualified };
}
function skillInvocation(trigger, name, body, digest, qualifiers) {
  const base = body ? skillBase(renderedText(body)) : null;
  const qualified = base ?? qualifiedFromListing(name, qualifiers);
  return {
    trigger,
    source: qualified?.source ?? null,
    name: name && name.length <= 512 ? name : null,
    qualified_name: qualified?.qualified_name ?? null,
    plugin_version: base?.plugin_version ?? null,
    content_sha256: body && digest ? digest : null
  };
}
function normalized(records, counts, source, responses, digests = new Map) {
  const calls = new Map;
  const bodiesByCall = new Map;
  const bodiesByParent = new Map;
  for (const record of records) {
    const original = source.get(String(record.uuid)) ?? record;
    if (original.type !== "user" || original.isMeta !== true)
      continue;
    if (Object.hasOwn(original, "sourceToolUseID")) {
      if (prefixed("toolu")(original.sourceToolUseID) && !bodiesByCall.has(String(original.sourceToolUseID)))
        bodiesByCall.set(String(original.sourceToolUseID), record);
    } else if (uuid(original.parentUuid) && !bodiesByParent.has(String(original.parentUuid)))
      bodiesByParent.set(String(original.parentUuid), record);
  }
  const qualifiers = new Map;
  const userBodies = new Set;
  for (const record of records)
    for (const block of blocksOf(record))
      if (object(block) && block.type === "tool_use" && prefixed("toolu")(block.id))
        calls.set(String(block.id), typeof block.name === "string" ? block.name : "unknown");
  const events = [];
  let turn = null;
  const carried = new Set;
  for (const record of records) {
    if (record.type === "attachment" && object(record.attachment) && record.attachment.type === "invoked_skills" && Array.isArray(record.attachment.skills)) {
      for (const skill of record.attachment.skills)
        if (object(skill) && typeof skill.name === "string" && typeof skill.path === "string")
          qualifiers.set(skill.name, (qualifiers.get(skill.name) ?? new Set).add(skill.path));
    }
    if (record.type !== "user" && record.type !== "assistant")
      continue;
    const original = source.get(String(record.uuid)) ?? record;
    if (original.type === "user" && uuid(original.promptId))
      turn = String(original.promptId);
    if (original.type === "user" && original.isMeta === true && (Object.hasOwn(original, "sourceToolUseID") || userBodies.has(String(record.uuid))))
      continue;
    const ts = Date.parse(String(record.timestamp));
    if (!Number.isFinite(ts))
      continue;
    const message = object(record.message) ? record.message : null;
    if (!message)
      continue;
    const key = record.type === "assistant" ? responseKey(original) : null;
    const response = key ? responses.get(key) : undefined;
    const before = events.length;
    if (record.type === "user" && typeof message.content === "string") {
      const event = { type: "user_message", ts, text: message.content };
      const command = /^<command-name>\/([^<\n]{1,512})<\/command-name>/.exec(message.content)?.[1];
      const body = command ? bodiesByParent.get(String(original.uuid)) : undefined;
      if (command && body) {
        userBodies.add(String(body.uuid));
        event.skill_invocation = skillInvocation("user", command, body, digests.get(String(body.uuid)), qualifiers);
      }
      events.push(event);
    }
    for (const block of blocksOf(record)) {
      if (!object(block))
        continue;
      const text = typeof block.text === "string" ? block.text : "";
      if (block.type === "text")
        events.push({
          type: record.type === "user" ? "user_message" : "agent_text",
          ts,
          text
        });
      else if (block.type === "thinking") {
        if (typeof block.thinking === "string" && block.thinking.length)
          events.push({ type: "agent_thinking", ts, text: block.thinking });
        else
          counts.omitted.empty_thinking++;
      } else if (record.type === "assistant" && block.type === "tool_use") {
        const id = prefixed("toolu")(block.id) ? String(block.id) : null;
        const event = {
          type: "tool_call",
          ts,
          tool: typeof block.name === "string" ? block.name : "unknown",
          input: block.input ?? null,
          tool_call_id: id,
          tool_call_id_source: id ? "provider" : null,
          tool_state: "input-available"
        };
        if (block.name === "Skill" && id) {
          const input = object(block.input) ? block.input : {};
          const body = bodiesByCall.get(id);
          event.skill_invocation = skillInvocation("model", typeof input.skill === "string" ? input.skill : null, body, body ? digests.get(String(body.uuid)) : undefined, qualifiers);
        }
        events.push(event);
      } else if (record.type === "user" && block.type === "tool_result") {
        const spilled = typeof block.content === "string" && /<persisted-output>/.test(block.content);
        if (spilled)
          counts.omitted.spilled_output++;
        const error = block.is_error === true;
        const id = prefixed("toolu")(block.tool_use_id) ? String(block.tool_use_id) : null;
        events.push({
          type: "tool_result",
          ts,
          tool: id ? calls.get(id) ?? "unknown" : "unknown",
          output: spilled ? null : block.content ?? null,
          is_error: error ? true : spilled ? null : false,
          tool_call_id: id,
          tool_call_id_source: id ? "provider" : null,
          tool_state: error ? "output-error" : spilled ? "outcome_unknown" : "output-available"
        });
      }
    }
    for (const event of events.slice(before)) {
      event.turn_key = turn;
      if (!response?.response_key)
        continue;
      event.response_key = response.response_key;
      event.model = response.model;
      event.model_state = response.model_state;
      if (!carried.has(key)) {
        carried.add(key);
        event.response_usage = response.usage;
      }
    }
  }
  return events;
}
function usageOf(records, predecessor, hasPredecessor) {
  const usage = {
    responses: 0,
    failed_responses: 0,
    unknown_usage_responses: 0,
    copied_responses: 0,
    copied_history: hasPredecessor ? predecessor ? "excluded" : "possibly_included" : "none",
    input_tokens: 0,
    output_tokens: 0,
    cache_read_tokens: 0,
    cache_write_tokens: 0
  };
  const copied = new Set(predecessor?.map((row) => responseKey(row.value)).filter(Boolean));
  const groups = new Map;
  for (const { value: record } of records) {
    const key = responseKey(record);
    if (!key)
      continue;
    const group = groups.get(key) ?? [];
    group.push(record);
    groups.set(key, group);
  }
  const isFailure = (record) => object(record.message) && record.message.model === "<synthetic>" && record.isApiErrorMessage === true && Object.hasOwn(record, "error");
  const tokens = (value) => typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
  const knownUsage = (record) => {
    const message = object(record.message) ? record.message : null;
    const reported = message && object(message.usage) ? message.usage : null;
    if (!reported || !tokens(reported.input_tokens) || !tokens(reported.output_tokens) || [
      reported.cache_read_input_tokens,
      reported.cache_creation_input_tokens
    ].some((value) => value !== undefined && !tokens(value)))
      return null;
    return {
      input: reported.input_tokens,
      output: reported.output_tokens,
      cacheRead: tokens(reported.cache_read_input_tokens) ? reported.cache_read_input_tokens : 0,
      cacheWrite: tokens(reported.cache_creation_input_tokens) ? reported.cache_creation_input_tokens : 0
    };
  };
  const responses = new Map;
  const models = new Map;
  const unknownCounters = {
    input_tokens: null,
    output_tokens: null,
    cache_read_tokens: null,
    cache_write_tokens: null
  };
  for (const [key, group] of groups) {
    const attempts = group.filter((record) => object(record.message) && (record.message.model !== "<synthetic>" || isFailure(record)));
    if (!attempts.length)
      continue;
    const id = attempts[0].message.id;
    const failed = attempts.some(isFailure);
    const named = attempts.map((record) => record.message.model).find((model2) => model2 !== undefined && model2 !== "<synthetic>");
    const model = !failed && member(observedModels)(named) ? String(named) : null;
    const model_state = model ? "reported" : !failed && named !== undefined ? "unrecognized" : "not_reported";
    const facts = (state, counters) => responses.set(key, {
      response_key: uuid(id) || prefixed("msg")(id) ? String(id) : null,
      model,
      model_state,
      usage: { state, ...counters }
    });
    if (copied.has(key)) {
      usage.copied_responses++;
      facts("copied", unknownCounters);
      continue;
    }
    const bucketKey = JSON.stringify([model_state, model]);
    const bucket = models.get(bucketKey) ?? {
      model,
      model_state,
      responses: 0,
      failed_responses: 0,
      unknown_usage_responses: 0,
      input_tokens: 0,
      output_tokens: 0,
      cache_read_tokens: 0,
      cache_write_tokens: 0
    };
    models.set(bucketKey, bucket);
    usage.responses++;
    bucket.responses++;
    if (failed) {
      usage.failed_responses++;
      usage.unknown_usage_responses++;
      bucket.failed_responses++;
      bucket.unknown_usage_responses++;
      facts("failed", unknownCounters);
      continue;
    }
    const reported = attempts.map(knownUsage).find((value) => value !== null);
    if (!reported) {
      usage.unknown_usage_responses++;
      bucket.unknown_usage_responses++;
      facts("unknown", unknownCounters);
      continue;
    }
    for (const target of [usage, bucket]) {
      target.input_tokens += reported.input;
      target.output_tokens += reported.output;
      target.cache_read_tokens += reported.cacheRead;
      target.cache_write_tokens += reported.cacheWrite;
    }
    facts("reported", {
      input_tokens: reported.input,
      output_tokens: reported.output,
      cache_read_tokens: reported.cacheRead,
      cache_write_tokens: reported.cacheWrite
    });
  }
  const order = { reported: 0, unrecognized: 1, not_reported: 2 };
  const by_model = [...models.values()].sort((a, b) => order[a.model_state] - order[b.model_state] || String(a.model).localeCompare(String(b.model)));
  return { usage, responses, by_model };
}
async function normalizeClaudeCodeSessions(input, component = createContentTransformer()) {
  try {
    if (!component)
      throw new Refusal("transformation_failed");
    const identity = CONTENT_TRANSFORMATION_IDENTITY;
    if (component.identity.id !== identity.id || component.identity.version !== identity.version || component.identity.policy_version !== identity.policy_version)
      throw new Refusal("transformation_failed");
    const gate = transformContent(component, { credential: "AKIAIOSFODNN7EXAMPLE", email: "member@example.test" }, { structural: [] }, "content");
    if (gate.status !== "transformed" || gate.value.credential !== REDACTED || gate.value.email !== REDACTED || gate.report.status !== "transformed" || gate.report.transformer?.policy_version !== identity.policy_version)
      throw new Refusal("transformation_failed");
    const source = new Map(input.transcripts.map((file) => [
      file.registration.session_id,
      parse(file.text)
    ]));
    if (source.size !== input.transcripts.length || new Set(input.transcripts.map((file) => file.registration.archive_session_id)).size !== source.size)
      throw new Refusal("registration_mismatch");
    const sessions = [];
    for (const file of input.transcripts) {
      const native = claudeCodeNativeId(file.path);
      if (!native || file.registration.session_id !== native || file.registration.channel !== "harness:claude-code" || !uuid(file.registration.archive_session_id) || !Number.isSafeInteger(file.registration_started_at) || file.registration_started_at < 0 || ![input.team_id, input.actor_user_id].every((id) => /^[A-Za-z0-9_-]{1,128}$/.test(id)))
        throw new Refusal("registration_mismatch");
      const root = native.split("/")[0];
      const ownAgent = /\/agent-([^/]+)\.jsonl$/.exec(file.path)?.[1] ?? null;
      const identities = {
        own_agent_id: ownAgent,
        referenced_agent_ids: new Set(input.transcripts.filter((candidate) => candidate.registration.session_id.startsWith(`${root}/subagents/`) && claudeCodeNativeId(candidate.path) === candidate.registration.session_id).flatMap((candidate) => /\/agent-([^/]+)\.jsonl$/.exec(candidate.path)?.[1] ?? []))
      };
      const boundary = file.boundary;
      if (!boundary || boundary.state !== "established" || !Number.isFinite(boundary.from_ms) || !Number.isFinite(boundary.through_ms) || boundary.from_ms > boundary.through_ms || !Array.isArray(boundary.eligible_undated_sha256) || !Array.isArray(boundary.excluded_undated_sha256))
        throw new Refusal("eligibility_unknown");
      const records = [];
      for (const row of source.get(native)) {
        if (Object.hasOwn(row.value, "timestamp")) {
          if (!iso(row.value.timestamp))
            throw new Refusal("eligibility_unknown");
          const time = Date.parse(String(row.value.timestamp));
          if (time < boundary.from_ms || time > boundary.through_ms)
            continue;
        } else {
          const hash = await computeArgsHash(row.value);
          const included = boundary.eligible_undated_sha256.includes(hash);
          const excluded = boundary.excluded_undated_sha256.includes(hash);
          if (included === excluded)
            throw new Refusal("eligibility_unknown");
          if (excluded)
            continue;
        }
        records.push(row);
      }
      const counts = {
        transcript_records: records.length,
        duplicate_records: 0,
        superseded_records: 0,
        unsupported_records: 0,
        off_path_records: 0,
        omitted: {
          empty_thinking: 0,
          spilled_output: 0,
          image: 0,
          workflow_journal: 0
        }
      };
      const winners = new Map;
      for (const row of records) {
        const key = uuid(row.value.uuid) ? String(row.value.uuid) : `metadata:${row.position}`;
        const prior = winners.get(key);
        if (prior) {
          if (prior.line === row.line)
            counts.duplicate_records++;
          else
            counts.superseded_records++;
        }
        winners.set(key, row);
      }
      const unique = [...winners.values()].sort((a, b) => a.position - b.position);
      const path = sourcePath(unique, source.get(native));
      counts.off_path_records = unique.filter((row) => uuid(row.value.uuid) && !path.has(String(row.value.uuid))).length;
      const reports = [];
      const transformed = new Map;
      const raw = [];
      for (const row of records) {
        if (unsupported(row.value, identities))
          counts.unsupported_records++;
        let result;
        try {
          result = transformClaudeCodeRecord(omittedSource(row.value, counts), component, identities);
        } catch {
          throw new Refusal("transformation_failed");
        }
        if (result.status !== "transformed" || result.report.status !== "transformed" || result.report.failure_reason !== null || result.report.transformer?.id !== identity.id || result.report.transformer.version !== identity.version || result.report.transformer.policy_version !== identity.policy_version)
          throw new Refusal("transformation_failed");
        reports.push(result.report);
        raw.push(canonicalJsonStringify(result.value));
        if (uuid(row.value.uuid))
          transformed.set(String(row.value.uuid), result.value);
      }
      const selected = [...path].reverse().map((id) => transformed.get(id)).filter(Boolean);
      const counted = usageOf(unique, file.predecessor_native_session_id ? source.get(file.predecessor_native_session_id) : undefined, !!file.predecessor_native_session_id);
      const usage = counted.usage;
      const originals = new Map(unique.filter((row) => uuid(row.value.uuid)).map((row) => [String(row.value.uuid), row.value]));
      const digests = new Map;
      for (const record of selected)
        if (originals.get(String(record.uuid))?.isMeta === true)
          digests.set(String(record.uuid), await sha256Hex2(renderedText(record)));
      const events = normalized(selected, counts, originals, counted.responses, digests);
      if (!reports.length)
        throw new Refusal("eligibility_unknown");
      let merged;
      try {
        merged = mergeTransformationReports(reports);
      } catch {
        throw new Refusal("transformation_failed");
      }
      const { provenance: _provenance, ...report } = merged;
      const manifest = {
        normalizer_version: HARNESS_TIMELINE_NORMALIZER_VERSION,
        session_id: file.registration.archive_session_id,
        native_session_id: native,
        channel: "harness:claude-code",
        team_id: input.team_id,
        actor_user_id: input.actor_user_id,
        parent_session_id: null,
        started_at: file.registration_started_at,
        ended_at: null,
        agent_principal_id: null,
        agent_config_id: null,
        agent_config_snapshot: null,
        definition_hash: null,
        resolved_scope: { kb_ids: [], capabilities: [] },
        outcome: {},
        pointers: traceObjectKeys(input.team_id, file.registration.archive_session_id),
        consent: null,
        scrub_report: report,
        event_count: events.length,
        client_counts: counts,
        usage,
        usage_by_model: counted.by_model
      };
      sessions.push({
        archive_session_id: file.registration.archive_session_id,
        session_id: native,
        raw: raw.join(`
`),
        normalized: serializeTraceEvents(events),
        manifest: canonicalJsonStringify(manifest),
        event_count: events.length,
        client_counts: counts,
        usage,
        transformation_report: report
      });
    }
    return { status: "normalized", sessions };
  } catch (error) {
    return {
      status: "declined",
      reason: error instanceof Refusal ? error.reason : "invalid_transcript"
    };
  }
}

var ADMITTED_ENTRYPOINTS = ["cli", "claude-desktop"];
var HEAD_BYTES = 1024 * 1024;
var ISO = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/;
function parseLines(text) {
  return text.split(/\r?\n/).filter((line) => line.trim()).map((line) => {
    try {
      const value = JSON.parse(line);
      return value !== null && typeof value === "object" && !Array.isArray(value) ? value : null;
    } catch {
      return null;
    }
  });
}
function firstInteractiveRecord(text) {
  for (const record of parseLines(text)) {
    if (!record || !Object.hasOwn(record, "entrypoint"))
      continue;
    const timestamp = record.timestamp;
    if (typeof record.entrypoint === "string" && ADMITTED_ENTRYPOINTS.includes(record.entrypoint) && typeof timestamp === "string" && ISO.test(timestamp) && Number.isFinite(Date.parse(timestamp)))
      return { state: "admitted", started_at: Date.parse(timestamp) };
    return { state: "refused" };
  }
  return { state: "absent" };
}
function readTranscriptHead(path) {
  let fd;
  try {
    fd = openSync2(path, "r");
  } catch {
    return null;
  }
  try {
    const buffer = Buffer.alloc(HEAD_BYTES);
    const read = readSync(fd, buffer, 0, HEAD_BYTES, 0);
    return buffer.subarray(0, read).toString("utf8");
  } catch {
    return null;
  } finally {
    closeSync2(fd);
  }
}
function readTranscript(path) {
  try {
    return readFileSync5(path, "utf8");
  } catch {
    return null;
  }
}
function listSessionTranscripts(transcriptPath) {
  const name = basename2(transcriptPath);
  const main = claudeCodeNativeId(name);
  if (!main)
    return [];
  const listed = [
    {
      relative_path: name,
      absolute_path: transcriptPath,
      native_session_id: main
    }
  ];
  const sessionDirectory = join5(dirname3(transcriptPath), main);
  const children = [];
  const visit = (directory, relative) => {
    let entries;
    try {
      entries = readdirSync3(directory, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const path = [...relative, entry.name];
      if (entry.isDirectory())
        visit(join5(directory, entry.name), path);
      else if (entry.isFile()) {
        const relativePath = [main, ...path].join("/");
        const native = claudeCodeNativeId(relativePath);
        if (native)
          children.push({
            relative_path: relativePath,
            absolute_path: join5(directory, entry.name),
            native_session_id: native
          });
      }
    }
  };
  visit(join5(sessionDirectory, "subagents"), ["subagents"]);
  children.sort((a, b) => a.relative_path < b.relative_path ? -1 : a.relative_path > b.relative_path ? 1 : 0);
  return [...listed, ...children];
}
async function undatedRecordHashes(text) {
  const hashes = [];
  for (const record of parseLines(text)) {
    if (record && !Object.hasOwn(record, "timestamp"))
      hashes.push(await computeArgsHash(record));
  }
  return hashes;
}
function childParentTurn(text) {
  const records = parseLines(text);
  const first = records.find((record) => record !== null);
  const dated = records.find((record) => record !== null && typeof record.timestamp === "string" && ISO.test(record.timestamp));
  const turn = first?.promptId;
  if (typeof turn !== "string" || !turn || !dated)
    return null;
  return { turn_key: turn, started_at: Date.parse(dated.timestamp) };
}
function lastTurnFacts(text) {
  const records = parseLines(text).filter((record) => record !== null);
  const prompt = [...records].reverse().find((record) => typeof record.promptId === "string" && record.promptId);
  const assistant = [...records].reverse().find((record) => record.type === "assistant");
  const versioned = [...records].reverse().find((record) => typeof record.version === "string" && /^\d{1,9}\.\d{1,9}\.\d{1,9}$/.test(record.version));
  return {
    turn_key: prompt?.promptId ?? null,
    failed: assistant?.isApiErrorMessage === true,
    client_version: versioned?.version ?? null
  };
}
function completeLines(text) {
  return text.slice(0, text.lastIndexOf(`
`) + 1);
}
var NATIVE_SESSION_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function snakePredecessor(text, nativeSessionId) {
  for (const record of parseLines(text)) {
    if (!record || typeof record.session_id !== "string")
      continue;
    const named = record.session_id.toLowerCase();
    return NATIVE_SESSION_ID.test(named) && named !== nativeSessionId.toLowerCase() ? named : null;
  }
  return null;
}

import { dirname as dirname4, join as join6 } from "node:path";

function eligibleContentBoundary(input) {
  if (!input.observation || !Number.isSafeInteger(input.from_ms) || input.from_ms > input.through)
    return { state: "unknown" };
  const preexisting = new Set(input.observation.preexisting_undated[input.relative_path] ?? []);
  const unique = [...new Set(input.undated)];
  return {
    state: "established",
    from_ms: input.from_ms,
    through_ms: input.through,
    eligible_undated_sha256: unique.filter((hash) => !preexisting.has(hash)),
    excluded_undated_sha256: unique.filter((hash) => preexisting.has(hash))
  };
}
function snapshotArtifactSets(input) {
  return normalizeClaudeCodeSessions({
    team_id: input.team_id,
    actor_user_id: input.actor_user_id,
    transcripts: input.transcripts.map((transcript) => ({
      path: transcript.relative_path,
      text: transcript.text,
      registration: {
        archive_session_id: transcript.archive_session_id,
        session_id: transcript.native_session_id,
        channel: "harness:claude-code"
      },
      registration_started_at: transcript.started_at,
      boundary: transcript.boundary
    }))
  });
}

var ADAPTER_VERSION = "1.0.0";
var UPLOAD_TTL_SECONDS = 300;
var CHANNEL = "harness:claude-code";
var PERMANENT_SESSION_REFUSALS = [
  "history_boundary_unproven",
  "not_found"
];
var WITHDRAWAL_REFUSALS = [
  "not_enrolled",
  "not_a_member",
  "local_capture_disabled"
];
var DEFER_BASE_MS = 5000;
var DEFER_CAP_MS = 5 * 60000;
function deferralMs(attempts) {
  return Math.min(DEFER_CAP_MS, DEFER_BASE_MS * 2 ** Math.max(0, attempts - 1));
}
function deferralCapped(set) {
  return set.deferred !== null && deferralMs(set.deferred.attempts) >= DEFER_CAP_MS;
}
var TRANSFORMATION_FAILURES = [
  "transformation_failed",
  "invalid_transcript"
];
var ENDS_RUN = ["withdrawn", "disabled", "revoked", "credential_rejected"];
var SESSION_END_REASONS = [
  "clear",
  "resume",
  "logout",
  "prompt_input_exit",
  "other"
];
function endReason(reason) {
  if (reason === null)
    return;
  return SESSION_END_REASONS.includes(reason) ? reason : "other";
}
function removeSpooled(store, set, pending) {
  if (!set.archive_session_id)
    return;
  for (const artifact of pending.artifacts)
    store.remove(store.spoolPath(set.archive_session_id, pending.revision, artifact.kind));
}
function discardPending(store, set) {
  for (const pending of set.pending)
    removeSpooled(store, set, pending);
  set.pending = [];
}
function dropPendingRevision(store, set, revision) {
  const pending = set.pending.find((entry) => entry.revision === revision);
  if (!pending)
    return;
  removeSpooled(store, set, pending);
  set.pending = set.pending.filter((entry) => entry !== pending);
}
function dropHead(store, set) {
  const head = set.pending[0];
  if (head)
    removeSpooled(store, set, head);
  set.pending = set.pending.slice(1);
}
function settle(context, set, outcome, step) {
  if (outcome.kind === "unavailable")
    return "retry_later";
  if (outcome.kind === "unauthorized")
    return "credential_rejected";
  if (outcome.kind === "revoked")
    return "revoked";
  const code = outcome.code;
  if (WITHDRAWAL_REFUSALS.includes(code)) {
    context.withdrawal = code;
    return "withdrawn";
  }
  if (code === "adapter_not_admitted") {
    context.disabled = "adapter_not_admitted";
    return "disabled";
  }
  context.store.updateStatus(context.now(), (status) => count(status.refusals, code));
  if (step === "register") {
    if (code === "parent_not_registered") {
      const attempts = (set.deferred?.attempts ?? 0) + 1;
      set.deferred = { attempts, until: context.now() + deferralMs(attempts) };
      return "done";
    }
    set.gap = code;
    discardPending(context.store, set);
    return "done";
  }
  if (code === "revision_conflict") {
    dropHead(context.store, set);
    set.resync = true;
    set.last_content = null;
    return "recheck";
  }
  if (PERMANENT_SESSION_REFUSALS.includes(code)) {
    set.gap = code;
    discardPending(context.store, set);
    return "done";
  }
  dropHead(context.store, set);
  return "done";
}
function recordUuids(raw) {
  const uuids = new Set;
  for (const line of raw.split(`
`)) {
    try {
      const record = JSON.parse(line);
      const uuid2 = record !== null && typeof record === "object" ? record.uuid : undefined;
      if (typeof uuid2 === "string")
        uuids.add(uuid2);
    } catch {}
  }
  return uuids;
}
function replaces(newer, older) {
  for (const uuid2 of older)
    if (!newer.has(uuid2))
      return false;
  return true;
}
function dropRevision(context, session, set, reason) {
  context.store.updateStatus(context.now(), (status) => count(status.refusals, reason));
  dropHead(context.store, set);
  context.store.saveSession(session);
  return "done";
}
async function registerSet(context, session, set, repeat = false) {
  if (set.archive_session_id && !repeat)
    return "done";
  if (set.gap || set.started_at === null)
    return "done";
  const outcome = await context.api.register({
    channel: CHANNEL,
    native_session_id: set.native_session_id,
    team_id: context.config.team_id,
    started_at: set.started_at,
    ...set.parent ? { parent: set.parent } : {}
  });
  if (outcome.kind !== "ok") {
    const result = settle(context, set, outcome, "register");
    if (!ENDS_RUN.includes(result))
      context.store.saveSession(session);
    return result;
  }
  await context.registered();
  set.archive_session_id = outcome.data.archive_session_id;
  set.confirmed_revision = outcome.data.confirmed_revision;
  set.revision = Math.max(set.revision, outcome.data.confirmed_revision ?? 0);
  if (set.deferred && !session.open)
    session.snapshot_due = true;
  set.deferred = null;
  context.store.saveSession(session);
  return "done";
}
async function resyncSet(context, session, set) {
  if (!set.resync)
    return "done";
  const result = await registerSet(context, session, set, true);
  if (result !== "done")
    return result;
  const confirmed = set.confirmed_revision ?? 0;
  for (const pending of set.pending.filter((entry) => entry.revision <= confirmed))
    removeSpooled(context.store, set, pending);
  set.pending = set.pending.filter((entry) => entry.revision > confirmed);
  set.resync = false;
  context.store.saveSession(session);
  return "done";
}
function childSet(main, listed, turn) {
  return defaultSetState({
    native_session_id: listed.native_session_id,
    relative_path: listed.relative_path,
    started_at: turn.started_at,
    parent: {
      native_session_id: main.native_session_id,
      turn_key: turn.turn_key,
      transfer_mode: "return_to_caller"
    }
  });
}
async function registerChildren(context, session) {
  const known = new Set(session.sets.map((set) => set.native_session_id));
  const main = session.sets[0];
  for (const listed of listSessionTranscripts(session.transcript_path).slice(1)) {
    if (known.has(listed.native_session_id))
      continue;
    const text = readTranscript(listed.absolute_path);
    const turn = text ? childParentTurn(text) : null;
    if (!turn)
      continue;
    session.sets.push(childSet(main, listed, turn));
  }
  context.store.saveSession(session);
  for (const set of session.sets) {
    if (set !== main && set.deferred && !set.archive_session_id) {
      if (context.now() < set.deferred.until)
        continue;
      const parent = await registerSet(context, session, main, true);
      if (parent !== "done")
        return parent;
    }
    const result = await registerSet(context, session, set);
    if (result !== "done")
      return result;
  }
  return "done";
}
async function buildRevisions(context, session, final) {
  const through = context.now();
  const registered = session.sets.filter((set) => set.archive_session_id !== null && set.started_at !== null && !set.gap && !set.resync);
  session.last_snapshot_at = through;
  if (!registered.length)
    return;
  const base = dirname4(session.transcript_path);
  const transcripts = [];
  let mainText = "";
  for (const set of registered) {
    const absolute = set === session.sets[0] ? session.transcript_path : join6(base, ...set.relative_path.split("/"));
    const read = readTranscript(absolute);
    if (read === null)
      continue;
    const text = completeLines(read);
    if (set === session.sets[0])
      mainText = text;
    transcripts.push({
      relative_path: set.relative_path,
      text,
      native_session_id: set.native_session_id,
      archive_session_id: set.archive_session_id,
      started_at: set.started_at,
      boundary: eligibleContentBoundary({
        observation: session.observation,
        relative_path: set.relative_path,
        undated: await undatedRecordHashes(text),
        from_ms: context.fromMs(),
        through
      })
    });
  }
  if (!transcripts.length)
    return;
  const result = await snapshotArtifactSets({
    team_id: context.config.team_id,
    actor_user_id: context.config.actor_user_id,
    transcripts
  });
  if (result.status !== "normalized") {
    if (final)
      context.store.updateStatus(context.now(), (status) => {
        if (TRANSFORMATION_FAILURES.includes(result.reason))
          count(status.transformation_failures, result.reason);
        else
          count(status.refusals, result.reason);
      });
    return;
  }
  const facts = lastTurnFacts(mainText);
  const predecessor = snakePredecessor(mainText, session.native_session_id);
  for (const artifactSet of result.sessions) {
    const set = registered.find((candidate) => candidate.archive_session_id === artifactSet.archive_session_id);
    if (!set)
      continue;
    const uuids = recordUuids(artifactSet.raw);
    if (!uuids.size) {
      if (final)
        context.store.updateStatus(context.now(), (status) => count(status.refusals, "no_eligible_content"));
      continue;
    }
    const records = `${sha256Hex(artifactSet.raw)}:${sha256Hex(artifactSet.normalized)}`;
    const content = final ? `${records}:end` : records;
    if (set.last_content === content || !final && set.last_content?.startsWith(records))
      continue;
    const main = set === session.sets[0];
    const reason = endReason(session.end_reason);
    const revision = set.revision + 1;
    const contents = {
      raw: artifactSet.raw,
      normalized: artifactSet.normalized,
      manifest: artifactSet.manifest
    };
    const artifacts = ["raw", "normalized", "manifest"].map((kind) => {
      const bytes = Buffer.from(contents[kind], "utf8");
      context.store.write(context.store.spoolPath(set.archive_session_id, revision, kind), bytes);
      return {
        kind,
        content_sha256: sha256Hex(bytes),
        expected_bytes: bytes.byteLength
      };
    });
    const newest = set.pending.at(-1);
    if (newest) {
      let older = null;
      try {
        older = recordUuids(context.store.readSpooled(context.store.spoolPath(set.archive_session_id, newest.revision, "raw")).toString("utf8"));
      } catch {}
      if (older && replaces(uuids, older)) {
        removeSpooled(context.store, set, newest);
        set.pending = set.pending.slice(0, -1);
      }
    }
    set.revision = revision;
    set.last_content = content;
    set.pending.push({
      revision,
      built_at: through,
      artifacts,
      transformation_report: {
        total_redactions: artifactSet.transformation_report.total_redactions,
        by_class: artifactSet.transformation_report.by_class,
        transformer: artifactSet.transformation_report.transformer,
        status: "transformed",
        failure_reason: null
      },
      confirm: {
        source: {
          adapter_version: ADAPTER_VERSION,
          client_version: facts.client_version
        },
        ...session.ended_at !== null && !session.open ? { ended_at: session.ended_at } : {},
        ...main && reason && !session.open ? { outcome_end_reason: reason } : {},
        ...main && predecessor ? {
          lineage: [
            {
              kind: "continues",
              object_native_session_id: predecessor,
              evidence: "snake_session_id"
            }
          ]
        } : {},
        event_count: artifactSet.event_count,
        client_counts: artifactSet.client_counts,
        usage: artifactSet.usage,
        execution: main && facts.failed ? {
          turn_key: facts.turn_key,
          observed_at: through,
          state: "failed",
          error_class: "harness_api_error"
        } : {
          turn_key: main ? facts.turn_key : null,
          observed_at: through,
          state: session.open ? "running" : "completed",
          error_class: null
        }
      }
    });
  }
  context.store.saveSession(session);
}
async function uploadPending(context, session, set) {
  const pending = set.pending[0];
  if (!pending || !set.archive_session_id)
    return "done";
  const declared = {
    archive_session_id: set.archive_session_id,
    revision: pending.revision,
    artifacts: pending.artifacts,
    transformation_report: pending.transformation_report
  };
  const requested = await context.api.requestUploads({
    ...declared,
    ttl_seconds: UPLOAD_TTL_SECONDS
  });
  if (requested.kind !== "ok") {
    const result = settle(context, set, requested, "upload");
    if (!ENDS_RUN.includes(result))
      context.store.saveSession(session);
    return result;
  }
  if (!("items" in requested.data))
    return confirmed(context, session, set);
  for (const item of requested.data.items) {
    if (!uploadUrlAllowed(item.presigned_url, context.config.origin))
      return dropRevision(context, session, set, "put_url_refused");
    let bytes;
    try {
      bytes = context.store.readSpooled(context.store.spoolPath(set.archive_session_id, pending.revision, item.kind));
    } catch (error) {
      if (error instanceof LocalIoBusy)
        throw error;
      return dropRevision(context, session, set, "spool_missing");
    }
    const put = await context.api.put(item.presigned_url, item.required_headers, bytes);
    if (put.kind === "refused")
      return dropRevision(context, session, set, "put_refused");
    if (put.kind !== "ok")
      return "retry_later";
  }
  const confirmation = await context.api.confirm({
    ...declared,
    ...pending.confirm
  });
  if (confirmation.kind !== "ok") {
    const result = settle(context, set, confirmation, "upload");
    if (!ENDS_RUN.includes(result))
      context.store.saveSession(session);
    return result;
  }
  return confirmed(context, session, set);
}
async function uploadAll(context, session, set) {
  while (set.pending.length && !set.gap && !set.resync) {
    const before = set.pending.length;
    const head = set.pending[0].revision;
    const result = await uploadPending(context, session, set);
    if (result !== "done")
      return result;
    if (set.pending.length === before && set.pending[0]?.revision === head)
      break;
  }
  return "done";
}
function confirmed(context, session, set) {
  set.confirmed_revision = set.pending[0].revision;
  dropHead(context.store, set);
  context.store.saveSession(session);
  context.store.updateStatus(context.now(), (status) => {
    status.confirmed_revisions++;
    status.last_confirm_at = context.now();
  });
  return "done";
}

var OFFLINE_BASE_MS = 5000;
var OFFLINE_CAP_MS = 5 * 60000;
function offlineDelayMs(failures, random) {
  const ceiling = Math.min(OFFLINE_CAP_MS, OFFLINE_BASE_MS * 2 ** Math.max(0, failures - 1));
  return Math.floor(ceiling * (0.5 + random() * 0.5));
}
var DEFAULT_TIMINGS = {
  settleMs: 2000,
  pollMs: 250,
  idleMs: 30000,
  quietMs: 30 * 60000,
  snapshotMs: 3 * 60000
};
async function observation(transcriptPath) {
  const preexisting = {};
  for (const listed of listSessionTranscripts(transcriptPath)) {
    const text = readTranscript(listed.absolute_path);
    if (text !== null)
      preexisting[listed.relative_path] = await undatedRecordHashes(text);
  }
  return { preexisting_undated: preexisting };
}
async function observe(marker, config, ports) {
  const inside = admittedCwd(marker.cwd, config.roots, ports.platform, ports.realpath);
  return {
    schema: 1,
    native_session_id: marker.session_id,
    transcript_path: marker.transcript_path,
    cwd: marker.cwd,
    first_seen_at: Math.round(marker.observed_at),
    last_snapshot_at: null,
    observation: await observation(marker.transcript_path),
    admission: inside ? "pending" : "outside_roots",
    open: true,
    ended_at: null,
    end_reason: null,
    snapshot_due: false,
    sets: [
      defaultSetState({
        native_session_id: marker.session_id,
        relative_path: basename3(marker.transcript_path)
      })
    ]
  };
}
async function consumeInbox(store, config, ports) {
  const { markers, rejected } = readInbox(store.paths.inbox);
  for (const file of rejected)
    store.remove(file);
  for (const marker of markers) {
    if (basename3(marker.transcript_path) !== `${marker.session_id}.jsonl`) {
      store.remove(marker.file);
      continue;
    }
    let session = store.session(marker.session_id);
    if (marker.event === "SessionStart") {
      if (!session) {
        session = await observe(marker, config, ports);
        if (session.admission === "outside_roots")
          store.updateStatus(ports.now(), (status) => count(status.not_captured, "outside_roots"));
      } else if (session.admission === "withdrawn") {
        store.remove(marker.file);
        continue;
      } else {
        session.open = true;
        session.ended_at = null;
        session.end_reason = null;
      }
    } else if (session) {
      session.open = false;
      session.ended_at = Math.round(marker.observed_at);
      session.end_reason = marker.reason;
      session.snapshot_due = isPendingOrAdmitted(session);
    }
    if (session)
      store.saveSession(session);
    store.remove(marker.file);
  }
  return markers.length + rejected.length > 0;
}
function transcriptChangedAt(session) {
  try {
    return statSync3(session.transcript_path).mtimeMs;
  } catch {
    return null;
  }
}
function lastActivity(session) {
  const changed = transcriptChangedAt(session);
  return changed === null ? session.first_seen_at : Math.max(changed, session.first_seen_at);
}
function needsWork(session, now, timings) {
  if (!isPendingOrAdmitted(session))
    return false;
  if (session.sets[0]?.gap)
    return false;
  if (session.snapshot_due)
    return true;
  if (session.sets.some((set) => (set.pending.length || set.resync) && !set.gap))
    return true;
  if (session.sets.some((set) => set.deferred && (!deferralCapped(set) || now >= set.deferred.until)))
    return true;
  if (session.admission === "pending" && !session.open)
    return true;
  return session.open && now - lastActivity(session) <= timings.quietMs;
}
function finalizeIdle(store, session, now, timings) {
  if (!isPendingOrAdmitted(session) || !session.open)
    return;
  const last = lastActivity(session);
  if (now - last <= timings.quietMs)
    return;
  session.open = false;
  session.ended_at = Math.round(last);
  session.end_reason = null;
  session.snapshot_due = true;
  store.saveSession(session);
}
function dueSnapshot(session, now, timings) {
  if (session.snapshot_due)
    return session.ended_at !== null && now - session.ended_at >= timings.settleMs ? "final" : null;
  if (!session.open || !session.sets[0]?.archive_session_id)
    return null;
  const last = session.last_snapshot_at;
  if (now - (last ?? session.first_seen_at) < timings.snapshotMs)
    return null;
  const changed = transcriptChangedAt(session);
  if (changed === null || last !== null && changed <= last)
    return null;
  return "timer";
}
function admit(store, session, now, timings) {
  if (session.admission !== "pending")
    return;
  const settled = session.ended_at !== null && now - session.ended_at >= timings.settleMs;
  const head = readTranscriptHead(session.transcript_path);
  const first = head === null ? { state: "absent" } : firstInteractiveRecord(head);
  if (first.state === "admitted") {
    session.admission = "admitted";
    session.sets[0].started_at = first.started_at;
  } else if (first.state === "refused" || settled) {
    session.admission = first.state === "refused" ? "entrypoint_not_admitted" : "no_interactive_record";
    session.snapshot_due = false;
    store.updateStatus(now, (status) => count(status.not_captured, session.admission));
  } else
    return;
  store.saveSession(session);
}
async function registerPass(context, session, timings, withdrawn) {
  if (session.admission !== "admitted")
    return "done";
  const main = session.sets[0];
  const registered = await registerSet(context, session, main);
  if (registered !== "done")
    return registered;
  if (!main.archive_session_id)
    return "done";
  if (withdrawn()) {
    if (session.snapshot_due) {
      session.snapshot_due = false;
      context.store.saveSession(session);
    }
    return "done";
  }
  for (const set of session.sets) {
    if (!set.resync)
      continue;
    const result = await resyncSet(context, session, set);
    if (result !== "done")
      return result;
    session.last_snapshot_at = null;
    if (!session.open)
      session.snapshot_due = true;
    context.store.saveSession(session);
  }
  const now = context.now();
  const deferralDue = session.sets.some((set) => set.deferred && now >= set.deferred.until);
  if (dueSnapshot(session, now, timings) || deferralDue)
    return registerChildren(context, session);
  return "done";
}
async function drainPass(context, session, timings, withdrawn) {
  if (session.admission !== "admitted" || !session.sets[0].archive_session_id)
    return "done";
  if (withdrawn())
    return "done";
  const due = dueSnapshot(session, context.now(), timings);
  const waiting = session.sets.some((set) => set.deferred && !deferralCapped(set));
  if (due && !(due === "final" && waiting)) {
    await buildRevisions(context, session, due === "final");
    if (due === "final") {
      session.snapshot_due = false;
      context.store.saveSession(session);
    }
  }
  for (const set of session.sets) {
    const uploaded = await uploadAll(context, session, set);
    if (uploaded !== "done")
      return uploaded;
  }
  return "done";
}
function enforceSpoolBounds(store, now) {
  const sessions = store.sessions();
  const revisions = sessions.flatMap((session, index) => session.sets.flatMap((set, setIndex) => set.pending.map((pending) => ({
    key: { index, setIndex, revision: pending.revision },
    bytes: pendingBytes(pending),
    built_at: pending.built_at
  }))));
  const drops = spoolDrops(revisions, now);
  if (!drops.length)
    return;
  const touched = new Set;
  for (const { key } of drops) {
    dropPendingRevision(store, sessions[key.index].sets[key.setIndex], key.revision);
    touched.add(key.index);
  }
  for (const index of touched)
    store.saveSession(sessions[index]);
  store.updateStatus(now, (status) => {
    for (const { reason } of drops)
      count(status.dropped, reason);
  });
}
function sameEnablement(started, current) {
  return current !== null && current.enabled_at === started.enabled_at && current.installation_id === started.installation_id && current.team_id === started.team_id && current.origin === started.origin;
}
function optOut(store, session, config, ports, now) {
  if (!isPendingOrAdmitted(session))
    return;
  if (admittedCwd(session.cwd, config.roots, ports.platform, ports.realpath))
    return;
  for (const set of session.sets)
    discardPending(store, set);
  session.admission = "opted_out";
  session.snapshot_due = false;
  store.saveSession(session);
  store.updateStatus(now, (status) => count(status.not_captured, "opted_out"));
}
function closeAll(store) {
  for (const session of store.sessions()) {
    const pending = session.sets.some((set) => set.pending.length);
    if (!pending && !isPendingOrAdmitted(session))
      continue;
    for (const set of session.sets)
      discardPending(store, set);
    if (isPendingOrAdmitted(session)) {
      session.admission = "withdrawn";
      session.open = false;
      session.snapshot_due = false;
    }
    store.saveSession(session);
  }
}
function closeAllWhenFree(store) {
  try {
    closeAll(store);
  } catch (error) {
    if (!(error instanceof LocalIoBusy))
      throw error;
  }
}
function withdraw(store, admission, reason, now) {
  store.saveAdmission({
    from_ms: admission.from_ms,
    withdrawn: { at: now, reason, checked_at: now },
    disabled: admission.disabled
  });
  store.updateStatus(now, (status) => count(status.refusals, reason));
  closeAll(store);
}
function disable(store, admission, reason, now) {
  store.saveAdmission({ ...admission, disabled: { reason, at: now } });
  completeDisable(store, reason);
  if (reason === "adapter_not_admitted")
    store.updateStatus(now, (status) => count(status.refusals, reason));
}
function completeDisable(store, reason) {
  if (reason === "credential_revoked") {
    store.remove(store.paths.credential);
    store.remove(store.paths.spool);
  }
  closeAllWhenFree(store);
}
async function readmit(store, sessions, now) {
  for (const session of sessions) {
    if (!isPendingOrAdmitted(session))
      continue;
    session.observation = await observation(session.transcript_path);
    store.saveSession(session);
  }
  store.saveAdmission({ from_ms: now, withdrawn: null, disabled: null });
}
function emptyInbox(store) {
  let names;
  try {
    names = readdirSync4(store.paths.inbox);
  } catch {
    return;
  }
  for (const name of names)
    store.remove(join7(store.paths.inbox, name));
}
function bySessionStart(a, b) {
  return a.first_seen_at - b.first_seen_at || (a.native_session_id < b.native_session_id ? -1 : a.native_session_id > b.native_session_id ? 1 : 0);
}
async function runCollector(paths, ports, timings = DEFAULT_TIMINGS) {
  const config = readJson(paths.config);
  if (!config)
    return;
  if (ports.platform === "win32" && !accessIsPrivate(ports.readDirectoryAccess(paths.root)))
    return;
  const lock = CollectorLock.acquire(paths.lock, ports.now());
  if (!lock)
    return;
  let lockLost = false;
  const heartbeat = setInterval(() => {
    if (!lock.heartbeat(ports.now()))
      lockLost = true;
  }, HEARTBEAT_MS);
  const store = new Store(paths, lock, ports.io);
  const setState = (state) => store.updateStatus(ports.now(), (status) => {
    status.state = state;
  });
  try {
    store.completeDeletions();
    const disabledAt = store.admission(config).disabled;
    if (disabledAt) {
      completeDisable(store, disabledAt.reason);
      emptyInbox(store);
      return;
    }
    removeStaleParts(paths.inbox, ports.now(), (path) => store.remove(path));
    const api = new CaptureApi({ ...ports, origin: config.origin }, {
      read: () => store.credential(),
      write: (credential) => store.saveCredential(credential)
    });
    let sessions = [];
    const context = {
      api,
      store,
      config,
      now: ports.now,
      fromMs: () => store.admission(config).from_ms,
      registered: async () => {
        if (store.admission(config).withdrawn)
          await readmit(store, sessions, ports.now());
      },
      withdrawal: null,
      disabled: null
    };
    const withdrawn = () => store.admission(config).withdrawn !== null;
    let link = "unchecked";
    let failures = 0;
    let nextAttempt = 0;
    let lastActivityAt = ports.now();
    const offline = () => {
      link = "offline";
      failures++;
      nextAttempt = ports.now() + offlineDelayMs(failures, ports.random);
      setState("offline");
    };
    const stop = (result) => {
      if (result === "done")
        return "continue";
      if (result === "incompatible_api" || result === "credential_rejected") {
        setState(result);
        return "end";
      }
      if (result === "withdrawn") {
        withdraw(store, store.admission(config), context.withdrawal ?? "withdrawn", ports.now());
        setState("idle");
        return "end";
      }
      if (result === "disabled" || result === "revoked") {
        const reason = result === "revoked" ? "credential_revoked" : context.disabled ?? "adapter_not_admitted";
        disable(store, store.admission(config), reason, ports.now());
        setState("idle");
        return "end";
      }
      if (result === "recheck")
        link = "unchecked";
      else
        offline();
      return "pause";
    };
    setState("running");
    for (;; ) {
      const now = ports.now();
      if (lockLost || !lock.owns())
        return;
      if (store.admission(config).disabled)
        return;
      const current = readJson(paths.config);
      if (!sameEnablement(config, current)) {
        setState("idle");
        return;
      }
      config.roots = current.roots;
      try {
        if (await consumeInbox(store, config, ports))
          lastActivityAt = now;
        enforceSpoolBounds(store, now);
        sessions = store.sessions().sort(bySessionStart);
        for (const session of sessions) {
          admit(store, session, now, timings);
          optOut(store, session, config, ports, now);
          finalizeIdle(store, session, now, timings);
        }
        const withdrawal = store.admission(config).withdrawn;
        if (withdrawal && now - withdrawal.checked_at < READMISSION_CHECK_MS) {
          closeAllWhenFree(store);
          setState("idle");
          return;
        }
        const open = sessions.filter((session) => needsWork(session, now, timings));
        const admitted = open.filter((session) => session.admission === "admitted");
        if (open.length)
          lastActivityAt = now;
        if (withdrawal && admitted.length) {
          store.saveAdmission({
            ...store.admission(config),
            withdrawn: { ...withdrawal, checked_at: now }
          });
        }
        if (admitted.length && link !== "admitted" && now >= nextAttempt) {
          const preflight = await api.preflight();
          if (preflight === "incompatible_api" && stop("incompatible_api") === "end")
            return;
          if (preflight === "compatible") {
            const identity = await api.whoami();
            if (identity.kind === "unauthorized" && stop("credential_rejected") === "end")
              return;
            if (identity.kind === "revoked" && stop("revoked") === "end")
              return;
            if (identity.kind === "ok" && !identity.data.teams.some((team) => team.team_id === config.team_id)) {
              context.withdrawal = "not_a_member";
              if (stop("withdrawn") === "end")
                return;
            }
            if (identity.kind === "ok")
              link = "admitted";
          }
          if (link !== "admitted")
            offline();
          else {
            failures = 0;
            setState("running");
          }
        }
        if (admitted.length && link === "admitted") {
          drain:
            for (const pass of [registerPass, drainPass]) {
              for (const session of admitted) {
                const result = stop(await pass(context, session, timings, withdrawn));
                if (result === "end")
                  return;
                if (result === "pause")
                  break drain;
              }
            }
        } else if (admitted.length && !withdrawn()) {
          for (const session of admitted) {
            if (dueSnapshot(session, now, timings) === "timer")
              await buildRevisions(context, session, false);
          }
        }
        store.flushRetries(ports.now());
      } catch (error) {
        if (!(error instanceof LocalIoBusy))
          throw error;
      }
      if (!sessions.some((session) => needsWork(session, now, timings)) && now - lastActivityAt >= timings.idleMs) {
        setState("idle");
        return;
      }
      await ports.sleep(timings.pollMs);
    }
  } catch (error) {
    if (!(error instanceof LockLost))
      throw error;
  } finally {
    clearInterval(heartbeat);
    lock.release();
  }
}

import { existsSync as existsSync3, readFileSync as readFileSync6 } from "node:fs";
import { posix as posix2, win32 as win322 } from "node:path";
var MINIMUM_NODE_MAJOR = 22;
var PRINTABLE_ASCII = /^[\x20-\x7e]+$/;
function runtimeRecord(execPath, version, platform) {
  const path = platform === "win32" ? execPath.replaceAll("\\", "/") : execPath;
  const major = /^v?(\d+)\.\d+\.\d+$/.exec(version)?.[1];
  if (!major || Number(major) < MINIMUM_NODE_MAJOR || !(platform === "win32" ? win322 : posix2).isAbsolute(execPath) || !PRINTABLE_ASCII.test(path))
    return null;
  return { version: version.replace(/^v/, ""), path };
}
function formatRuntimeRecord(record) {
  return `${record.version} ${record.path}
`;
}
function parseRuntimeRecord(text) {
  const line = text.replace(/\r?\n$/, "");
  const space = line.indexOf(" ");
  if (space < 1 || !PRINTABLE_ASCII.test(line))
    return null;
  return { version: line.slice(0, space), path: line.slice(space + 1) };
}
function recordedRuntimeAvailable(recordPath) {
  try {
    const record = parseRuntimeRecord(readFileSync6(recordPath, "latin1"));
    return record !== null && existsSync3(record.path);
  } catch {
    return false;
  }
}

import { createInterface } from "node:readline";
var PRIVACY_CONTACT = "hello@atmina.ai";
var PRIVACY_NOTICE_URL = "https://atmina.ai/privacy";
var DATA_CONTROLS_URL = "https://atmina.ai/docs/your-data";
var ENABLE_ANSWER = "yes";
var NOTICE_TEAM_HEAD = "Enable capture of live interactive Claude Code work from these selected projects on this device for ";
var NOTICE_TEAM_TAIL = ". Capture can include your prompts, agent responses, reasoning, code and tool activity, including information those tools read outside the selected project. Historical sessions and unattended runs are excluded.";
var NOTICE_PARAGRAPHS = [
  "You can read your captured Sessions. Your team's owners and administrators can inspect permitted diagnostic information through audited access. Tool bodies are readable only by the person who created the Session; conversation text and summaries visible to administrators may still quote tool output. Ordinary teammates do not automatically get access. This data is not used for model training or individual productivity evaluation.",
  "Automatic protection runs before our collector stores or uploads content, but it may miss sensitive information. A protected local queue can retain up to 64 MiB for this team on this device for up to 30 days while waiting to upload. A compromised device can still expose it.",
  "Stopping enrollment stops new API admission and archive confirmation, and stops the collector when it learns of the change; an offline device may learn later. An upload URL already issued can remain usable for up to an hour, leaving inaccessible unconfirmed bytes subject to retention and cleanup. Pending collector copies are then cleared. Re-enrollment captures eligible new work only, without catching up the disabled period. Already-uploaded archives follow their retention and erasure rules. Removing our collector does not delete Claude Code's original transcripts.",
  `Each archive is retained for twelve months from its newest captured content; continued capture extends the life of the whole archive. Deleting a chat does not delete its captured Session archive. Content removed by retention is not automatically restored when a local session resumes. Use the linked export and erasure controls for existing records. Contact ${PRIVACY_CONTACT} to exercise your rights, object to processing or raise a privacy complaint; the linked privacy notice explains complaints to a regulator. Latent Minds Pty Ltd is the controller for this internal pilot; enrollment is your product control on top of the basis assessed in our DPIA.`
];
function enableNotice(input) {
  const teamName = input.teamName.replace(/[\u0000-\u001f\u007f-\u009f]/g, "");
  return [
    `${NOTICE_TEAM_HEAD}${teamName}${NOTICE_TEAM_TAIL}`,
    ["Selected projects:", ...input.projects.map((project) => `  ${project}`)].join(`
`),
    ...NOTICE_PARAGRAPHS,
    [
      `Export and erasure controls: ${DATA_CONTROLS_URL}`,
      `Privacy notice: ${PRIVACY_NOTICE_URL}`,
      `Privacy contact: ${PRIVACY_CONTACT}`
    ].join(`
`),
    `Type ${ENABLE_ANSWER} to enable capture for ${teamName} on this device. Any other answer enables nothing.`
  ].join(`

`);
}
function acceptsNotice(answer) {
  return answer !== null && answer.trim().toLowerCase() === ENABLE_ANSWER;
}
var NOTICE_NEEDS_TERMINAL = "The answer must be typed at a terminal, so piped or redirected input enables nothing.";
async function askNotice(notice, terminal) {
  terminal.write(`
${notice}
`);
  if (terminal.input.isTTY !== true) {
    terminal.write(`${NOTICE_NEEDS_TERMINAL}
`);
    return false;
  }
  const lines = createInterface({ input: terminal.input, terminal: false });
  try {
    for await (const line of lines)
      return acceptsNotice(line);
    return false;
  } catch {
    return false;
  } finally {
    lines.close();
  }
}

var DEFAULT_ORIGIN = "https://mcp.atmina.ai";
var ENABLE_REFUSAL_TEXT = {
  windows_unverified: "windows_unverified: local capture has not yet been verified on Windows, so it cannot be enabled on this device yet.",
  data_directory_unresolved: "data_directory_unresolved: the plugin data directory could not be found. Run this from Claude Code, or set CLAUDE_CONFIG_DIR.",
  runtime_missing: "runtime_missing: run this with Node.js 22 or later, installed at a path of plain ASCII characters.",
  invalid_origin: "invalid_origin: the Atmina address must use https.",
  root_not_supported: "root_not_supported: project folders on network shares or inside WSL cannot be included.",
  root_not_found: "root_not_found: a project folder to include could not be found.",
  data_directory_shared: "data_directory_shared: other accounts on this computer can read the plugin data directory, so capture stays off.",
  collector_running: "collector_running: the collector is busy with open sessions. Run this again once they have ended.",
  server_unreachable: "server_unreachable: Atmina could not be reached. Try again later.",
  incompatible_api: "incompatible_api: the Atmina server does not offer the capture contract this collector needs.",
  authorization_denied: "authorization_denied: the sign-in for this device was declined.",
  authorization_expired: "authorization_expired: the sign-in code expired before it was confirmed. Run this again.",
  activation_failed: "activation_failed: Atmina did not accept this device's sign-in.",
  team_not_available: "team_not_available: that team is not one you belong to in Atmina.",
  notice_declined: "notice_declined: capture was not enabled, and nothing was written on this device. The device sign-in you just approved stays listed under your account's connections until you disconnect it there; nothing was captured or stored."
};
function validOrigin(origin) {
  let url;
  try {
    url = new URL(origin);
  } catch {
    return null;
  }
  const loopback = url.hostname === "127.0.0.1" || url.hostname === "localhost";
  if (url.protocol !== "https:" && !(url.protocol === "http:" && loopback))
    return null;
  if (url.pathname !== "/" || url.search || url.hash || url.username)
    return null;
  return url.origin;
}
async function enableCapture(options, ports) {
  if (ports.platform === "win32" && !ports.windowsVerified)
    return { state: "windows_unverified" };
  const data = resolveDataDirectory(ports.env, ports.home);
  if (!data)
    return { state: "data_directory_unresolved" };
  const paths = layout(data);
  const runtime = runtimeRecord(ports.execPath, ports.nodeVersion, ports.platform);
  if (!runtime)
    return { state: "runtime_missing" };
  const origin = validOrigin(options.origin);
  if (!origin)
    return { state: "invalid_origin" };
  const roots = [];
  for (const root of options.roots) {
    if (ports.platform === "win32" && isUncPath(root))
      return { state: "root_not_supported" };
    const canonical = canonicalPath(root, ports.platform, ports.realpath);
    if (!canonical)
      return { state: "root_not_found" };
    if (ports.platform === "win32" && canonical.startsWith("//"))
      return { state: "root_not_supported" };
    roots.push(canonical);
  }
  if (!roots.length)
    return { state: "root_not_found" };
  if (ports.platform === "win32" && !accessIsPrivate(ports.readDirectoryAccess(nearestExisting(paths.root))))
    return { state: "data_directory_shared" };
  let credential = null;
  const api = new CaptureApi({ ...ports, origin }, { read: () => credential, write: (next) => credential = next });
  const preflight = await api.preflight();
  if (preflight === "unavailable")
    return { state: "server_unreachable" };
  if (preflight === "incompatible_api")
    return { state: "incompatible_api" };
  const authorized = await authorizeDevice({ ...ports, origin }, ports.show);
  if (authorized.kind !== "authorized")
    return { state: authorized.state };
  credential = authorized.credential;
  const activated = await api.activate();
  if (activated.kind !== "ok")
    return { state: "activation_failed" };
  const identity = await api.whoami();
  if (identity.kind !== "ok")
    return { state: "activation_failed" };
  const team = identity.data.teams.find((candidate) => candidate.team_id === options.team || candidate.team_slug === options.team);
  if (!team || !identity.data.user_id)
    return { state: "team_not_available" };
  if (!await ports.confirm(enableNotice({ teamName: team.team_name, projects: roots })))
    return { state: "notice_declined" };
  makePrivateDirectory(paths.root);
  const lock = CollectorLock.acquire(paths.lock, ports.now());
  if (!lock)
    return { state: "collector_running" };
  try {
    const store = new Store(paths, lock);
    for (const directory of [paths.inbox, paths.sessions, paths.spool, paths.admission])
      store.remove(directory);
    const enabledAt = ports.now();
    store.writeJson(paths.status, emptyStatus(enabledAt));
    store.saveCredential(credential);
    store.write(paths.runtime, formatRuntimeRecord(runtime));
    store.saveAdmission({ from_ms: enabledAt, withdrawn: null, disabled: null });
    const config = {
      schema: 1,
      origin,
      team_id: team.team_id,
      actor_user_id: identity.data.user_id,
      roots,
      installation_id: randomHex(16),
      enabled_at: enabledAt
    };
    store.writeJson(paths.config, config);
  } finally {
    lock.release();
  }
  return { state: "configured" };
}

import { spawn } from "node:child_process";
import { homedir as homedir2 } from "node:os";
function startDetached(paths, bundle) {
  if (!lockIsStale(paths.lock))
    return;
  makePrivateDirectory(paths.root);
  const child = spawn(process.execPath, [bundle, "run"], {
    cwd: homedir2(),
    detached: true,
    stdio: "ignore",
    windowsHide: true,
    env: process.env
  });
  child.on("error", () => {
    return;
  });
  child.unref();
}

import { existsSync as existsSync4, readdirSync as readdirSync5, statSync as statSync4 } from "node:fs";
import { join as join8 } from "node:path";
var STATE_TEXT = {
  not_enabled: "Local capture is not enabled on this device.",
  runtime_missing: "runtime_missing: the Node.js runtime recorded when capture was enabled is no longer there. Run the enable step again.",
  data_directory_shared: "data_directory_shared: other accounts on this computer can read the plugin data directory, so capture stays off.",
  root_not_supported: "root_not_supported: an included project folder is on a network share or inside WSL, so capture stays off. Run the enable step again.",
  credential_revoked: "credential_revoked: Atmina no longer accepts this device's installation, so its queued copies and sign-in were deleted. Run the enable step again.",
  adapter_not_admitted: "adapter_not_admitted: Atmina does not accept capture from this collector, so it is off and its queued copies were deleted.",
  incompatible_api: "incompatible_api: the Atmina server does not offer the capture contract this collector needs, so nothing is sent.",
  credential_rejected: "credential_rejected: Atmina did not accept this device's sign-in. Run the enable step again.",
  withdrawn: "withdrawn: Atmina stopped accepting capture for this team, so nothing is queued or sent. It resumes only for new work once Atmina accepts it again.",
  hooks_blocked: "hooks_blocked: sessions in an included project ran, but the capture hook never reached the collector. A PowerShell policy may be stopping it.",
  configured_awaiting_run: "configured, awaiting a run",
  offline: "offline: Atmina could not be reached; captured sessions wait on this device.",
  capturing: "capturing"
};
var WINDOWS_VERIFIED = false;
var HOOKS_BLOCKED_TRANSCRIPTS = 3;
var HOOKS_BLOCKED_SCAN = 64;
var defaultPorts = () => ({
  platform: currentPlatform(),
  realpath: nativeRealPath,
  readDirectoryAccess: powershellAccessReader,
  projects: null
});
function transcriptCwd(path) {
  const head = readTranscriptHead(path);
  if (head === null)
    return null;
  for (const line of head.split(/\r?\n/)) {
    try {
      const record = JSON.parse(line);
      const cwd = record !== null && typeof record === "object" ? record.cwd : undefined;
      if (typeof cwd === "string" && cwd)
        return cwd;
    } catch {}
  }
  return null;
}
function hooksBlocked(paths, config, ports) {
  if (!ports.projects)
    return false;
  const changed = [];
  let projects;
  try {
    projects = readdirSync5(ports.projects);
  } catch {
    return false;
  }
  for (const project of projects) {
    let names;
    try {
      names = readdirSync5(join8(ports.projects, project));
    } catch {
      continue;
    }
    for (const name of names) {
      const session = claudeCodeNativeId(name);
      if (!session)
        continue;
      const path = join8(ports.projects, project, name);
      try {
        const at2 = statSync4(path).mtimeMs;
        if (at2 > config.enabled_at)
          changed.push({ path, session: session.toLowerCase(), at: at2 });
      } catch {}
    }
  }
  changed.sort((a, b) => b.at - a.at);
  const store = new Store(paths, null);
  const inbox = new Set(readInbox(paths.inbox).markers.map((marker) => marker.session_id));
  let unmarked = 0;
  for (const transcript of changed.slice(0, HOOKS_BLOCKED_SCAN)) {
    const cwd = transcriptCwd(transcript.path);
    if (!cwd || !admittedCwd(cwd, config.roots, ports.platform, ports.realpath))
      continue;
    if (inbox.has(transcript.session) || existsSync4(store.sessionPath(transcript.session)))
      return false;
    unmarked++;
  }
  return unmarked >= HOOKS_BLOCKED_TRANSCRIPTS;
}
var STATE_RULES = [
  ["runtime_missing", (facts) => facts.notices.includes("runtime_missing")],
  ["data_directory_shared", (facts) => facts.notices.includes("data_directory_shared")],
  ["root_not_supported", (facts) => facts.notices.includes("root_not_supported")],
  ["credential_revoked", (facts) => facts.disabled === "credential_revoked"],
  ["adapter_not_admitted", (facts) => facts.disabled === "adapter_not_admitted"],
  ["incompatible_api", (facts) => facts.file.state === "incompatible_api"],
  ["credential_rejected", (facts) => facts.file.state === "credential_rejected"],
  ["withdrawn", (facts) => facts.withdrawn],
  ["hooks_blocked", (facts) => facts.notices.includes("hooks_blocked")],
  ["offline", (facts) => facts.file.state === "offline"],
  ["configured_awaiting_run", (facts) => facts.first_run === "configured_awaiting_run"]
];
function collectorStatus(paths, given = {}) {
  const ports = { ...defaultPorts(), ...given };
  const config = readJson(paths.config);
  const store = new Store(paths, null);
  const file = store.status(0);
  const sessions = config ? store.sessions() : [];
  const pending = sessions.flatMap((session) => session.sets.flatMap((set) => set.pending));
  const pending_registrations = {};
  for (const set of sessions.flatMap((session) => session.sets))
    if (set.deferred)
      count(pending_registrations, "parent_not_registered");
  const base = {
    confirmed_revisions: file.confirmed_revisions,
    last_confirm_at: file.last_confirm_at,
    pending_revisions: pending.length,
    pending_bytes: pending.reduce((sum, revision) => sum + pendingBytes(revision), 0),
    pending_registrations,
    not_captured: file.not_captured,
    refusals: file.refusals,
    dropped: file.dropped,
    transformation_failures: file.transformation_failures,
    local_io_retry: file.local_io_retry,
    pending_deletions: config ? store.deletions().length : 0
  };
  if (!config)
    return { state: "not_enabled", first_run: null, notices: [], ...base };
  const windows = ports.platform === "win32";
  const notices = [];
  if (!recordedRuntimeAvailable(paths.runtime))
    notices.push("runtime_missing");
  if (windows && !accessIsPrivate(ports.readDirectoryAccess(paths.root)))
    notices.push("data_directory_shared");
  if (windows && config.roots.some((root) => isUncPath(root)))
    notices.push("root_not_supported");
  if (windows && !WINDOWS_VERIFIED)
    notices.push("windows_unverified");
  if (hooksBlocked(paths, config, ports))
    notices.push("hooks_blocked");
  const received = sessions.length > 0 || Object.keys(base.not_captured).length > 0 || Object.keys(base.refusals).length > 0;
  const first_run = base.confirmed_revisions > 0 ? "verified" : received ? "received_incomplete" : "configured_awaiting_run";
  const admission = store.admission(config);
  const facts = {
    notices,
    disabled: admission.disabled?.reason ?? null,
    file,
    withdrawn: admission.withdrawn !== null,
    first_run
  };
  const state = STATE_RULES.find(([, holds]) => holds(facts))?.[0] ?? "capturing";
  return { state, first_run, notices, ...base };
}
function formatStatus(status) {
  const lines = [STATE_TEXT[status.state]];
  if (status.state !== "not_enabled") {
    lines.push(`first run: ${status.first_run}`);
    for (const notice of status.notices)
      lines.push(`notice: ${notice}`);
    lines.push(`confirmed revisions: ${status.confirmed_revisions}`);
    lines.push(`last confirm: ${status.last_confirm_at === null ? "never" : new Date(status.last_confirm_at).toISOString()}`);
    lines.push(`pending revisions: ${status.pending_revisions} (${status.pending_bytes} bytes)`);
    for (const [reason, value] of Object.entries(status.pending_registrations).sort())
      lines.push(`pending registrations (${reason}): ${value}`);
    for (const [reason, value] of Object.entries(status.not_captured).sort())
      lines.push(`sessions not captured (${reason}): ${value}`);
    for (const [reason, value] of Object.entries(status.refusals).sort())
      lines.push(`refused (${reason}): ${value}`);
    for (const [reason, value] of Object.entries(status.dropped).sort())
      lines.push(`dropped (${reason}): ${value}`);
    for (const [reason, value] of Object.entries(status.transformation_failures).sort())
      lines.push(`transformation failed (${reason}): ${value}`);
    lines.push(`local io retries: ${status.local_io_retry}`);
    lines.push(`pending deletions: ${status.pending_deletions}`);
  }
  return `${lines.join(`
`)}
`;
}

var sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
var REQUEST_TIMEOUT_MS = 60000;
var timedFetch = (input, init) => globalThis.fetch(input, {
  ...init,
  signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
});
function ports() {
  return {
    fetch: timedFetch,
    sleep,
    random: Math.random,
    now: Date.now,
    platform: currentPlatform(),
    realpath: nativeRealPath,
    readDirectoryAccess: powershellAccessReader,
    io: nodeLocalIo
  };
}
function enabledLayout() {
  const data = resolveDataDirectory(process.env);
  if (!data)
    return null;
  const paths = layout(data);
  return existsSync5(paths.config) ? paths : null;
}
function option(args, name) {
  const values = [];
  for (let index = 0;index < args.length; index++)
    if (args[index] === name && args[index + 1] !== undefined)
      values.push(args[++index]);
  return values;
}
async function enableCommand(args) {
  const team = option(args, "--team")[0];
  const roots = option(args, "--root");
  if (!team || !roots.length) {
    process.stdout.write(`Usage: enable --team <team id or slug> --root <project directory> [--root …] [--origin <url>]
`);
    return 2;
  }
  const result = await enableCapture({ team, roots, origin: option(args, "--origin")[0] ?? DEFAULT_ORIGIN }, {
    ...ports(),
    env: process.env,
    home: homedir3(),
    execPath: process.execPath,
    nodeVersion: process.version,
    readDirectoryAccess: powershellAccessReader,
    windowsVerified: WINDOWS_VERIFIED,
    confirm: (notice) => askNotice(notice, {
      input: process.stdin,
      write: (text) => process.stdout.write(text)
    }),
    show: (uri, code) => process.stdout.write(`To allow local capture on this device, open ${uri} and confirm the code ${code}.
`)
  });
  if (result.state === "configured") {
    process.stdout.write(`${STATE_TEXT.configured_awaiting_run}
`);
    return 0;
  }
  process.stdout.write(`${ENABLE_REFUSAL_TEXT[result.state]}
`);
  return 1;
}
async function main(argv) {
  const [command, ...args] = argv;
  const bundle = fileURLToPath(import.meta.url);
  if (command === "start" || command === "run") {
    try {
      const paths = enabledLayout();
      if (!paths)
        return 0;
      if (command === "start")
        startDetached(paths, bundle);
      else
        await runCollector(paths, ports());
    } catch {}
    return 0;
  }
  if (command === "enable")
    return enableCommand(args);
  if (command === "status") {
    const data = resolveDataDirectory(process.env);
    const status = data ? collectorStatus(layout(data), {
      projects: claudeProjectsDirectory(process.env, homedir3())
    }) : null;
    if (args.includes("--json"))
      process.stdout.write(`${JSON.stringify(status ?? { state: "not_enabled" })}
`);
    else
      process.stdout.write(status ? formatStatus(status) : `${STATE_TEXT.not_enabled}
`);
    return 0;
  }
  process.stdout.write(`Usage: collector.mjs enable | status
`);
  return 2;
}
process.exitCode = await main(process.argv.slice(2));
