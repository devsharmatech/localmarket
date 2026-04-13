const fs = require('fs');
let c = fs.readFileSync('c:/Nextjs/localmarket-main/COMPLETE_MIGRATION.sql', 'utf8');

// All CREATE POLICY patterns to wrap safely.
// Strategy: find every CREATE POLICY line (with or without IF NOT EXISTS)
// and wrap in DROP POLICY IF EXISTS + CREATE POLICY for full idempotency.

// Step 1: Remove "IF NOT EXISTS" from all CREATE POLICY statements (invalid syntax)
c = c.replace(/CREATE POLICY IF NOT EXISTS\s/gi, 'CREATE POLICY ');

// Verify result
const remaining = (c.match(/CREATE POLICY IF NOT EXISTS/gi)||[]).length;
console.log('Remaining CREATE POLICY IF NOT EXISTS:', remaining);

// Step 2: For every bare CREATE POLICY that is NOT already preceded by DROP POLICY IF EXISTS
// within the previous 3 lines, add a DROP POLICY IF EXISTS before it.
const lines = c.split('\n');
const output = [];
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^CREATE POLICY\s+"/.test(line.trim())) {
        // Extract policy name and table
        const nameMatch = line.match(/CREATE POLICY\s+"([^"]+)"/);
        const onMatch = line.match(/ON\s+([\w.]+)/i) || (lines[i+1] || '').match(/ON\s+([\w.]+)/i);
        if (nameMatch && onMatch) {
            const policyName = nameMatch[1];
            const tableName = onMatch[1];
            // Check if the 3 lines before already have DROP POLICY for this policy
            const preceding = lines.slice(Math.max(0,i-3), i).join('\n');
            if (!preceding.includes(`DROP POLICY IF EXISTS "${policyName}"`)) {
                output.push(`DROP POLICY IF EXISTS "${policyName}" ON ${tableName};`);
            }
        }
    }
    output.push(line);
}

c = output.join('\n');
fs.writeFileSync('c:/Nextjs/localmarket-main/COMPLETE_MIGRATION.sql', c);
console.log('Done. File size:', c.length);
console.log('CREATE POLICY count:', (c.match(/^CREATE POLICY/gim)||[]).length);
console.log('DROP POLICY IF EXISTS count:', (c.match(/DROP POLICY IF EXISTS/gi)||[]).length);
