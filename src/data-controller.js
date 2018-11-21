const octokit = require('@octokit/rest')({debug: true});

// Too many API calls, so got a personal access token from git
// May consider a downloading different library like nodegit instead of making
// a lot of requests to github per commit for the state of the files
const apiKey = require('../api_key.json').key;

octokit.authenticate({
    type: 'oauth',
    token: apiKey
});

// Get the contributors of a repository
async function getContributors(owner, repo) {
    let result;
    try {
        result = await octokit.repos.getContributors({owner: owner, repo: repo, anon: "true"});
        console.log(result);

        return result;
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

        return result;
    } catch (e) {
        console.error("HttpError", e);
    }
}

// Get all contents of a GitHub repository
async function getAllContent(owner, repo, tree_sha) {
    let result;
    try {
        result = await octokit.gitdata.getTree({owner: owner, repo: repo, tree_sha: tree_sha, recursive: 1});
        //console.log(result);
        //console.log(result.data)

        return result;
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
        console.log("Fetching branch commits")
        // result = await octokit.repos.getCommits({owner: owner, repo: repo, sha: branch});
        // Get all commits
        result = await paginate(() =>
            octokit.repos.getCommits({owner: owner, repo: repo, sha: branch}));
        // TODO remove when we don't want to make as many calls
        // Testing to only retrieve 3 latest commits
        return [result[0], result[1], result[2]];
        // return result;
    } catch (e) {
        console.error("HttpError", e);
    }
}

// Get a single commit
async function getCommit(owner, repo, sha) {
    return octokit.repos.getCommit({owner: owner, repo: repo, sha: sha});
}

// Get all single commits asynchronously
function getAllSingleCommits(owner, repo, commitShas) {
    console.log("Fetching each commit from Github")
    let promises = [];
    commitShas.forEach(c => {
        let promise = getCommit(owner, repo, c);
        promises.push(promise);
    });
    return Promise.all(promises);
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

// Get the blob of a file. Need to process decode blob from Base64
function getBlob(owner, repo, fileName, file_sha) {
    return new Promise((resolve, reject) => {
        octokit.gitdata.getBlob({owner, repo, file_sha}).then(result => {
            resolve({
                fileName: fileName,
                raw: result,
            });
        });
   });
}

/*
    Get blob/file data.
    fileData: result of dp.processContent
*/
function getAllBlobs(owner, repo, fileData)  {
    let promises = [];
    for (var file in fileData) {
        // TODO remove
        // Limit API calls for now
        if (file === 'Client.java' || file === 'Choice.java') {
            let promise = getBlob(owner, repo, file, fileData[file].sha)
            promises.push(promise)
        }
    }
    return Promise.all(promises);
}

/*
Copied from v15.17.0 octokit README
Listing out resources are returned 30 at a time by default.
This function fetches all the resources
*/
async function paginate (method) {
    let response = await method({ per_page: 100 });
    let { data } = response;
    while (octokit.hasNextPage(response)) {
      response = await octokit.getNextPage(response);
      data = data.concat(response.data);
    }
    return data;
  }

module.exports = {getContributors, getContent, getBranches, getBranchCommits,
    getCommit, getAllSingleCommits, getCommitComments, getBlob, getAllBlobs, getAllContent};