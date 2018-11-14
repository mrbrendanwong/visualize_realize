const octokit = require('@octokit/rest')({debug: true});

module.exports = {getContent};

// Testing
async function getContent() {
    const result = await octokit.repos.getContent({owner:'mrbrendanwong', repo: 'beta_engine', path: ''});
    console.log(result);
}