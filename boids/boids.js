// Boid template code: https://github.com/MikeC1995/BoidsCanvas

// If true, only renders one frame
var once = false;

// Preprocess the data
var realData = true;
if (realData) {
    for (let commitIndex in data) {
        let commitFiles = data[commitIndex].files;
        for (let fileIndex in commitFiles) {
            let file = commitFiles[fileIndex];
            let bugSet = new Set();
            for (let issueIndex in file.issues) {
                bugSet.add(file.issues[issueIndex].rule);
            }
            file.issues = Array.from(bugSet);
            // delete file.issues;
        }
        // delete data[commitIndex].committer;
    }
    data = {"commits": data};
}
console.log(data);

let leftArrow = document.getElementById("leftArrowImg");
leftArrow.addEventListener('click', function(e) {
    let leftEvent = document.createEvent("HTMLEvents");
    leftEvent.initEvent("keydown", true, false);
    leftEvent.key = "ArrowLeft";
    leftEvent.code = "ArrowLeft";
    leftEvent.keyCode = 37;
    document.dispatchEvent(leftEvent);
});

let rightArrow = document.getElementById("rightArrowImg");
rightArrow.addEventListener('click', function(e) {
    let rightEvent = document.createEvent("HTMLEvents");
    rightEvent.initEvent("keydown", true, false);
    rightEvent.key = "ArrowRight";
    rightEvent.code = "ArrowRight";
    rightEvent.keyCode = 39;
    document.dispatchEvent(rightEvent);
});

var Boid = function (parent, position, velocity, size, name) {
    // Initialise the boid parameters
    this.position = new Vector(position.x, position.y);
    this.velocity = new Vector(velocity.x, velocity.y);
    this.acceleration = new Vector(0, 0);

    this.size = size;
    this.parent = parent;
    this.name = name;

    this.bugs = {};
    // TODO Play a dog sound?
};

Boid.prototype.draw = function () {
    // Draw boid
    let drawSize = ((this.parent.maxDrawSize - this.parent.minDrawSize) /
        (this.parent.maxFileSize - this.parent.minFileSize)) *
        (this.size - this.parent.minFileSize) + this.parent.minDrawSize;
    this.parent.ctx.drawImage(this.parent.boidImage,
        this.position.x, this.position.y,
        drawSize, drawSize);

    // Draw the bugs
    for (const [issue, bug] of Object.entries(this.bugs)) {
        bug.draw();
    }
};

/* Update the boid positions according to Reynold's rules.
** Called on every frame  */
Boid.prototype.update = function () {
    var coh = this.cohesion();
    var sep = this.separation();
    var ali = this.alignment();

    // Weight rules to get best behaviour
    coh = coh.mul(new Vector(1, 1));
    sep = sep.mul(new Vector(0.7, 0.7));
    ali = ali.mul(new Vector(1, 1));

    this.applyForce(coh);
    this.applyForce(sep);
    this.applyForce(ali);

    this.velocity = this.velocity.add(this.acceleration);
    this.velocity = this.velocity.limit(this.parent.options.speed);

    this.position = this.position.add(this.velocity);
    this.acceleration = this.acceleration.mul(new Vector(0, 0));
    this.borders();

    // Update the bugs
    for (const [issue, bug] of Object.entries(this.bugs)) {
        bug.update();
    }
};

// BOIDS FLOCKING RULES

