const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['www/script.js'],
  bundle: true,
  outfile: 'www/build/script.js',
  format: 'iife', // wichtig für ältere WebViews
  target: ['es2017'], // breitere Kompatibilität
  minify: true,
  logLevel: 'info',
}).catch(() => process.exit(1));