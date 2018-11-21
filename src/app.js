const http = require('http');
const fs = require('fs');

const config = require('../config');
const handler = require('./data-handler');


const hostname = '127.0.0.1';
const port = 3000;


const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Hello World\n');
});

// print process.argv
process.argv.forEach((val, index) => {
    console.log(index + ': ' + val);
});

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});

function createTmpDir() {
    let dir = config.tmpDir
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }
}

createTmpDir();

// Testing
// const dc = require('./data-controller');
// const dp = require('./data-processor');

var owner = "mrbrendanwong";
var repo = "beta_engine";
//handler.saveCommitContent(owner, repo);
// handler.fetchAndProcessGithubData(owner, repo);
handler.processRequest(owner, repo).then(() => {
    console.log("(✿╹◡╹) VERSACE");
}).catch(e => {
    console.error("Not versace", e);
});

//dc.getContent(owner, repo, "");
// dc.getAllContent(owner, repo, "104a670906b9c72a2e6720ef7f6d7f0679bfcb9a").then(raw => dp.processContent(raw));
//dc.getContributors(owner, repo).then(raw => dp.processContributors(raw));
//dc.getBranches(owner, repo);
// dc.getBranchCommits(owner, repo, "");
//dc.getCommitComments(owner, repo, "85fcc360b59c2177b497577445ed3c882ce7a327");
//dc.getCommit(owner, repo, "85fcc360b59c2177b497577445ed3c882ce7a327");
//dc.getBlob(owner, repo, "ed32d72ad00cbb23e35daac1c0896ef5f17dbe40");