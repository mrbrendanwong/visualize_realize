const fs = require('fs');
const rimraf = require('rimraf'); // Remove all directories

const config = require('../config');
const dc = require('./data-controller');
const dp = require('./data-processor');

function processRequest(owner, repo) {
    return new Promise((resolve, reject) => {
        // Delete all subdirs (commit dirs)
        rimraf(config.tmpDir + '*', function () {
            console.log("Starting to get data from github")
            fetchAndProcessGithubData(owner, repo).then(commits => {
                // TODO add analysis data to commits variable
                // Commits should have data for front-end & files saved to disk
                console.log(commits);
                resolve();
            }).catch(e => {
                reject(e)
            });
        });
    });
}

function fetchAndProcessGithubData(owner, repo) {
    return new Promise((resolve, reject) => {
        let promises = [];
        processMasterCommits(owner, repo).then(commits => {
            console.log("Creating commit directories");
            console.log("Saving java files to commit directories");
            commits.forEach((c, index) => {
                // Possible optimization: do not download/fetch blob if sha hasn't changed.
                // Copy it from prev commit that last changed the file
                let promise = saveCommitContent(owner, repo, c.commitSha, index);
                promises.push(promise);
            });
            Promise.all(promises).then(() => {
                console.log("All files written to disk");
                resolve(commits);
            })
        }).catch(e => {
            reject(e);
        });
    });
}

/*
    Fetches content for state of the repo at one commit    
*/
function saveCommitContent(owner, repo, tree_sha, commitIndex) {
    /*
    Processes and retrieves the blobs from git. We need to save these blobs/files
        to be used with pmd/dependency analyzer. 
    */
    return new Promise((resolve, reject) => {
        let currFileData;
        // Holds promises for writing blobs to disk
        let promises = [];
        // Get all files and their sha
        dc.getAllContent(owner, repo, tree_sha)
            .then(raw => {
                currFileData = dp.processContent(raw);
                return dc.getAllBlobs(owner, repo, currFileData);
            }).then(blobResult => {
                blobResult.forEach(b => {
                    let processedBlob = dp.processBlob(b.raw)
                    let promise = saveBlobToDisk(commitIndex, b.fileName, processedBlob);
                    promises.push(promise);
                });
                Promise.all(promises).then(() => {
                    console.log(`Done saving files for commit #${commitIndex}`);
                    resolve();
                })
            }).catch(e => {
                console.error("Error processing blobs:", e);
                reject(e);
            });
    });
}

function createCommitDir(commitIndex) {
    return new Promise((resolve, reject) => {
        let path = `${config.tmpDir}${commitIndex}`;
        fs.mkdir(path, function (err) {
            if (err && err.code !== "EEXIST") {
                console.error(`Failed to create commit #${commitIndex} directory`, err);
                reject(err);
            } else {
                resolve();
            }
        });
    });
}
/*
Saving file to disk under /tmpDir/commit-index/fileName
*/
function saveBlobToDisk(commitIndex, fileName, content) {
    return new Promise((resolve, reject) => {
        createCommitDir(commitIndex).then(() => {
            let path = `${config.tmpDir}${commitIndex}/${fileName}`;
            fs.writeFile(path, content, function(err) {
                if (err) {
                    console.error(`Error writing file: ${path}`, err);
                    reject();
                } else {
                    resolve();
                }
            });
        });
    });
}

/*
    Create chronological commit objects from the master
*/
function processMasterCommits(owner, repo) {
    return new Promise((resolve, reject) => {
        dc.getBranchCommits(owner, repo, "master")
            .then(masterCommits => {
                let commitShas = dp.prepareCommits(masterCommits);
                return dc.getAllSingleCommits(owner, repo, commitShas);
            }).then(rawCommits => {
                let processedCommits = dp.processCommits(rawCommits);
                console.log("Finished processing commits")
                resolve(processedCommits);
            }).catch(e => {
                console.error("Error processing commits:", e);
                reject(e);
            });
    });
}

module.exports = {
    processRequest, fetchAndProcessGithubData, saveCommitContent, processMasterCommits,
}