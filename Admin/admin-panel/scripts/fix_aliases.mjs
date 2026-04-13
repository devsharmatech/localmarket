import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.next') {
                walk(filePath, callback);
            }
        } else if (file.endsWith('.js') || file.endsWith('.ts')) {
            callback(filePath);
        }
    });
}

function getRelativeLink(fromFile, toAlias) {
    // toAlias is something like "@/lib/foo"
    const aliasPath = toAlias.replace('@/', '');
    const absoluteTargetPath = path.join(rootDir, aliasPath);
    const absoluteFromDir = path.dirname(fromFile);

    let relativePath = path.relative(absoluteFromDir, absoluteTargetPath);
    if (!relativePath.startsWith('.')) {
        relativePath = './' + relativePath;
    }
    return relativePath;
}

walk(path.join(rootDir, 'app'), (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    const matches = content.match(/@\/[a-zA-Z0-9_\/]+/g);
    if (matches) {
        let newContent = content;
        matches.forEach(alias => {
            const rel = getRelativeLink(filePath, alias);
            newContent = newContent.replace(new RegExp(alias, 'g'), rel);
        });
        if (newContent !== content) {
            console.log(`Fixing ${path.relative(rootDir, filePath)}`);
            fs.writeFileSync(filePath, newContent);
        }
    }
});

walk(path.join(rootDir, 'lib'), (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    const matches = content.match(/@\/[a-zA-Z0-9_\/]+/g);
    if (matches) {
        let newContent = content;
        matches.forEach(alias => {
            const rel = getRelativeLink(filePath, alias);
            newContent = newContent.replace(new RegExp(alias, 'g'), rel);
        });
        if (newContent !== content) {
            console.log(`Fixing ${path.relative(rootDir, filePath)}`);
            fs.writeFileSync(filePath, newContent);
        }
    }
});
