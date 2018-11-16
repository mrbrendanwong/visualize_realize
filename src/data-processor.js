function processContributers(raw) {
    /*
    Iterate through array. Save all contributor names to a list

    Relevant data:
        raw.data[<index>].login
    */
}

function processContent(raw) {
    /*
    Iterate through the array, and save in object paths (file names) and shas
    eg. {<file name>: {sha: <sha>} }

    Relevant data:
        raw.data.tree[<index>].path
        raw.data.tree[<index>].sha
    */
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

function processBlob() {
    /*
    Currently unsure of purpose
    */
}