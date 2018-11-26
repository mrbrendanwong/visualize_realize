const { spawn } = require('child_process');
const fs = require('fs');
const readline = require('readline');
const path = require('path');
const Papa = require('papaparse');

const config = require('../config');

const batchSize = 5;
const commentRegex = new RegExp('^\\s*\/\/', 'm');
const papaparseConfig = {
    header: true,
    skipEmptyLines: true
};

/**
 * Takes all commit objects and updates each file at each commit with the results from checking the code
 * with PMD and the processCouplingMetric function
 * A commitObject will then look something like this:
 *  {
 *      commitSha: "commitSha",
 *      login: "user",
 *      files: [
 *          {
 *              fileName: "*.java",
 *              fileSha: "fileSha",
 *              diff: 2,
 *              coupling: {
 *                  "*.java": 3,
 *                  "*.java": 5
 *              }
 *              issues: [
 *                  {
 *                      "package": "packageName",
 *                      "file": "*.java",
 *                      "priority": "3",
 *                      "line": "410",
 *                      "description": "This statement should have braces",
 *                      "ruleSet": "Code Style",
 *                      "rule": "ControlStatementBraces"
 *                  }
 *              ]
 *          }
 *      ]
 *  }
 * @param commitObjects
 * @returns {Promise<void>}
 */
async function analyzeCommits(commitObjects) {
    console.log('data-analyzer.analyzeCommits:: Start analyzing');
    const directories = fs.readdirSync(`${config.tmpDir}${config.commitDir}`).map(fileName => {
        return path.join(`${config.tmpDir}${config.commitDir}`, fileName);
    }).filter(filePath => fs.lstatSync(filePath).isDirectory());

    for (let batch = 0; batch < Math.ceil(directories.length/5); batch++) {
        await analyzeBatch(commitObjects, directories, batch);
    }
    console.log('data-analyzer.analyzeCommits:: Finish analyzing');
}

function analyzeBatch(commitObjects, directories, batch) {
    let promises = [];
    for (let i = 0; i < batchSize; i++) {
        if (!directories[batch*batchSize+i]) {
            break;
        }
        promises.push(new Promise(resolve => {
            processCouplingMetric(directories[batch*batchSize+i]).then(couplingMetric => {
                checkCode(directories[batch*batchSize+i]).then(styleProblems => {
                    const commitIndex = directories[batch*batchSize+i].split('/').pop();
                    commitObjects[commitIndex].files.forEach(fileObj => {
                        // save coupling metric to each file object at a commit
                        const fileCouplingMetric = couplingMetric[fileObj.fileName];
                        fileObj.coupling = fileCouplingMetric ? fileCouplingMetric : {};

                        // save PMD style problems to each file object at a commit
                        fileObj.issues = [];
                        styleProblems.forEach(sp => {
                            if (sp.File.split('/').pop() === fileObj.fileName) {
                                let issue = {
                                    package: sp.Package,
                                    file: sp.File.split('/').pop(),
                                    priority: sp.Priority,
                                    line: sp.Line,
                                    description: sp.Description,
                                    ruleSet: sp['Rule set'],
                                    rule: sp.Rule
                                };
                                fileObj.issues.push(issue);
                            }
                        });
                    });
                    resolve();
                });
            });
        }));
    }
    return Promise.all(promises);
}


/**
 * Uses PMD to check the Java code in the sourceDirectory and finds all the problems from the rule set
 * @param {String} sourceDirectory reads code from here
 * @returns {Promise}
 */
function checkCode(sourceDirectory) {
    return new Promise((resolve, reject) => {
        try {
            let problemsFound = [];
            const pmd = spawn('resources/pmd/bin/run.sh',
                ['pmd', '-d', sourceDirectory, '-R', 'resources/rulesets/quickstart.xml',
                    '-f', 'csv', '-failOnViolation', 'false']);

            let csvStream = pmd.stdout.pipe(Papa.parse(Papa.NODE_STREAM_INPUT, papaparseConfig));
            csvStream.on('data', (problem) => {
                problemsFound.push(problem);
            });

            // pmd.stderr.on('data', (data) => {
            //     console.log(`stderr: ${data}`);
            // });

            pmd.on('close', (code) => {
                // console.log(`pmd child process exited with code ${code}`);
                resolve(problemsFound);
            });
        } catch(e) {
            reject(e);
        }
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
                const currFileName = path.parse(currFile).base;
                metrics[currFileName] = {};
                const rl = readline.createInterface({
                    input: fs.createReadStream(currFile),
                    crlfDelay: Infinity
                });
                rl.on('line', (line) => {
                    if (!commentRegex.test(line)) {
                        fileNames.forEach(calledFile => {
                            if (calledFile !== currFile) {
                                const calledFileName = path.parse(calledFile).base;
                                const calledFileClassName = calledFileName.split('.')[0];
                                const calledFileRegex = new RegExp('(?<!")\\b' + calledFileClassName + '\\b(?!")', 'gm');
                                const regexMatches = line.match(calledFileRegex);
                                if (regexMatches && regexMatches.length > 0) {
                                    const currMetric = metrics[currFileName][calledFileName];
                                    metrics[currFileName][calledFileName] = currMetric !== undefined ? currMetric + regexMatches.length : regexMatches.length;
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

module.exports = {
    analyzeCommits,
};
