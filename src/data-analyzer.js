const { spawn } = require('child_process');
const fs = require('fs');
const readline = require('readline');
const path = require('path');
const Papa = require('papaparse');
const _ = require('lodash');

const config = require('../config');

const commentRegex = new RegExp('^\\s*\/\/', 'm');
const papaparseConfig = {
    header: true,
    skipEmptyLines: true
};

async function analyzeCommits(commitObjects) {
    console.log('data-analyzer.analyzeCommits:: Start analyzing');
    const directories = fs.readdirSync(`${config.tmpDir}${config.commitDir}`).map(fileName => {
        return path.join(`${config.tmpDir}${config.commitDir}`, fileName);
    }).filter(filePath => fs.lstatSync(filePath).isDirectory());

    for (let batch = 0; batch < Math.ceil(directories.length/5); batch++) {
        await analyseBatch(commitObjects, directories, batch);
    }
    console.log('data-analyzer.analyzeCommits:: Finish analyzing');
}

function analyseBatch(commitObjects, directories, batch) {
    let promises = [];
    for (let i = 0; i < 5; i++) {
        if (!directories[batch*5+i]) {
            break;
        }
        promises.push(new Promise(resolve => {
            processCouplingMetric(directories[batch*5+i]).then(couplingMetric => {
                checkCode(directories[batch*5+i]).then(styleProblems => {
                    const commitIndex = directories[batch*5+i].split('/').pop();
                    commitObjects[commitIndex].files.forEach(fileObj => {
                        const fileClassName = fileObj.fileName.split('.')[0];

                        // save coupling metric to each file object at a commit
                        const fileCouplingMetric = couplingMetric[fileClassName];
                        fileObj.coupling = fileCouplingMetric ? fileCouplingMetric : {};

                        // save PMD style problems to each file object at a commit
                        fileObj.styleBugs = [];
                        styleProblems.forEach(sp => {
                            if (sp.File.split('/').pop().split('.')[0] === fileClassName) {
                                fileObj.styleBugs.push(sp);
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
                const currFileClassName = path.parse(currFile).base.split('.')[0];
                metrics[currFileClassName] = {};
                const rl = readline.createInterface({
                    input: fs.createReadStream(currFile),
                    crlfDelay: Infinity
                });
                rl.on('line', (line) => {
                    if (!commentRegex.test(line)) {
                        fileNames.forEach(calledFile => {
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

module.exports = {
    analyzeCommits,
};
