const nodegit = require("nodegit"),
    path = require("path"),
    config = require('../config')
    ;

/*
Clone a git repo for local processing
Check if dir already exists; if so, delete
Look into giving dirs a custom name
Handle resolve and rejection
 */
function getRepo(url) {
    console.log("data-controller-proto.getRepo:: Cloning repo:", url, ".\nPlease wait...");
    let dirName = url.split("/").pop();
    return new Promise(resolve => {
        nodegit.Clone(url, config.tmpDir + config.repoDir + dirName).then(() => {
            console.log("data-controller-proto:: Cloning repos complete");
            resolve();
        })
    })
}

/*
Retrieve all commit objects from Master for a given repo
Adapted from https://github.com/nodegit/nodegit/blob/master/examples/walk-history.js


 */
function getAllCommits(dirName) {
    console.log("data-controller-proto.getAllCommits:: Retrieving commit SHAs")
    return new Promise ((resolve) => {
        nodegit.Repository.open(path.resolve(config.tmpDir + config.repoDir + dirName))
            .then(repo => repo.getMasterCommit())
            .then(firstCommit => {
                let history = firstCommit.history(nodegit.Revwalk.SORT.TIME, nodegit.Revwalk.SORT.REVERSE);
                history.on("end", commits => resolve(commits));
                history.start();
            });
    });
}

/*
Get all the blobs for current commit
*/
function getBlobs(files, repoName) {
    return new Promise(resolve => {
        let promises = [];
        nodegit.Repository.open(path.resolve(config.tmpDir + config.repoDir + repoName))
            .then(repo => {
                files.forEach(f => {
                    if (f.fileSha !== undefined) {
                        let promise = repo.getBlob(f.fileSha);
                        promises.push(promise);
                    }
                });
                Promise.all(promises).then(result => {
                    resolve(result);
                });
            })
    });
}

module.exports = {getRepo, getAllCommits, getBlobs};