/* Cohesion rule: steer towards average position of local flockmates */
Boid.prototype.cohesion = function () {
    // var coupling = {};
    var sum = new Vector(0, 0); // Average flockmate position
    var count = 0;  // number of local flockmates

    // Find your coupling data
    /*let commitFiles = data.commits[this.parent.currentCommit].files;
    for (let file in commitFiles) {
        if (commitFiles[file].fileName === this.name) {
            coupling = commitFiles[file].coupling;
            break;
        }
    }*/

    // For each boid
    for (const [file, other] of Object.entries(this.parent.boids)) {
        let followX = other.position.x;
        let followY = other.position.y;

        // Didn't wrap
        let nX = Math.abs(other.position.x - this.position.x);
        // Went to high and wrapped backwards
        let highX = Math.abs(other.position.x + this.parent.canvas.width - this.position.x);
        // Went too low and wrapped forwards
        let lowX = Math.abs(other.position.x - this.parent.canvas.width - this.position.x);

        if (nX > highX || nX > lowX) {
            if (highX < lowX) {
                followX = other.position.x + this.parent.canvas.width;
            } else {
                followX = other.position.x - this.parent.canvas.width;
            }
        }

        // Didn't wrap
        let nY = Math.abs(other.position.y - this.position.y);
        // Went to high and wrapped backwards
        let highY = Math.abs(other.position.y + this.parent.canvas.height - this.position.y);
        // Went too low and wrapped forwards
        let lowY = Math.abs(other.position.y - this.parent.canvas.height - this.position.y);

        if (nY > highY || nY > lowY) {
            if (highY < lowY) {
                followY = other.position.y + this.parent.canvas.height;
            } else {
                followY = other.position.y - this.parent.canvas.height;
            }
        }
        let followPos = new Vector(followX, followY);

        let d = this.position.dist(followPos);

        // If you are too far and coupled, steer towards it
        if (d > this.parent.separationDist) {
            if (this.parent.coupling[this.name][other.name] !== undefined ||
                this.parent.coupling[other.name][this.name] !== undefined) {
                //let cplMult = this.parent.coupling[this.name][other.name]; // !== undefined ? coupling[other.name] : 0.5;
                let multiplier = Math.max(this.parent.coupling[this.name][other.name] === undefined ? 0 : this.parent.coupling[this.name][other.name],
                    this.parent.coupling[other.name][this.name] === undefined ? 0 : this.parent.coupling[other.name][this.name]);
                sum = sum.add(followPos.mul(new Vector(multiplier, multiplier)));
                count += (1 * multiplier);
            }
        } //else if (d > 0 && d < this.parent.visibleRadius) {
            // If you are close enough to be seen, but not coupled, go away
            //sum = sum.sub(other.position);
            //count++;
        //}
    }


    if (count > 0) {
        // Calculate average position and return the force required to steer towards it
        sum = sum.div(new Vector(count, count));
        sum = this.seek(sum);
        return sum;
    } else {
        return new Vector(0, 0);
    }
};

/* Separation rule: steer to avoid crowding local flockmates */
Boid.prototype.separation = function () {
    var steer = new Vector(0, 0); // Average steer
    var count = 0;  // number of flockmates considered "too close"

    // For each boid which is too close, calculate a vector pointing
    // away from it weighted by the distance to it
    for (const [file, other] of Object.entries(this.parent.boids)) {
        var d = Math.abs(this.position.dist(other.position)) - this.parent.boidRadius / 2;// - (this.size * this.parent.boidRadius);
        if (d > 0 && d < this.parent.separationDist) {
            var diff = this.position.sub(other.position);
            diff = diff.normalise();
            diff = diff.div(new Vector(d, d));

            // If you are coupled, don't separate as much
            /*if (this.parent.coupling[this.name][other.name] !== undefined ||
                this.parent.coupling[other.name][this.name] !== undefined) {
                diff = diff.div(new Vector(2, 2));
            }*/
            steer = steer.add(diff);
            count++;
        }
    }
    // Calculate average
    if (count > 0) {
        steer = steer.div(new Vector(count, count));
    }

    // Steering = Desired - Velocity
    if (steer.mag() > 0) {
        steer = steer.normalise();
        steer = steer.mul(new Vector(this.parent.options.speed, this.parent.options.speed));
        steer = steer.sub(this.velocity);
        steer = steer.limit(this.parent.maxForce);
    }
    return steer;
};

