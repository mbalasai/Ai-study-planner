const { spawnSync } = require('child_process');
const fs = require('fs');

const sql = fs.readFileSync('update_trigger.sql', 'utf8');

// Use npx.cmd on windows, shell: false
const result = spawnSync('npx.cmd', ['@insforge/cli', 'db', 'query', sql], { stdio: 'inherit', shell: false });

if (result.error) {
    console.error('Error:', result.error);
} else {
    console.log('Result code:', result.status);
}
