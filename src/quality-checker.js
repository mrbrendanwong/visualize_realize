const { spawn } = require('child_process');

module.exports = {checkCode};

function checkCode() {
    const pmd = spawn('resources/pmd/bin/run.sh',
        ['pmd', '-d', 'resources/TestFile.java', '-R', 'resources/rulesets/quickstart.xml',
            '-f', 'csv', '-failOnViolation', 'false']);

    pmd.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });

    pmd.stderr.on('data', (data) => {
        console.log(`stderr: ${data}`);
    });

    pmd.on('close', (code) => {
        console.log(`pmd child process exited with code ${code}`);
    });
}