/* Alignment rule: steer toward average heading of local flockmates */
Boid.prototype.alignment = function () {
    var coupling = {};
    var sum = new Vector(0, 0); // Average velocity
    var count = 0;  // number of local flockmates

    // Find your coupling data
    /*let commitFiles = data.commits[this.parent.currentCommit].files;
    for (let file in commitFiles) {
        if (commitFiles[file].fileName === this.name) {
            coupling = commitFiles[file].coupling;
            break;
        }
    }*/

    // For each boid which is close enough to be seen
    for (const [file, other] of Object.entries(this.parent.boids)) {
        var d = this.position.dist(other.position);
        if (d > 0 && d < this.parent.visibleRadius * 2) {
            // If it is not coupled, run away
            if (this.parent.coupling[this.name][other.name] === undefined &&
                this.parent.coupling[other.name][this.name] === undefined) {
                sum = sum.sub(other.velocity).add(new Vector(Math.random() + 1, Math.random() + 1));
                count += 1;
            } else {
                let multiplier = Math.max(this.parent.coupling[this.name][other.name] === undefined ? 0 : this.parent.coupling[this.name][other.name],
                    this.parent.coupling[other.name][this.name] === undefined ? 0 : this.parent.coupling[other.name][this.name]);
                sum = sum.add(other.velocity.mul(new Vector(multiplier, multiplier)));
                count += (multiplier);
            }
            // count++;
        }
    }

    if (count > 0) {
        // Calculate average and limit
        sum = sum.div(new Vector(count, count));
        sum = sum.normalise();
        sum = sum.mul(new Vector(this.parent.options.speed, this.parent.options.speed));

        // Steering = Desired - Velocity
        var steer = sum.sub(this.velocity);
        steer = steer.limit(this.parent.maxForce);
        return steer;
    } else {
        return new Vector(0, 0);
    }
};


// Implement torus boundaries
Boid.prototype.borders = function () {
    if (this.position.x < 0) this.position.x = this.parent.canvas.width;
    if (this.position.y < 0) this.position.y = this.parent.canvas.height;
    if (this.position.x > this.parent.canvas.width) this.position.x = 0;
    if (this.position.y > this.parent.canvas.height) this.position.y = 0;
};

/* Calculate a force to apply to a boid to steer
** it towards a target position */
Boid.prototype.seek = function (target) {
    var desired = target.sub(this.position);
    desired = desired.normalise();
    desired = desired.mul(new Vector(this.parent.options.speed, this.parent.options.speed));

    var steer = desired.sub(this.velocity);
    steer = steer.limit(this.parent.maxForce);
    return steer;
};

// Adjust the acceleration by applying a force, using A = F / M
// with M = boid size so that larger boids have more inertia
Boid.prototype.applyForce = function (force) {
    this.acceleration = this.acceleration.add(force); //.div(new Vector(this.size, this.size)));
};


//##############################################################################

var Bug = function (parent, type) {
    this.type = type;
    this.parent = parent;

    this.drawSize = 40;
    this.followDistance = 50;

    let a = Math.random() * 2 * Math.PI;
    let r = this.followDistance * Math.sqrt(Math.random());

    this.position = new Vector(r * Math.cos(a) + this.parent.position.x,
        r * Math.sin(a) + this.parent.position.y);
    let diff = this.parent.position.sub(this.position).normalise();
    let dist = this.parent.position.dist(this.position);

    this.velocity = diff.mul(new Vector(dist / this.followDistance, dist / this.followDistance));
    // TODO play a bug sound?
};

Bug.prototype.draw = function() {
    this.parent.parent.ctx.drawImage(this.parent.parent.bugImages[this.type],
        this.position.x, this.position.y,
        this.drawSize, this.drawSize);
}

