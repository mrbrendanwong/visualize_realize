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
/*
handler.processRequest(owner, repo).then(() => {
    console.log("(✿╹◡╹) VERSACE");
}).catch(e => {
    console.error("Not versace", e);
});
*/


const dcp = require("./data-controller-proto");
const dpp = require("./data-processor-proto");

//dcp.getRepo("https://github.com/mrbrendanwong/beta_engine");
dcp.getAllCommits("beta_engine")
    .then(commits => {
        let processed = dpp.processCommits(commits).then(results => console.log(results[0]))
    });