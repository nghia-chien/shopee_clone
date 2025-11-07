import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const backendDir = path.join(__dirname, "backend/src");
const prismaDir = path.join(__dirname, "backend/prisma");
const frontendDir = path.join(__dirname, "src");

// ================= Helper Functions =================
function readDirRecursive(dir) {
  const files = [];
  for (const file of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      files.push(...readDirRecursive(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

function relativeFiles(files, root) {
  return files.map(f => path.relative(root, f));
}

// Extract exported functions
function extractExports(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const exportFuncs = [];
  const exportRegex = /export\s+const\s+(\w+)\s*=/g;
  let match;
  while ((match = exportRegex.exec(content)) !== null) {
    exportFuncs.push(match[1]);
  }
  return exportFuncs;
}

// Extract API endpoints from router files
function extractRoutes(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const routeRegex = /\.(get|post|put|delete|patch)\(\s*['"`]([^'"`]+)['"`]/g;
  const routes = [];
  let match;
  while ((match = routeRegex.exec(content)) !== null) {
    routes.push(`${match[1].toUpperCase()} ${match[2]}`);
  }
  return routes;
}

// Extract Prisma models
function extractPrismaModels(schemaFile) {
  const report = [];
  if (!fs.existsSync(schemaFile)) return report;
  const schemaContent = fs.readFileSync(schemaFile, "utf-8");
  const modelRegex = /model\s+(\w+)\s+{([\s\S]*?)}/g;
  let match;
  while ((match = modelRegex.exec(schemaContent)) !== null) {
    const modelName = match[1];
    const fields = match[2].trim().split("\n").map(l => l.trim());
    report.push({ modelName, fields });
  }
  return report;
}

// ================= Backend Report =================
const backendFiles = readDirRecursive(backendDir);
const backendRel = relativeFiles(backendFiles, backendDir);

const backendReport = backendRel.map(f => {
  const fullPath = path.join(backendDir, f);
  const exports = extractExports(fullPath);
  const routes = f.includes("routes") ? extractRoutes(fullPath) : [];
  let type = "File";
  if (f.includes("controller")) type = "Controller";
  else if (f.includes("service")) type = "Service";
  else if (f.includes("routes")) type = "Router";

  let s = `- **${f}** [${type}]`;
  if (exports.length) s += ` → Exports: ${exports.join(", ")}`;
  if (routes.length) s += ` → Routes: ${routes.join(", ")}`;
  return s;
}).join("\n");

// ================= Prisma Report =================
const schemaFile = path.join(prismaDir, "schema.prisma");
const prismaModels = extractPrismaModels(schemaFile);
const prismaReport = prismaModels.map(m => {
  const fieldsStr = m.fields.map(f => `  - ${f}`).join("\n");
  return `### Model: ${m.modelName}\n${fieldsStr}\n`;
}).join("\n");

// ================= Frontend Report =================
const frontendFiles = readDirRecursive(frontendDir);
const frontendRel = relativeFiles(frontendFiles, frontendDir);

// React Router paths (simple detection)
function extractReactRoutes(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const routeRegex = /path\s*=\s*["']([^"']+)["']/g;
  const routes = [];
  let match;
  while ((match = routeRegex.exec(content)) !== null) {
    routes.push(match[1]);
  }
  return routes;
}

const frontendReport = frontendRel.map(f => {
  const fullPath = path.join(frontendDir, f);
  const routes = f.endsWith(".tsx") ? extractReactRoutes(fullPath) : [];
  return `- ${f}${routes.length ? ` → Routes: ${routes.join(", ")}` : ""}`;
}).join("\n");

// ================= GENERATE MARKDOWN =================
const report = `
# 📝 Shopee Clone Full Architecture Report

## 🔹 Backend Structure
\`\`\`
${backendReport}
\`\`\`

## 🔹 Prisma Models
${prismaReport}

## 🔹 Frontend Structure
\`\`\`
${frontendReport}
\`\`\`

## 🔹 Authentication & CRUD Flow

### Seller Auth Flow
1. **Register** → POST /api/seller/auth/register
2. **Login** → POST /api/seller/auth/login
3. **Get current seller** → GET /api/seller/auth/me
4. **Middleware** → requireAuthSeller

### CRUD Product Flow
- **Create Product** → POST /api/seller/product
- **Read Products** → GET /api/seller/product
- **Update Product** → PUT /api/seller/product/:id
- **Delete Product** → DELETE /api/seller/product/:id

### File Upload Flow
- **Frontend** → input file → call /api/seller/upload
- **Backend** → multer middleware → Cloudinary upload → return URL
`;

fs.writeFileSync("FullProjectReport.md", report);
console.log("FullProjectReport.md generated ✅");