Bug.prototype.update = function () {
    let bugDistance = 50;
    // Follow the parent through the sides
    let followX = this.parent.position.x;
    let followY = this.parent.position.y;

    // Didn't wrap
    let nX = Math.abs(this.parent.position.x - this.position.x);
    // Went to high and wrapped backwards
    let highX = Math.abs(this.parent.position.x + this.parent.parent.canvas.width - this.position.x);
    // Went too low and wrapped forwards
    let lowX = Math.abs(this.parent.position.x - this.parent.parent.canvas.width - this.position.x);

    if (nX > highX || nX > lowX) {
        if (highX < lowX) {
            followX = this.parent.position.x + this.parent.parent.canvas.width;
        } else {
            followX = this.parent.position.x - this.parent.parent.canvas.width;
        }
    }

    // Didn't wrap
    let nY = Math.abs(this.parent.position.y - this.position.y);
    // Went to high and wrapped backwards
    let highY = Math.abs(this.parent.position.y + this.parent.parent.canvas.height - this.position.y);
    // Went too low and wrapped forwards
    let lowY = Math.abs(this.parent.position.y - this.parent.parent.canvas.height - this.position.y);

    if (nY > highY || nY > lowY) {
        if (highY < lowY) {
            followY = this.parent.position.y + this.parent.parent.canvas.height;
        } else {
            followY = this.parent.position.y - this.parent.parent.canvas.height;
        }
    }
    let followPos = new Vector(followX, followY);
    let diff = followPos.sub(this.position).normalise();
    let dist = followPos.dist(this.position);
    this.velocity = diff.mul(new Vector(dist / this.followDistance, dist / this.followDistance));

    // Separate from other bugs
    let count = 0;
    for (const [name, other] of Object.entries(this.parent.bugs)) {
        let d = this.position.dist(other.position);
        if (d > 0 && d < bugDistance) {
            let diff = this.position.sub(other.position).normalise();
            // Scale based on distance
            //diff = diff.div(new Vector(bugDistance, bugDistance));
            this.velocity = this.velocity.add(diff);
            count++;
        }
    }
    if (count > 0) {
        this.velocity = this.velocity.div(new Vector(count, count));
    }


    this.position = this.position.add(this.velocity);
    this.borders();
}

// Implement torus boundaries
Bug.prototype.borders = function () {
    if (this.position.x < 0) this.position.x = this.parent.parent.canvas.width;
    if (this.position.y < 0) this.position.y = this.parent.parent.canvas.height;
    if (this.position.x > this.parent.parent.canvas.width) this.position.x = 0;
    if (this.position.y > this.parent.parent.canvas.height) this.position.y = 0;
};
//##############################################################################

// BOIDS CANVAS CLASS (FLOCK)
var BoidsCanvas = function (canvas) {
    this.canvasDiv = canvas;
    this.canvasDiv.size = {
        'width': this.canvasDiv.offsetWidth,
        'height': this.canvasDiv.offsetHeight
    };

    // Set customisable boids parameters
    this.options = {
        speed: 1.5,
    };

    // Internal boids parameters
    this.visibleRadius = 150;
    this.maxForce = 0.05;
    this.separationDist = 50;
    this.boidRadius = 45;  //size of the smallest boid

    this.maxDrawSize = 140;
    this.minDrawSize = 45;

    let minMaxFile = this.findFileLimit();
    this.currentCommit = minMaxFile["firstFileCommitIndex"];
    this.maxFileSize = minMaxFile["max"];
    this.minFileSize = minMaxFile["min"];

    let commitNumber = document.getElementById("commitNumber");
    commitNumber.innerText = this.currentCommit;
    if (this.currentCommit === 0) {
        let leftArrow = document.getElementById("leftArrowImg");
        leftArrow.classList.add("disable");
    }
    if (this.currentCommit === data.commits.length - 1){
        let rightArrow = document.getElementById("rightArrowImg");
        rightArrow.classList.add("disable");
    }

    this.coupling = {};
    // Create the coupling data]
    let commitFiles = data.commits[this.currentCommit].files;
    for (let file in commitFiles) {
        this.coupling[commitFiles[file].fileName] = commitFiles[file].coupling;
        //if (commitFiles[file].fileName === this.name) {
        //    coupling = commitFiles[file].coupling;
        //    break;
    }

    // Images
    this.boidImage = document.getElementById("dogImg");
    this.bugImages = {
        "ControlStatementBraces": document.getElementById("lightningImg"),
        "UselessParentheses": document.getElementById("ghostImg"),
        "LooseCoupling": document.getElementById("bombImg"),
    }

    this.init();
};

