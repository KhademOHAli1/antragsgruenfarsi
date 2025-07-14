import { Application, Router, Context } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import { jwtVerify, createRemoteJWKSet } from "https://deno.land/x/jose@v4.15.4/index.ts";
import { load } from "https://deno.land/std@0.208.0/dotenv/mod.ts";

// Load environment variables
const env = await load();

// Configuration
const CONFIG = {
  port: parseInt(env.PORT || Deno.env.get("PORT") || "8000"),
  antragsgruenBaseUrl: env.ANTRAGSGRUEN_BASE_URL || Deno.env.get("ANTRAGSGRUEN_BASE_URL") || "http://localhost:8080",
  rarimoIssuer: env.RARIMO_ISSUER || Deno.env.get("RARIMO_ISSUER") || "https://auth.rarimo.com",
  jwtAudience: env.JWT_AUDIENCE || Deno.env.get("JWT_AUDIENCE") || "antragsgruen-api",
  cacheMaxAge: parseInt(env.CACHE_MAX_AGE || "30"), // 30 seconds default
  logLevel: env.LOG_LEVEL || Deno.env.get("LOG_LEVEL") || "info",
};

// Types
interface JWTPayload {
  sub: string;
  aud: string;
  iss: string;
  exp: number;
  iat: number;
  scope?: string;
  email?: string;
  role?: string;
}

interface ProxyRequestOptions {
  method: string;
  headers: Headers;
  body?: BodyInit;
}

// Logger
const logger = {
  info: (message: string, ...args: unknown[]) => {
    if (["info", "debug"].includes(CONFIG.logLevel)) {
      console.log(`[INFO] ${new Date().toISOString()} ${message}`, ...args);
    }
  },
  warn: (message: string, ...args: unknown[]) => {
    if (["info", "warn", "debug"].includes(CONFIG.logLevel)) {
      console.warn(`[WARN] ${new Date().toISOString()} ${message}`, ...args);
    }
  },
  error: (message: string, ...args: unknown[]) => {
    console.error(`[ERROR] ${new Date().toISOString()} ${message}`, ...args);
  },
  debug: (message: string, ...args: unknown[]) => {
    if (CONFIG.logLevel === "debug") {
      console.log(`[DEBUG] ${new Date().toISOString()} ${message}`, ...args);
    }
  },
};

// JWT verification setup
const JWKS = createRemoteJWKSet(new URL(`${CONFIG.rarimoIssuer}/.well-known/jwks.json`));

// Cache for GET requests
const cache = new Map<string, { data: unknown; timestamp: number; etag?: string }>();

// Middleware: CORS
function corsMiddleware() {
  return oakCors({
    origin: true, // Allow all origins in development, configure properly in production
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  });
}

// Middleware: Request logging
async function loggingMiddleware(ctx: Context, next: () => Promise<unknown>) {
  const start = Date.now();
  const { method, url } = ctx.request;
  
  logger.debug(`${method} ${url.pathname}${url.search}`);
  
  await next();
  
  const ms = Date.now() - start;
  const { status } = ctx.response;
  
  logger.info(`${method} ${url.pathname} ${status} ${ms}ms`);
}

// Middleware: JWT Authentication
async function authMiddleware(ctx: Context, next: () => Promise<unknown>) {
  const authHeader = ctx.request.headers.get("Authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    ctx.response.status = 401;
    ctx.response.body = { error: "Missing or invalid Authorization header" };
    return;
  }

  const token = authHeader.slice(7);
  
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: CONFIG.rarimoIssuer,
      audience: CONFIG.jwtAudience,
    });
    
    // Store user info in context
    ctx.state.user = payload as JWTPayload;
    
    logger.debug(`Authenticated user: ${payload.sub} with scope: ${payload.scope}`);
    
    await next();
  } catch (error) {
    logger.warn(`JWT verification failed: ${error.message}`);
    ctx.response.status = 401;
    ctx.response.body = { error: "Invalid token" };
  }
}

// Middleware: Scope validation
function requireScope(requiredScope: string) {
  return async (ctx: Context, next: () => Promise<unknown>) => {
    const user = ctx.state.user as JWTPayload;
    const userScopes = user.scope?.split(" ") || [];
    
    // Check if user has required scope (supports wildcards)
    const hasScope = userScopes.some(scope => {
      if (scope === requiredScope) return true;
      if (scope.endsWith("*")) {
        return requiredScope.startsWith(scope.slice(0, -1));
      }
      return false;
    });
    
    if (!hasScope) {
      logger.warn(`Access denied: user ${user.sub} lacks scope ${requiredScope}`);
      ctx.response.status = 403;
      ctx.response.body = { error: `Insufficient permissions. Required scope: ${requiredScope}` };
      return;
    }
    
    await next();
  };
}

