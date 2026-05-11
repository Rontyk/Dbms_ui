// proxy.js — run with: node proxy.js
// Forwards all requests from localhost:8080 to your ORDS instance.
// Your React app talks to http://localhost:8080/api/... instead of oracleapex.com.
// Same-origin from browser's perspective → no CORS, no preflight, no problem.

const http = require("http");
const https = require("https");

const TARGET = "https://oracleapex.com/ords/wksp_ecipij";
const PORT = 8080;

const server = http.createServer((req, res) => {
  // Always send CORS headers back to React (allows any origin, any method, any header)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-App-User, Authorization");

  // Handle preflight ourselves — never even hit Oracle
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Build the upstream URL
  const upstreamUrl = TARGET + req.url;
  const u = new URL(upstreamUrl);

  // Forward the request to Oracle
  const options = {
    hostname: u.hostname,
    port: 443,
    path: u.pathname + u.search,
    method: req.method,
    headers: {
      ...req.headers,
      host: u.hostname,        // rewrite Host header for Oracle
    },
  };
  delete options.headers["origin"];   // strip browser Origin so Oracle doesn't reject
  delete options.headers["referer"];

  const upstream = https.request(options, (upRes) => {
    // Copy upstream status and headers back to client (but keep OUR CORS headers)
    const headers = { ...upRes.headers };
    delete headers["access-control-allow-origin"];
    delete headers["access-control-allow-methods"];
    delete headers["access-control-allow-headers"];

    res.writeHead(upRes.statusCode, headers);
    upRes.pipe(res);
  });

  upstream.on("error", (err) => {
    console.error("Upstream error:", err.message);
    res.writeHead(502);
    res.end(JSON.stringify({ error: "Proxy upstream error", detail: err.message }));
  });

  // Pipe the request body (POST/PUT) to Oracle
  req.pipe(upstream);
});

server.listen(PORT, () => {
  console.log(`Proxy listening on http://localhost:${PORT}`);
  console.log(`Forwarding to ${TARGET}`);
});