BoidsCanvas.prototype.init = function () {

    // Create background div
    this.bgDiv = document.createElement('div');
    this.canvasDiv.appendChild(this.bgDiv);
    this.setStyles(this.bgDiv, {
        'position': 'absolute',
        'top': 0,
        'left': 0,
        'bottom': 0,
        'right': 0,
        'z-index': 1
    });

    // Set background to tiled grass image
    this.setStyles(this.bgDiv, {
        'background-image': 'url("./grass.jpg")',
        'background-repeat': 'repeat',
    });

    // Create canvas & context
    this.canvas = document.createElement('canvas');
    this.canvasDiv.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = this.canvasDiv.size.width;
    this.canvas.height = this.canvasDiv.size.height;
    this.setStyles(this.canvasDiv, {'position': 'relative'});
    this.setStyles(this.canvas, {
        'z-index': '20',
        'position': 'relative'
    });

    // Add resize listener to canvas
    window.addEventListener('resize', function () {
        // Check if div has changed size
        if (this.canvasDiv.offsetWidth === this.canvasDiv.size.width && this.canvasDiv.offsetHeight === this.canvasDiv.size.height) {
            return false;
        }

        // Scale canvas
        this.canvas.width = this.canvasDiv.size.width = this.canvasDiv.offsetWidth;
        this.canvas.height = this.canvasDiv.size.height = this.canvasDiv.offsetHeight;

        //this.initialiseBoids();
    }.bind(this));

    this.initialiseBoids();

    // Add key listener to switch commits
    document.addEventListener('keydown', this.changeCommit.bind(this));

    // Update canvas
    this.update();
    if (!once) {
        requestAnimationFrame(this.update.bind(this));
    }
};

// Initialise boids according to options
BoidsCanvas.prototype.initialiseBoids = function () {
    // this.currentCommit = 0;
    this.boids = {};
    let currentCommitFiles = data.commits[this.currentCommit].files;
    for (var i = 0; i < currentCommitFiles.length; i++) {
        this.boids[currentCommitFiles[i].fileName] = this.generateBoid(currentCommitFiles[i]);
    }
};

