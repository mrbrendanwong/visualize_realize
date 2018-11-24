const http = require('http');
const fs = require('fs');

const config = require('../config');
const handler = require('./data-handler');
const handlerProto = require('./data-handler-proto');

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

function createDir(dirName) {
    if (!fs.existsSync(dirName)){
        fs.mkdirSync(dirName);
    }
}

function initDirs() {
    createDir(config.tmpDir);
    createDir(config.tmpDir + config.commitDir);
    createDir(config.tmpDir + config.repoDir);    
}

initDirs();

// Testing
// const dc = require('./data-controller');
// const dp = require('./data-processor');

// var owner = "mrbrendanwong";
// var repo = "beta_engine";
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

/*
dcp.getRepo("https://github.com/mrbrendanwong/beta_engine").then(() => {
    dcp.getAllCommits("beta_engine")
        .then(commits => {
            let processed = dpp.processCommits(commits).then(results => {
                console.log(results[0].files)
            })
        });
})
*/

handlerProto.processRequest("https://github.com/mrbrendanwong/beta_engine").then(results => {
    console.log(results[0])
    console.log("(✿╹◡╹) VERSACE");
}).catch(e => {
    console.error("Not versace", e);
});