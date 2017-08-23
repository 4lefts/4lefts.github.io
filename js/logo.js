var holder = document.getElementById('orbs')
var canvas
var orbs = []
var numOrbs = 20
var minRad = 10
var maxRad = 70

function setup(){
  canvas = createCanvas(holder.offsetWidth, holder.offsetHeight)
  canvas.parent('#orbs')
  for(var i = 0; i < numOrbs; i++){
    orbs[i] = new Orb(random(width), random(height), random(minRad, maxRad))
  }
}

function windowResized(){
  resizeCanvas(holder.offsetWidth, holder.offsetHeight)
}

function draw(){
  background(255)
  orbs.forEach(function(orb, i, arr){
    orb.update()
    orb.render()
    orb.checkDist(arr)
    orb.drawLines()
  })
}

function Orb(_x, _y, _r){
  this.loc = createVector(_x, _y)
  this.target = createVector(random(width), random(height))
  this.r = _r
  this.easing = 0.01
}

Orb.prototype.update = function(){
  this.delta = this.target.copy()
  this.delta.sub(this.loc)
  if(this.loc.dist(this.target) < 1){
    this.target.set(random(width), random(height))
  }
  this.loc.add(this.delta.mult(this.easing))
}

Orb.prototype.render = function(){
  push()
  noStroke()
  fill(50, 150, 200, 100)
  ellipse(this.loc.x, this.loc.y, this.r)
  pop()
}

Orb.prototype.checkDist = function(orbs){
  this.dists = orbs.map((orb) => {
      return this.loc.dist(orb.loc) < this.r * 2 ? orb.loc : false
  }).filter((elem) => {
    return elem != false
  })
}

Orb.prototype.drawLines = function(){
  this.dists.forEach((dst) => {
    push()
    noFill()
    strokeWeight(1)
    stroke(34, Math.abs(this.loc.dist(dst) * -1))
    line(this.loc.x, this.loc.y, dst.x, dst.y)
    pop()
  })
}
