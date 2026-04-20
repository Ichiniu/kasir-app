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
            content = content.replace(/import\s+{\s*(signOut|signIn|useSession)(,\s*(signOut|signIn|useSession))*\s*}\s+from\s+['"]next-auth\/react['"]/g, 'import { signIn, signOut, useSession } from "@/lib/auth-client"');
            
            // Replace Provider (NextAuth SessionProvider is not needed in BetterAuth, or used differently)
            content = content.replace(/import\s+{\s*SessionProvider\s*}\s+from\s+['"]next-auth\/react['"]/g, '');
            content = content.replace(/<SessionProvider>/g, '<>');
            content = content.replace(/<\/SessionProvider>/g, '</>');
            
            // Adjust signOut call in Sidebar and others
            content = content.replace(/signOut\(\{ callbackUrl: "([^"]+)" \}\)/g, 'signOut({ fetchOptions: { onSuccess: () => window.location.href = "$1" } })');

            // Adjust signIn call
            content = content.replace(/signIn\("credentials", \{/g, 'signIn.email({');

            // Adjust useSession return
            content = content.replace(/const { data: session, status } = useSession\(\)/g, 'const { data: session, isPending } = useSession()');

            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content);
                console.log('Updated Client:', fullPath);
            }
        }
    }
}

processDir(path.join(__dirname, 'src', 'app'));
processDir(path.join(__dirname, 'src', 'components'));
processDir(path.join(__dirname, 'src', 'hooks'));
