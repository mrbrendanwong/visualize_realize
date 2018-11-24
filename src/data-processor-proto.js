/*
Returns a list of:
    {
        commitSha: "commitSha",
        login: "user",
        files: [
            {
                fileName: "*.java",
                sha: "fileSha"
                additions: 1,
                deletions: 2,
                total: additions - deletions
            }
        ]
    }
*/
function processCommits(commits) {
        let result = commits.map(commit => {

            return new Promise ((resolve, reject) => commit.getTree().then(tree => {
                let commitObj = {
                    sha: commit.sha(),
                    commiter: commit.author().name(),
                    files: []
                };
                // TODO we have to get the latest commit on master, then find its parents
                // And walk up the commit history
                // Because commits on master is not a chain and each commit is not guaranteed to
                // be the diff of the previous commit in the array

                /*
                let diffData = commit.getDiff().then(diffs => {
                    return diffs.map(diff => {
                        return new Promise (resolve => {
                            let patchData = diff.patches().then(patches => {
                                return patches.map(patch => {
                                    return {
                                        total_delta: patch.lineStats().total_additions - patch.lineStats().total_deletions,
                                        fileName: patch.newFile().path().split("/").pop().toLowerCase()
                                    }
                                })
                            })
                        })
                    });

                    Promise.all(patches).then()
                });
                */

                let emitter = tree.walk();

                emitter.on('entry', entry => {
                    if (entry.isBlob() && entry.name().endsWith(".java")) {
                        let fileObj = {
                            fileName: entry.name().toLowerCase(),
                            sha: entry.sha()
                        };
                        commitObj.files.push(fileObj);
                    }
                });

                emitter.on('end', () => resolve(commitObj));

                emitter.start();
            }));
        });

        return Promise.all(result);
}


module.exports = {processCommits};