// Proxy function to Antragsgrün backend
async function proxyToAntragsgruen(ctx: Context, path: string) {
  const url = new URL(path, CONFIG.antragsgruenBaseUrl);
  
  // Copy query parameters
  for (const [key, value] of ctx.request.url.searchParams) {
    url.searchParams.set(key, value);
  }
  
  // Prepare headers (exclude hop-by-hop headers)
  const headers = new Headers();
  for (const [key, value] of ctx.request.headers) {
    if (!["host", "connection", "transfer-encoding", "upgrade", "authorization"].includes(key.toLowerCase())) {
      headers.set(key, value);
    }
  }
  
  // Add user context to headers
  const user = ctx.state.user as JWTPayload;
  if (user) {
    headers.set("X-User-ID", user.sub);
    headers.set("X-User-Email", user.email || "");
    headers.set("X-User-Role", user.role || "user");
  }
  
  const options: ProxyRequestOptions = {
    method: ctx.request.method,
    headers,
  };
  
  // Handle request body for non-GET methods
  if (ctx.request.method !== "GET" && ctx.request.hasBody) {
    options.body = await ctx.request.body({ type: "bytes" }).value;
  }
  
  try {
    logger.debug(`Proxying ${ctx.request.method} ${url.href}`);
    
    const response = await fetch(url.href, options);
    
    // Copy response headers
    for (const [key, value] of response.headers) {
      if (!["connection", "transfer-encoding", "upgrade"].includes(key.toLowerCase())) {
        ctx.response.headers.set(key, value);
      }
    }
    
    ctx.response.status = response.status;
    
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      const data = await response.json();
      
      // Cache GET responses
      if (ctx.request.method === "GET" && response.status === 200) {
        const cacheKey = `${path}?${url.searchParams.toString()}`;
        const etag = response.headers.get("etag");
        cache.set(cacheKey, {
          data,
          timestamp: Date.now(),
          etag,
        });
        
        // Set cache headers
        ctx.response.headers.set("Cache-Control", `public, max-age=${CONFIG.cacheMaxAge}`);
        if (etag) {
          ctx.response.headers.set("ETag", etag);
        }
      }
      
      ctx.response.body = data;
    } else {
      ctx.response.body = await response.arrayBuffer();
    }
    
  } catch (error) {
    logger.error(`Proxy error for ${url.href}: ${error.message}`);
    ctx.response.status = 502;
    ctx.response.body = { error: "Backend service unavailable" };
  }
}

// Route handlers
async function handleCachedGet(ctx: Context, path: string) {
  const cacheKey = `${path}?${ctx.request.url.searchParams.toString()}`;
  const cached = cache.get(cacheKey);
  
  // Check if cache is valid
  if (cached && Date.now() - cached.timestamp < CONFIG.cacheMaxAge * 1000) {
    // Check If-None-Match header
    const ifNoneMatch = ctx.request.headers.get("If-None-Match");
    if (ifNoneMatch && cached.etag && ifNoneMatch === cached.etag) {
      ctx.response.status = 304;
      return;
    }
    
    logger.debug(`Cache hit for ${cacheKey}`);
    ctx.response.status = 200;
    ctx.response.headers.set("Content-Type", "application/json");
    ctx.response.headers.set("Cache-Control", `public, max-age=${CONFIG.cacheMaxAge}`);
    if (cached.etag) {
      ctx.response.headers.set("ETag", cached.etag);
    }
    ctx.response.body = cached.data;
    return;
  }
  
  // Cache miss, proxy to backend
  await proxyToAntragsgruen(ctx, path);
}

// Create router
const router = new Router();

// Health check endpoint
router.get("/health", (ctx) => {
  ctx.response.body = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "0.1.0",
  };
});

// API documentation endpoint
router.get("/api/docs", async (ctx) => {
  try {
    const openApiSpec = await Deno.readTextFile("../docs/openapi.yaml");
    ctx.response.headers.set("Content-Type", "application/x-yaml");
    ctx.response.body = openApiSpec;
  } catch (error) {
    logger.error(`Failed to read OpenAPI spec: ${error.message}`);
    ctx.response.status = 404;
    ctx.response.body = { error: "API documentation not found" };
  }
});

