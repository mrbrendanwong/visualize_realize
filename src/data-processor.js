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

function processBranches(raw) {
    /*
    Currently unsure of purpose
    */
}

function processCommits(raw) {
    /*
    Assuming we're only looking at master commits
    Use sha retrieved from "raw" to retrieve a single commit with data-controller.getCommit in to "currCommit"
    Go through currCommit data. Store changes to file under {<file name>: {..., commits: [{<sha>: {...}}]}}
    Commits may require sorting based on data

    Relevant data:
        raw.data[<index>].sha

        currCommit.data.committer.login
        currCommit.files[<index>].sha
        currCommit.files[<index>].filename
        currCommit.files[<index>].additions
        currCommit.files[<index>].deletions
    */
}

function processCommitComments() {
    /*
    Currently unsure of purpose
    */
}

function processBlob(raw) {
    /*
    Returns a buffer with decoded blob (file contents) to be used with quality checker later
    */
    let encoded = raw.data.content;
    let result = Buffer.from(encoded, 'base64');
    return result;
}

module.exports = {processContributors, processContent, processBranches, processCommits,
    processCommitComments, processBlob};