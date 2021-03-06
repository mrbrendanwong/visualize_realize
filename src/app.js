const http = require('http');
const ds = require('./dispatch')
const fs = require('fs');

const config = require('../config');
const handler = require('./data-handler');
const handlerProto = require('./data-handler-proto');

const hostname = '127.0.0.1';
const port = 3000;


const server = http.createServer((req, res) => {
	if (req.url == '/') {
		res.statusCode = 200;
	    res.setHeader('Content-Type', 'text/html');
	    res.write('Hello World\n');
	    res.end();
    } else {
        ds.serveFile('.' + req.url, res);
    }
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
dcp.getAllCommits("beta_engine")
    .then(commits => {
        let processed = dpp.processCommitsProto(commits).then(results => {
            console.log(results[0].files[0].diff)
        })
    });
*/

handlerProto.processRequest(process.argv[2]).then(results => {
    // console.log(results);
    // console.log(results[4].files);
    fs.writeFileSync('boids/results.js', 'let data = ' + JSON.stringify(results));
    console.log("(✿╹◡╹) VERSACE");
}).catch(e => {
    console.error("Not versace", e);
});
