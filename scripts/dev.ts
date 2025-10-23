const tailwindArgs = [
  "./node_modules/.bin/tailwindcss",
  "-i",
  "./src/styles/globals.css",
  "-o",
  "./src/styles/tailwind.css",
  "--watch",
];

const buildArgs = [
  "./node_modules/.bin/tailwindcss",
  "-i",
  "./src/styles/globals.css",
  "-o",
  "./src/styles/tailwind.css",
];

const build = Bun.spawnSync(buildArgs, {
  stdout: "inherit",
  stderr: "inherit",
});

if (build.exitCode !== 0) {
  process.exit(build.exitCode ?? 1);
}

const tailwind = Bun.spawn(tailwindArgs, {
  stdout: "inherit",
  stderr: "inherit",
});

const server = Bun.spawn(["bun", "--hot", "index.ts"], {
  stdout: "inherit",
  stderr: "inherit",
});

const shutdown = () => {
  tailwind.kill();
  server.kill();
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

await server.exited;

shutdown();
