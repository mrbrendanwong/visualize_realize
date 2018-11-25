const { spawn } = require('child_process');
const fs = require('fs');
const readline = require('readline');
const path = require('path');
const Papa = require('papaparse');

module.exports = {checkCode, processCouplingMetric};

const commentRegex = new RegExp('^\\s*\/\/', 'm');
const papaparseConfig = {
    header: true,
    skipEmptyLines: true
};

/**
 * Uses PMD to check the Java code in the sourceDirectory, finds all the problems from the rule set
 * and outputs it into the JSON file at outputFileLocation for the front-end to read later,
 * returns a promise to indicate when it's done or what errors there were
 * @param {String} sourceDirectory reads code from here
 * @param {String} outputFileLocation location of the output JSON file
 * @returns {Promise}
 */
function checkCode(sourceDirectory, outputFileLocation) {
    return new Promise((resolve, reject) => {
        let problemsFound = [];
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
                if (error) {
                    reject(error);
                }
            });
            resolve();
        });
    })
}

/**
 * Gets the number of times a class is mentioned in another class for all Java files in sourceDirectory
 * @param {String} sourceDirectory reads code from here
 * @return {Promise}
 */
async function processCouplingMetric(sourceDirectory) {
    try {
        if (!sourceDirectory) {
            console.log('quality-checker.processCouplingMetric:: sourceDirectory was undefined');
            return false;
        }
        let promises = [];
        let metrics = {};
        let fileNames = [];
        for (const file of walkSync(sourceDirectory)) {
            if (file.toLowerCase().endsWith('.java')) {
                fileNames.push(file);
            }
        }
        fileNames.forEach((currFile) => {
            let filePromise = new Promise((resolve) => {
                const currFileClassName = path.parse(currFile).base.split('.')[0];
                metrics[currFileClassName] = {};
                const rl = readline.createInterface({
                    input: fs.createReadStream(currFile),
                    crlfDelay: Infinity
                });
                rl.on('line', (line) => {
                    if (!commentRegex.test(line)) {
                        fileNames.forEach((calledFile) => {
                            if (calledFile !== currFile) {
                                const calledFileClassName = path.parse(calledFile).base.split('.')[0];
                                const calledFileRegex = new RegExp('(?<!")\\b' + calledFileClassName + '\\b(?!")', 'gm');
                                const regexMatches = line.match(calledFileRegex);
                                if (regexMatches && regexMatches.length > 0) {
                                    const currMetric = metrics[currFileClassName][calledFileClassName];
                                    metrics[currFileClassName][calledFileClassName] = currMetric !== undefined ? currMetric + regexMatches.length : regexMatches.length;
                                }
                            }
                        })
                    }
                });
                rl.on('close', () => {
                    // console.log(`Done reading file ${currFile}`);
                    resolve();
                })
            });
            promises.push(filePromise);
        });
        await Promise.all(promises);
        return metrics;
    }
    catch (e) {
        console.log(e);
        return false;
    }
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