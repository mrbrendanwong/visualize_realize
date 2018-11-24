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

function processCommitsProto(commits) {
    let commitPromises = commits.map(commit => {
        return commit.getTree().then(tree => {
            let commitObj = {
                sha: commit.sha(),
                committer: commit.author().name(),
                files: []
            };

            return new Promise((resolve => {
                commit.getDiff().then(diffs => {
                    let diffPromises = diffs.map(diff => {
                        return new Promise((resolve1 => {
                            diff.patches().then(patches => {
                                let result = patches.map(patch => {
                                    return {
                                        total_delta: patch.lineStats().total_additions - patch.lineStats().total_deletions,
                                        fileName: patch.newFile().path().split("/").pop().toLowerCase()
                                    }
                                });
                                resolve1(result);
                            });
                        }))
                    });
                    return Promise.all(diffPromises)
                }).then(diffInfo => {
                    let emitter = tree.walk();

                    emitter.on('entry', entry => {
                        if (entry.isBlob() && entry.name().endsWith(".java")) {
                            let fileObj = {
                                fileName: entry.name().toLowerCase(),
                                sha: entry.sha(),
                                diff: diffInfo
                            };
                            commitObj.files.push(fileObj);
                        }
                    });

                    emitter.on('end', () => resolve(commitObj));

                    emitter.start();
                });
            }))
        })
    });

    return Promise.all(commitPromises);
}

module.exports = {processCommits, processCommitsProto};