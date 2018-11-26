// Boid template code: https://github.com/MikeC1995/BoidsCanvas

var once = false;

var Boid = function (parent, position, velocity, size) {
    // Initialise the boid parameters
    this.position = new Vector(position.x, position.y);
    this.velocity = new Vector(velocity.x, velocity.y);
    this.acceleration = new Vector(0, 0);

    this.size = size;
    this.parent = parent;

    this.bugs = {};
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
    var v1 = this.cohesion();
    var v2 = this.separation();
    var v3 = this.alignment();

    // Weight rules to get best behaviour
    v1 = v1.mul(new Vector(1, 1));
    v2 = v2.mul(new Vector(1, 1));
    v3 = v3.mul(new Vector(1.1, 1.1));

    this.applyForce(v1);
    this.applyForce(v2);
    this.applyForce(v3);

    this.velocity = this.velocity.add(this.acceleration);
    this.velocity = this.velocity.limit(this.parent.options.speed);

    this.position = this.position.add(this.velocity);
    this.acceleration = this.acceleration.mul(new Vector(0, 0));
    this.borders();

    // Update the bugs
    for (const [issue, bug] of Object.entries(this.bugs)) {
        bug.update();
        //bug.position = bug.position.add(bug.velocity);
    }
};

// BOIDS FLOCKING RULES

/* Cohesion rule: steer towards average position of local flockmates */
Boid.prototype.cohesion = function () {
    var sum = new Vector(0, 0); // Average flockmate position
    var count = 0;  // number of local flockmates

    // For each boid close enough to be seen...
    for (var i = 0; i < this.parent.boids.length; i++) {
        var d = this.position.dist(this.parent.boids[i].position);
        if (d > 0 && d < this.parent.visibleRadius) {
            sum = sum.add(this.parent.boids[i].position);
            count++;
        }
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
    for (var i = 0; i < this.parent.boids.length; i++) {
        var d = this.position.dist(this.parent.boids[i].position) - (this.size * this.parent.boidRadius);
        if (d > 0 && d < this.parent.separationDist) {
            var diff = this.position.sub(this.parent.boids[i].position);
            diff = diff.normalise();
            diff = diff.div(new Vector(d, d));
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
    var sum = new Vector(0, 0); // Average velocity
    var count = 0;  // number of local flockmates

    // For each boid which is close enough to be seen
    for (var i = 0; i < this.parent.boids.length; i++) {
        var d = this.position.dist(this.parent.boids[i].position);
        if (d > 0 && d < this.parent.visibleRadius) {
            sum = sum.add(this.parent.boids[i].velocity);
            count++;
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
};

Bug.prototype.draw = function() {
    this.parent.parent.ctx.drawImage(this.parent.parent.bugImages[this.type],
        this.position.x, this.position.y,
        this.drawSize, this.drawSize);
}

Bug.prototype.update = function () {
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
    // TODO remove
    this.options = {
        speed: 3,
    };

    // Internal boids parameters
    this.visibleRadius = 150;
    this.maxForce = 0.04;
    this.separationDist = 80;
    this.boidRadius = 5;  //size of the smallest boid

    this.maxDrawSize = 140;
    this.minDrawSize = 45;

    let minMaxFile = this.findFileLimit();
    this.maxFileSize = minMaxFile["max"];
    this.minFileSize = minMaxFile["min"];

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

        // TODO don't reinitialize boids on resize, scale instead
        this.initialiseBoids();
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
    this.currentCommit = 0;
    this.boids = {};

    for (var i = 0; i < data.commits[0].files.length; i++) {
        this.boids[data.commits[0].files[i].fileName] = this.generateBoid(data.commits[0].files[i]);
        //this.boids.push(new Boid(this, position, velocity, size));
    }
};

BoidsCanvas.prototype.changeCommit = function (event) {
    let code;
    let commit;

    if (event.key !== undefined) {
        code = event.key;
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
            if (this.currentCommit === 0) {
                return;
            }
            commit = data.commits[this.currentCommit];
            commit.files.forEach(function (file) {
                this.boids[file.fileName].size -= file.diff;
            }.bind(this));
            this.currentCommit--;
            break;
        case "Right":
        case "ArrowRight":
        case 39:
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
            break;
        default:
            return;
    }

    commit = data.commits[this.currentCommit];

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
    console.log("---");
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

    let min = data.commits[0].files[0].diff;
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
    return {"min": min, "max": max};
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

    var boid = new Boid(this, position, velocity, size);

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