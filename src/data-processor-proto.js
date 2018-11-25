const _ = require('lodash');
/*
Returns a list of:
    {
        commitSha: "commitSha",
        login: "user",
        files: [
            {
                fileName: "*.java",
                fileSha: "fileSha",
                diff: 2,
            }
        ]
    }
*/
function processCommits(commits) {
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
                                        fileName: patch.newFile().path().split("/").pop(),
                                    }
                                });
                                resolve1(result);
                            });
                        }))
                    });
                    return Promise.all(diffPromises);
                }).then(diffInfo => {
                    let emitter = tree.walk();

                    let fileDeltas = _.flattenDeep(diffInfo);
                    let mergedDeltas = [];
                    fileDeltas.forEach(delta => {
                        let fileNameIndex = mergedDeltas.findIndex(md => md.fileName === delta.fileName);
                        if (fileNameIndex === -1) {
                            mergedDeltas.push({
                                fileName: delta.fileName,
                                total_delta: delta.total_delta,
                            });
                        } else {
                            mergedDeltas[fileNameIndex].total_delta += delta.total_delta;
                        }
                    });

                    emitter.on('entry', entry => {
                        if (entry.isBlob() && entry.name().endsWith(".java")) {
                            let fileDiff = mergedDeltas.find(f => f.fileName === entry.name());
                            let fileObj = {
                                fileName: entry.name(),
                                fileSha: entry.sha(),
                                diff: 0,
                            };
                            if (fileDiff !== undefined) {
                                fileObj.diff = fileDiff.total_delta;
                            }
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

module.exports = {processCommits};