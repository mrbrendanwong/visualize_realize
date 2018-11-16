const http = require('http');

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

// Testing
const dc = require('./data-controller');
var owner = "mrbrendanwong";
var repo = "beta_engine";

//dc.getContent(owner, repo, "");
//dc.getAllContent(owner, repo);
//dc.getContributors(owner, repo);
//dc.getBranches(owner, repo);
//dc.getBranchCommits(owner, repo, "");
//dc.getCommitComments(owner, repo, "85fcc360b59c2177b497577445ed3c882ce7a327");
dc.getCommit(owner, repo, "85fcc360b59c2177b497577445ed3c882ce7a327");
//dc.getBlob(owner, repo, "ed32d72ad00cbb23e35daac1c0896ef5f17dbe40");

console.log("(✿╹◡╹) VERSACE");