// REST API proxy routes (from OpenAPI spec)
// All API routes require authentication and appropriate scopes

// List consultations
router.get("/rest", authMiddleware, requireScope("motion.read"), async (ctx) => {
  await handleCachedGet(ctx, "/rest");
});

// Get consultation details
router.get("/rest/:consultationPath", authMiddleware, requireScope("motion.read"), async (ctx) => {
  const consultationPath = ctx.params.consultationPath;
  await handleCachedGet(ctx, `/rest/${consultationPath}`);
});

// Get consultation agenda
router.get("/rest/:consultationPath/agenda", authMiddleware, requireScope("motion.read"), async (ctx) => {
  const consultationPath = ctx.params.consultationPath;
  await handleCachedGet(ctx, `/rest/${consultationPath}/agenda`);
});

// Save agenda (POST)
router.post("/rest/:consultationPath/agenda", authMiddleware, requireScope("motion.write"), async (ctx) => {
  const consultationPath = ctx.params.consultationPath;
  await proxyToAntragsgruen(ctx, `/rest/${consultationPath}/agenda`);
});

// Get motion details
router.get("/rest/:consultationPath/motion/:motionSlug", authMiddleware, requireScope("motion.read"), async (ctx) => {
  const { consultationPath, motionSlug } = ctx.params;
  await handleCachedGet(ctx, `/rest/${consultationPath}/motion/${motionSlug}`);
});

// Get amendment details
router.get("/rest/:consultationPath/motion/:motionSlug/amendment/:amendmentId", authMiddleware, requireScope("motion.read"), async (ctx) => {
  const { consultationPath, motionSlug, amendmentId } = ctx.params;
  await handleCachedGet(ctx, `/rest/${consultationPath}/motion/${motionSlug}/amendment/${amendmentId}`);
});

// Create motion
router.post("/rest/:consultationPath/motion", authMiddleware, requireScope("motion.write"), async (ctx) => {
  const consultationPath = ctx.params.consultationPath;
  await proxyToAntragsgruen(ctx, `/rest/${consultationPath}/motion`);
});

// Update motion
router.put("/rest/:consultationPath/motion/:motionSlug", authMiddleware, requireScope("motion.write"), async (ctx) => {
  const { consultationPath, motionSlug } = ctx.params;
  await proxyToAntragsgruen(ctx, `/rest/${consultationPath}/motion/${motionSlug}`);
});

// Create amendment
router.post("/rest/:consultationPath/motion/:motionSlug/amendment", authMiddleware, requireScope("motion.write"), async (ctx) => {
  const { consultationPath, motionSlug } = ctx.params;
  await proxyToAntragsgruen(ctx, `/rest/${consultationPath}/motion/${motionSlug}/amendment`);
});

// Update amendment
router.put("/rest/:consultationPath/motion/:motionSlug/amendment/:amendmentId", authMiddleware, requireScope("motion.write"), async (ctx) => {
  const { consultationPath, motionSlug, amendmentId } = ctx.params;
  await proxyToAntragsgruen(ctx, `/rest/${consultationPath}/motion/${motionSlug}/amendment/${amendmentId}`);
});

// Generic proxy route for any other REST endpoints
router.all("/rest/(.*)", authMiddleware, requireScope("motion.*"), async (ctx) => {
  const path = `/rest/${ctx.params[0]}`;
  if (ctx.request.method === "GET") {
    await handleCachedGet(ctx, path);
  } else {
    await proxyToAntragsgruen(ctx, path);
  }
});

// Cache management endpoints
router.get("/api/cache/stats", authMiddleware, requireScope("admin"), (ctx) => {
  ctx.response.body = {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
});

router.delete("/api/cache", authMiddleware, requireScope("admin"), (ctx) => {
  cache.clear();
  logger.info("Cache cleared");
  ctx.response.body = { message: "Cache cleared" };
});

// Create application
const app = new Application();

// Error handling
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    logger.error(`Unhandled error: ${error.message}`, error.stack);
    ctx.response.status = 500;
    ctx.response.body = { error: "Internal server error" };
  }
});

// Apply middleware
app.use(corsMiddleware());
app.use(loggingMiddleware);
app.use(router.routes());
app.use(router.allowedMethods());

// Start server
logger.info(`Starting API Gateway on port ${CONFIG.port}`);
logger.info(`Proxying to Antragsgrün at ${CONFIG.antragsgruenBaseUrl}`);
logger.info(`JWT issuer: ${CONFIG.rarimoIssuer}`);

await app.listen({ port: CONFIG.port });
