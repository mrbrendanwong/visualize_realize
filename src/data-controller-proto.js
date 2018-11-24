const nodegit = require("nodegit"),
    rimraf = require('rimraf'),
    path = require("path");

/*
Clone a git repo for local processing
Check if dir already exists; if so, delete
Look into giving dirs a custom name
Handle resolve and rejection
 */
async function getRepo(url) {
    let dirName = url.split("/").pop();
    await nodegit.Clone(url, "./tmpFiles/" + dirName);
    console.log("data-controller-proto:: Cloning repos complete");
}

/*
Retrieve all commit objects from Master for a given repo
Adapted from https://github.com/nodegit/nodegit/blob/master/examples/walk-history.js
 */
function getAllCommits(dirName) {
    console.log("data-controller-proto.getAllCommits:: Retrieving commit SHAs")
    return new Promise ((resolve) => {
        nodegit.Repository.open(path.resolve(__dirname, "../tmpFiles/" + dirName))
            .then(repo => repo.getMasterCommit())
            .then(firstCommit => {
                let history = firstCommit.history(nodegit.Revwalk.SORT.TIME);

                history.on("end", commits => resolve(commits));

                history.start();
            });
    })
}

async function getAllBlobs() {

}

async function getBlob() {

}


module.exports = {getRepo, getAllCommits};