const octokit = require('@octokit/rest')({debug: true});

module.exports = {getContributors, getContent, getBranches, getBranchCommits,
    getCommit, getCommitComments, getBlob, getAllContent};

// Get the contributors of a repository
async function getContributors(owner, repo) {
    let result;
    try {
        result = await octokit.repos.getContributors({owner: owner, repo: repo, anon: "true"});
        console.log(result);
    } catch (e) {
        console.error("HttpError", e);
    }
}

// Get the contents of a GitHub repository. To get root path, just supply empty string
async function getContent(owner, repo, path) {
    let result;
    try {
        result = await octokit.repos.getContent({owner: owner, repo: repo, path: path});
        console.log(result);
    } catch (e) {
        console.error("HttpError", e);
    }
}

// Get all contents of a GitHub repository
async function getAllContent(owner, repo) {
    let result;
    try {
        result = await octokit.gitdata.getTree({owner: owner, repo: repo, tree_sha: "104a670906b9c72a2e6720ef7f6d7f0679bfcb9a", recursive: 1});
        console.log(result);
        //console.log(result.data)
    } catch (e) {
        console.error("HttpError", e);
    }
}

// Get the branches of a repo
async function getBranches(owner, repo) {
    let result;
    try {
        result = await octokit.repos.getBranches({owner: owner, repo: repo});
        console.log(result);
    } catch (e) {
        console.error("HttpError", e);
    }
}

// Get the commits of a branch. If branch param is empty, will default to master
async function getBranchCommits(owner, repo, branch) {
    if (branch === "") branch = "master";
    let result;
    try {
        result = await octokit.repos.getCommits({owner: owner, repo: repo, sha: branch});
        console.log(result);
    } catch (e) {
        console.error("HttpError", e);
    }
}

// Get a single commit
async function getCommit(owner, repo, commit_sha) {
    let result;
    try {
        result = await octokit.repos.getCommit({owner: owner, repo: repo, sha: commit_sha});
        console.log(result);
    } catch (e) {
        console.error("HttpError", e);
    }
}

// Get the commit comments of a commit
async function getCommitComments(owner, repo, commit_sha) {
    let result;
    try {
        result = await octokit.repos.getCommitComments({owner: owner, repo: repo, ref: commit_sha});
        console.log(result);
    } catch (e) {
        console.error("HttpError", e);
    }
}

// Get a the blob of a file. Need to process decode blob from Base64
async function getBlob(owner, repo, file_sha) {
    let result;
    try {
        result = await octokit.gitdata.getBlob({owner, repo, file_sha});
        console.log(result);
    } catch (e) {
        console.error("HttpError", e);
    }
}