BoidsCanvas.prototype.changeCommit = function (event) {
    let code;
    let commit;

    if (event.key !== undefined) {
        code = event.key;
    } else if (event.code !== undefined) {
        code = event.code;
    } else if (event.keyCode !== undefined) {
        code = event.keyCode;
    } else {
        console.log("Unable to read key press.");
    }
    // Change the current commit and update sizes
    switch (code) {
        case "Left":
        case "ArrowLeft":
        case 37:
        case "a":
        case "KeyA":
        case 65:
            if (this.currentCommit === 0) {
                return;
            }
            commit = data.commits[this.currentCommit];
            commit.files.forEach(function (file) {
                this.boids[file.fileName].size -= file.diff;
            }.bind(this));
            this.currentCommit--;

            if (this.currentCommit === 0) {
                let leftArrow = document.getElementById("leftArrowImg");
                leftArrow.classList.add("disable");
            } else if (this.currentCommit === data.commits.length - 2){
                let rightArrow = document.getElementById("rightArrowImg");
                rightArrow.classList.remove("disable");
            }
            break;
        case "Right":
        case "ArrowRight":
        case 39:
        case "KeyD":
        case "d":
        case 68:
            if (this.currentCommit === data.commits.length - 1) {
                return;
            }
            this.currentCommit++;
            commit = data.commits[this.currentCommit];
            commit.files.forEach(function (file) {
                if (file.fileName in this.boids) {
                    this.boids[file.fileName].size += file.diff;
                }
            }.bind(this));

            if (this.currentCommit === 1) {
                let leftArrow = document.getElementById("leftArrowImg");
                leftArrow.classList.remove("disable");
            } else if (this.currentCommit === data.commits.length - 1){
                let rightArrow = document.getElementById("rightArrowImg");
                rightArrow.classList.add("disable");
            }
            break;
        default:
            return;
    }

    let commitNumber = document.getElementById("commitNumber");
    commitNumber.innerText = this.currentCommit;
    commit = data.commits[this.currentCommit];

    // Create the coupling data
    let commitFiles = commit.files;
    for (let file in commitFiles) {
        this.coupling[commitFiles[file].fileName] = commitFiles[file].coupling;
        //if (commitFiles[file].fileName === this.name) {
        //    coupling = commitFiles[file].coupling;
        //    break;
        //}
    }

    // Delete boids if file was deleted
    let fileList = commit.files.map(file => file.fileName);
    for (const [file, boid] of Object.entries(this.boids)) {
        if (!(fileList.includes(file))) {
            delete this.boids[file];
        }
    }

    // Update boids
    commit.files.forEach(function (file) {
        // Add a boid if it doesn't exist
        if (!(file.fileName in this.boids)) {
            this.boids[file.fileName] = this.generateBoid(file);
        }
        // Update bugs
        let thisBoid = this.boids[file.fileName];
        // Add a bug if it appears
        for (let index in file.issues) {
            let bugName = file.issues[index];
            if (!(bugName in thisBoid.bugs)) {
                thisBoid.bugs[bugName] = new Bug(thisBoid, bugName);
            }
        }
        // Delete the bug if it no longer exists
        for (let bugName in thisBoid.bugs) {
            if (Object.values(file.issues).indexOf(bugName) === -1) {
                delete thisBoid.bugs[bugName];
            }
        }
    }.bind(this));
}

BoidsCanvas.prototype.update = function () {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.globalAlpha = 1;

    // Update and draw boids
    for (const [file, boid] of Object.entries(this.boids)) {
        boid.draw();
        boid.update();
    }

    // Request next frame
    if (!once) {
        requestAnimationFrame(this.update.bind(this));
    }
};

// Helper method to find min and max file sizes
BoidsCanvas.prototype.findFileLimit = function () {
    let fileList = {};
    let i = 0;
    while (data.commits[i].files[0] === undefined) {
        i++;
    }
    let min = data.commits[i].files[0].diff;
    let max = min;

    for (let index in data.commits) {
        let commit = data.commits[index];
        for (let fileIdx in commit.files) {
            let file = commit.files[fileIdx];
            if (file.fileName in fileList) {
                fileList[file.fileName] += file.diff;
            } else {
                fileList[file.fileName] = file.diff;
            }

            if (fileList[file.fileName] > max) {
                max = fileList[file.fileName];
            } else if (fileList[file.fileName] < min) {
                min = fileList[file.fileName];
            }
        }
    }
    return {"min": min, "max": max, "firstFileCommitIndex": i};
}

// Helper method to generate a randomly placed boid
BoidsCanvas.prototype.generateBoid = function (file) {
    var position = new Vector(Math.floor(Math.random() * (this.canvas.width + 1)),
        Math.floor(Math.random() * (this.canvas.height + 1)));
    var max = 1;
    var min = -1;
    var velocity = new Vector(Math.random() * (max - min) + min,
        Math.random() * (max - min) + min)
        .normalise()
        .mul(new Vector(1.5, 1.5));
    var size = file.diff;

    var boid = new Boid(this, position, velocity, size, file.fileName);

    file.issues.forEach(function(issue, index) {
        if (!(issue in boid.bugs)) {
            boid.bugs[issue] = new Bug(boid, issue);
        }
    });
    return boid;
}

// Helper method to set multiple styles
BoidsCanvas.prototype.setStyles = function (div, styles) {
    for (var property in styles) {
        div.style[property] = styles[property];
    }
};
