// Build script for production deployment
// Generates static assets with relative paths for proxy compatibility

const result = await Bun.build({
  entrypoints: ['./index.html'],
  outdir: './dist',
  publicPath: './',
  minify: {
    whitespace: true,
    identifiers: true,
    syntax: true,
  },
});

if (!result.success) {
  console.error('Build failed:');
  for (const message of result.logs) {
    console.error(message);
  }
  process.exit(1);
}

console.log('✅ Build completed successfully!');
console.log(`📦 Output: ${result.outputs.length} files generated in ./dist`);
