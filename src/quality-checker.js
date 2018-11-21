const { spawn } = require('child_process');
const fs = require('fs');
const Papa = require('papaparse');

module.exports = {checkCode};

const papaparseConfig = {
    header: true,
    skipEmptyLines: true
};
let problemsFound = [];

/**
 * Uses PMD to check the Java code in the sourceDirectory, finds all the problems from the rule set
 * and outputs it into the JSON file at outputFileLocation for the front-end to read later
 * @param {string} sourceDirectory reads code from here
 * @param {string} outputFileLocation location of the output JSON file
 */
function checkCode(sourceDirectory, outputFileLocation) {
    const pmd = spawn('resources/pmd/bin/run.sh',
        ['pmd', '-d', sourceDirectory, '-R', 'resources/rulesets/quickstart.xml',
            '-f', 'csv', '-failOnViolation', 'false']);

    let csvStream = pmd.stdout.pipe(Papa.parse(Papa.NODE_STREAM_INPUT, papaparseConfig));
    csvStream.on('data', (problem) => {
        problemsFound.push(problem);
    });

    pmd.stderr.on('data', (data) => {
        console.log(`stderr: ${data}`);
    });

    pmd.on('close', (code) => {
        console.log(`pmd child process exited with code ${code}`);
        fs.writeFile(outputFileLocation, JSON.stringify(problemsFound), (error) => {
            error ? console.log(error) : null;
        });
    });
}
