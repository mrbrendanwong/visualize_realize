const { spawn } = require('child_process');
const fs = require('fs');
const readline = require('readline');
const path = require('path');
const Papa = require('papaparse');

module.exports = {checkCode, processCouplingMetric};

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

function processCouplingMetric(sourceDirectory) {
    let metrics = [];
    let fileNames = [];
    for (const file of walkSync(sourceDirectory)) {
        if (file.toLowerCase().endsWith('.java')) {
            fileNames.push(file);
        }
    }
    fileNames.forEach((currFile) => {
        const currFileClassName = path.parse(currFile).base.split('.')[0];
        metrics[currFileClassName] = {};
        const rl = readline.createInterface({
            input: fs.createReadStream(currFile),
            crlfDelay: Infinity
        });
        rl.on('line', (line) => {
            fileNames.forEach((calledFile) => {
                if (calledFile !== currFile) {
                    const calledFileClassName = path.parse(calledFile).base.split('.')[0];
                    if (line.includes(calledFileClassName)) {
                        const currMetric = metrics[currFileClassName][calledFileClassName];
                        metrics[currFileClassName][calledFileClassName] = currMetric != undefined ? currMetric + 1 : 0;
                    }
                }
            })
        });
        rl.on('close', () => {console.log("done reading file")})
    })
}

/**
 * List all files in a directory recursively in a synchronous fashion
 * FROM luciopaiva at https://gist.github.com/luciopaiva/4ba78a124704007c702d0293e7ff58dd
 * Tweaked to only return the filename and not the path
 *
 * @param {String} dir
 * @returns {IterableIterator<String>}
 */
function *walkSync(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const pathToFile = path.join(dir, file);
        const isDirectory = fs.statSync(pathToFile).isDirectory();
        if (isDirectory) {
            yield *walkSync(pathToFile);
        } else {
            yield pathToFile;
        }
    }
}