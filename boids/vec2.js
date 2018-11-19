var Vector = function(x, y) {
  if(x === 'undefined') x = 0;
  if(y === 'undefined') y = 0;
  this.x = x;
  this.y = y;
};

Vector.prototype.add = function(v) {
  return new Vector(this.x + v.x, this.y + v.y);
};
Vector.prototype.sub = function(v) {
  return new Vector(this.x - v.x, this.y - v.y);
};
Vector.prototype.mul = function(v) {
  return new Vector(this.x * v.x, this.y * v.y);
};
Vector.prototype.div = function(v) {
  return new Vector(this.x / v.x, this.y / v.y);
};
Vector.prototype.mag = function() {
  return Math.sqrt((this.x * this.x) + (this.y * this.y));
};
Vector.prototype.normalise = function(v) {
  var mag = this.mag();
  return new Vector(this.x / mag, this.y / mag);
};
Vector.prototype.dist = function(v) {
  return Math.sqrt((this.x - v.x)*(this.x - v.x) + (this.y - v.y)*(this.y - v.y));
};
Vector.prototype.limit = function(limit) {
  var v;
  if(this.mag() > limit) {
    v = this.normalise().mul(new Vector(limit, limit));
  } else {
    v = this;
  }
  return v;
};