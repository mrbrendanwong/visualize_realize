const fs = require('fs');
const rimraf = require('rimraf'); // Remove all directories

const config = require('../config');
const dc = require('./data-controller-proto');
const dp = require('./data-processor-proto');

// Enter function
function processRequest(url) {
    return new Promise((resolve, reject) => {
        let commitObjects = [];
        // Delete all commit subdirs
        rimraf(config.tmpDir + config.commitDir + '*', function () {
            let dirName = url.split("/").pop();
            cloneRepo(url, dirName).then(() => {
                return dc.getAllCommits(dirName);
            }).then(commits => {
                return dp.processCommits(commits);
            }).then(processedResults => {
                    console.log("data-handler-proto.processRequest:: Finished processing commits");
                    console.log("data-handler-proto.processRequest:: Writing all blobs to disk");
                    let promises = [];
                    commitObjects = processedResults;
                    commitObjects.forEach((commitObj, commitIndex) => {
                        let promise = saveBlobsAtCommitToDisk(commitObj, commitIndex, dirName)
                        promises.push(promise);
                    })
                    return Promise.all(promises);
            }).then(() => {
                removeUnmodifiedFileObjs(commitObjects);
                // TODO add analysis data to commits variable                
                console.log("data-handler-proto.processRequest:: All commit blobs written to disk");
                resolve(commitObjects);
                // TODO commitObjects to json file or something
            }).catch(e => {
                reject(e)
            });
        });
    });
}

// Clone repo if dir doesn't exist
function cloneRepo(url, dirName) {
    return new Promise((resolve, reject) => {
        if (fs.existsSync(config.tmpDir + config.repoDir + dirName)) {
            // Assume repo cloned if dir exists
            // WARNING: do not shut server when cloning.
            //     If you do, remove the repo dir for whichever repo interrupted
            resolve();
        } else {
            dc.getRepo(url).then(() => {
                resolve();
            })
        }
    });
}

/*
Save the blobs for one commit object
*/
function saveBlobsAtCommitToDisk(commitObj, commitIndex, repoName) {
    return new Promise((resolve, reject) => {
        createCommitDir(commitIndex).then(() => {
            return dc.getBlobs(commitObj.files, repoName);
        }).then(blobs => {
            blobs.forEach((blob, blobIndex) => {
                let decoded = Buffer.from(blob.content(), 'base64');
                // blobIndex === commitObj.files[i]
                let path = `${config.tmpDir}${config.commitDir}${commitIndex}/${commitObj.files[blobIndex].fileName}`;
                fs.writeFile(path, decoded, function(err) {
                    if (err) {
                        console.error(`Error writing file: ${path}`, err);
                        reject();
                    } else {
                        resolve();
                    }
                });
            });
            resolve();
        })
    });
}

function createCommitDir(commitIndex) {
    return new Promise((resolve, reject) => {
        let path = `${config.tmpDir}${config.commitDir}${commitIndex}`;
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

function removeUnmodifiedFileObjs(commits) {
    commits.forEach(commit => {
        commit.files = commit.files.filter(f => f.diff !== 0);
    });
}

module.exports = {
    processRequest,
}