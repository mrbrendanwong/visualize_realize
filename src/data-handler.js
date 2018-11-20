// Testing
const dc = require('./data-controller');
const dp = require('./data-processor');

/*
    Fetches content for state of the repo at one commit    
*/
function handleCommitContent(owner, repo) {
    /*
    Processes and retrieves the blobs from git. We need to save these blobs/files
        to be used with pmd/dependency analyzer. 
    */
    var currFileData;
    dc.getAllContent(owner, repo)
        .then(raw => {
            currFileData = dp.processContent(raw);
            return getBlobs(owner, repo, currFileData);
        }).then(blobResult => {
            blobResult.forEach(b => {
                let processedBlob = dp.processBlob(b.raw);
                currFileData[b.fileName].content = processedBlob;
            });
        }).catch(e => {
            console.error("Error parsing data:", e);
        })
}

/*
    Get blob/file data.
    TODO: Then save it to a file to be analyzed
    Alternatively, could use some library to apply the changes to a local file (once saved)
*/
function getBlobs(owner, repo, fileData)  {
    let promises = [];
    for (var file in fileData) {
        // TODO remove
        // Limit API calls for now
        if (file === 'Client.java') {
            let promise = dc.getBlob(owner, repo, file, fileData[file].sha)
            promises.push(promise)
        }
    }
    return Promise.all(promises);
}

module.exports = {
    handleCommitContent,
}