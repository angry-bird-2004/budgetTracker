const { spawn } = require("node:child_process");

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const services = [
  ["backend", ["--prefix", "backend", "run", "dev"]],
  ["web", ["--prefix", "frontend", "run", "dev"]],
  ["mobile", ["--prefix", "mobile", "start"]],
];

let stopping = false;
let children = [];
function shutdown(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (!child.killed) child.kill("SIGINT");
  }
  setTimeout(() => process.exit(exitCode), 1000);
}

children = services.map(([name, args]) => {
  const child = spawn(npm, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  child.on("error", (error) => {
    console.error(`Failed to start ${name}: ${error.message}`);
    shutdown(1);
  });
  child.on("exit", (code, signal) => {
    if (!stopping) {
      console.error(`${name} exited ${signal ? `from ${signal}` : `with code ${code}`}.`);
      shutdown(code || 1);
    }
  });
  return child;
});

process.on("SIGINT", () => shutdown());
process.on("SIGTERM", () => shutdown());
