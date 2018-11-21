// Testing
const dc = require('./data-controller');
const dp = require('./data-processor');

function fetchAndProcessGithubData(owner, repo) {
    handleMasterCommits(owner, repo).then(commits => {
        commits.forEach((c, index) => {
            saveCommitContent(owner, repo, c.commitSha, index);
        })
    }).catch(e => {
        // console.error(e);
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
    let currFileData;
    let promises = [];
    dc.getAllContent(owner, repo, tree_sha)
        .then(raw => {
            currFileData = dp.processContent(raw);
            return dc.getAllBlobs(owner, repo, currFileData);
        }).then(blobResult => {
            blobResult.forEach(b => {
                let processedBlob = dp.processBlob(b.raw)
                currFileData[b.fileName].content = processedBlob;
            });
        }).catch(e => {
            console.error("Error processing blobs:", e);
            reject(e);
        });
}

/*
    Create chronological commit objects from the master
*/
function handleMasterCommits(owner, repo) {
    return new Promise((resolve, reject) => {
        dc.getBranchCommits(owner, repo, "master")
            .then(masterCommits => {
                let commitShas = dp.prepareCommits(masterCommits);
                return dc.getAllSingleCommits(owner, repo, commitShas);
            }).then(rawCommits => {
                let processedCommits = dp.processCommits(rawCommits);
                resolve(processedCommits);
            }).catch(e => {
                console.error("Error processing commits:", e);
                reject(e);
            });
    });
}

module.exports = {
    fetchAndProcessGithubData, saveCommitContent, handleMasterCommits,
}