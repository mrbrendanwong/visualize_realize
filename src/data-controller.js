const octokit = require('@octokit/rest')({debug: true});

module.exports = {getContributors, getContent, getBranches, getBranchCommits, getCommit, getCommitComments, getBlob};

// Get the contributors of a repository
async function getContributors(owner, repo) {
    const result = await octokit.repos.getContributors({owner: owner, repo: repo, anon: "true"});
    console.log(result);
}

// Get the contents of a GitHub repository. To get root path, just supply empty string
// To get all files; call root, scan for all dirs, recursively call getContent
async function getContent(owner, repo, path) {
    const result = await octokit.repos.getContent({owner: owner, repo: repo, path: path});
    console.log(result);
}

// Get the branches of a repo
async function getBranches(owner, repo) {
    const result = await octokit.repos.getBranches({owner: owner, repo: repo});
    console.log(result);
}

// Get the commits of a branch. If branch param is empty, will default to master
async function getBranchCommits(owner, repo, branch) {
    if (branch === "") branch = "master";
    const result = await octokit.repos.getCommits({owner: owner, repo: repo, sha: branch});
    console.log(result);
}

// Get a single commit
async function getCommit(owner, repo, commit_sha) {
    const result = await octokit.repos.getCommit({owner: owner, repo: repo, sha: commit_sha});
    console.log(result);
}

// Get the commit comments of a commit
async function getCommitComments(owner, repo, commit_sha) {
    const result = await octokit.repos.getCommitComments({owner: owner, repo: repo, ref: commit_sha});
    console.log(result);
}

// Get a the blob of a file. Need to process decode blob from Base64
async function getBlob(owner, repo, file_sha) {
    const result = await octokit.gitdata.getBlob({owner, repo, file_sha});
    console.log(result);
}

