const fs = require('fs');
const config = require('../config');

function processContributors(raw) {
    /*
    Iterate through array. Save all contributor names to a list

    Relevant data:
        raw.data[<index>].login
    */
    let contributorsData = [];

    for (var i = 0; i < raw.data.length; i++) {
        contributorsData.push(raw.data[i].login);
    }

    console.log("Contributor data:");
    console.log(contributorsData);
}

function processContent(raw) {
    /*
    Iterate through the array, and save in object paths (file names) and shas
    eg. {<file name>: {sha: <sha>} }

    Relevant data:
        raw.data.tree[<index>].path
        raw.data.tree[<index>].sha
    */
    let fileData = {};

    for (var i = 0; i < raw.data.tree.length; i++) {
        currObj = raw.data.tree[i];
        if (currObj.type === "blob" && currObj.path.endsWith(".java")) {
            let fileName = currObj.path.split("/").pop();
            let fileSha = currObj.sha;
            let fileMeta = {}

            fileMeta["sha"] = fileSha;
            fileData[fileName] = fileMeta;
        }
    }

    console.log("File data:");
    console.log(fileData);
    return fileData;
}

/*
Returns a list of:
    {
        commitSha: "commitSha",
        login: "user",
        files: [
            {
                fileName: "*.java",
                sha: "fileSha"
                additions: 1,
                deletions: 2,
                total: additions - deletions
            }
        ]
    }
*/
function processCommits(raw) {
    let result = raw.map(r => {
        let c = r.data;
        let commitObj = {
            commitSha: c.sha,
            login: c.author.login,
            files: [],
        };
        c.files.forEach(f => {
            if (f.filename.endsWith(".java")) {
                let additions = f.additions;
                let deletions = f.deletions;
                let fileObj = {
                    fileName: f.filename.split("/").pop(),
                    sha: f.sha,
                    additions: additions,
                    deletions: deletions,
                    total: additions - deletions,
                };
                commitObj.files.push(fileObj);
            }
        });
        return commitObj;
    });
    return result;
}

function processBlob(raw) {
    /*
    Returns a buffer with decoded blob (file contents)

    Relevant data:
        raw.data.content
    */
    let encoded = raw.data.content;
    let result = Buffer.from(encoded, 'base64');

    return result;
}

/*
Create a list of chronologically ordered commit shas
*/
function prepareCommits(commits) {
    /*
    Commits are in retrieved in reverse chronological order
    */
    let shas = commits.map(commit => commit.sha);
    let result = shas.reverse();
    return result;
}

module.exports = {processContributors, processContent, processCommits, processBlob, prepareCommits};