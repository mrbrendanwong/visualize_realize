const { spawn } = require('child_process');
const fs = require('fs');

module.exports = {checkCode};

function checkCode() {
    let resultStream = fs.createWriteStream('pmd_results.csv');

    const pmd = spawn('resources/pmd/bin/run.sh',
        ['pmd', '-d', '../beta_engine/src', '-R', 'resources/rulesets/quickstart.xml',
            '-f', 'csv', '-failOnViolation', 'false']);

    pmd.stdout.on('data', (data) => {
        resultStream.write(data);
        console.log(`stdout: ${data}`);

    });

    pmd.stderr.on('data', (data) => {
        console.log(`stderr: ${data}`);
    });

    pmd.on('close', (code) => {
        console.log(`pmd child process exited with code ${code}`);
    });
}
