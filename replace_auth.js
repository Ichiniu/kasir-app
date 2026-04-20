const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;

            // Replace imports
            content = content.replace(/import\s+{\s*getServerSession\s*}\s+from\s+['"]next-auth['"]/g, 'import { headers } from "next/headers"');
            content = content.replace(/import\s+{\s*authOptions\s*}\s+from\s+['"]@\/lib\/auth['"]/g, 'import { auth } from "@/lib/auth"');

            // Replace usages
            content = content.replace(/await\s+getServerSession\(\s*authOptions\s*\)/g, 'await auth.api.getSession({ headers: await headers() })');

            if (content !== originalContent) {
                // Remove duplicate import of headers if it already exists
                const headersMatch = content.match(/import { headers } from "next\/headers"/g);
                if (headersMatch && headersMatch.length > 1) {
                   content = content.replace(/import { headers } from "next\/headers"\r?\n/, '');
                }

                fs.writeFileSync(fullPath, content);
                console.log('Updated:', fullPath);
            }
        }
    }
}

processDir(path.join(__dirname, 'src', 'app', '(dashboard)'));
processDir(path.join(__dirname, 'src', 'components'));
