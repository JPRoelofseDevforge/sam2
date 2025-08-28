const fs = require('fs');
const path = require('path');

console.log('Building server files...');

// Copy server.js
const serverSrc = path.join(__dirname, '..', 'dist', 'src', 'api', 'server.js');
const serverDest = path.join(__dirname, '..', 'dist', 'server.js');

if (fs.existsSync(serverSrc)) {
  fs.copyFileSync(serverSrc, serverDest);
  console.log('✅ Copied server.js');
} else {
  console.error('❌ server.js not found at:', serverSrc);
  process.exit(1);
}

// Create directories
const dbDir = path.join(__dirname, '..', 'dist', 'db');
const typesDir = path.join(__dirname, '..', 'dist', 'types');
const routesDir = path.join(__dirname, '..', 'dist', 'routes');
const servicesDir = path.join(__dirname, '..', 'dist', 'services');
const middlewareDir = path.join(__dirname, '..', 'dist', 'middleware');

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log('✅ Created db directory');
}

if (!fs.existsSync(typesDir)) {
  fs.mkdirSync(typesDir, { recursive: true });
  console.log('✅ Created types directory');
}

if (!fs.existsSync(routesDir)) {
  fs.mkdirSync(routesDir, { recursive: true });
  console.log('✅ Created routes directory');
}

if (!fs.existsSync(servicesDir)) {
  fs.mkdirSync(servicesDir, { recursive: true });
  console.log('✅ Created services directory');
}

if (!fs.existsSync(middlewareDir)) {
  fs.mkdirSync(middlewareDir, { recursive: true });
  console.log('✅ Created middleware directory');
}

// Copy db files
const dbSrc = path.join(__dirname, '..', 'dist', 'src', 'db');
if (fs.existsSync(dbSrc)) {
  copyDirRecursive(dbSrc, dbDir);
  console.log('✅ Copied db files');
}

// Copy types files
const typesSrc = path.join(__dirname, '..', 'dist', 'src', 'types');
if (fs.existsSync(typesSrc)) {
  copyDirRecursive(typesSrc, typesDir);
  console.log('✅ Copied types files');
}

// Copy routes files
const routesSrc = path.join(__dirname, '..', 'dist', 'src', 'api', 'routes');
if (fs.existsSync(routesSrc)) {
  copyDirRecursive(routesSrc, routesDir);
  console.log('✅ Copied routes files');
}

// Copy services files
const servicesSrc = path.join(__dirname, '..', 'dist', 'src', 'services');
if (fs.existsSync(servicesSrc)) {
  copyDirRecursive(servicesSrc, servicesDir);
  console.log('✅ Copied services files');
}

// Copy middleware files
const middlewareSrc = path.join(__dirname, '..', 'dist', 'src', 'middleware');
if (fs.existsSync(middlewareSrc)) {
  copyDirRecursive(middlewareSrc, middlewareDir);
  console.log('✅ Copied middleware files');
}

// Fix import paths in all JS files
fixImportPaths(path.join(__dirname, '..', 'dist'));

console.log('✅ Server build complete!');

function copyDirRecursive(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
      }
      copyDirRecursive(srcPath, destPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function fixImportPaths(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      fixImportPaths(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');

      // Fix relative imports to add .js extensions and correct paths
      content = content.replace(/from '\.\.\/db\/([^']+)'/g, (match, path) => {
        return path.endsWith('.js') ? `from './db/${path}'` : `from './db/${path}.js'`;
      });
      content = content.replace(/from '\.\.\/([^']+)'/g, (match, path) => {
        return path.endsWith('.js') ? match : `from '../${path}.js'`;
      });
      content = content.replace(/from '\.\/([^']+)'/g, (match, path) => {
        return path.endsWith('.js') ? match : `from './${path}.js'`;
      });

      fs.writeFileSync(fullPath, content);
    }
  }
}