var holder, holderSize, canvas
var orbs = []

function setup(){
  holder = select('#logo')
  holderSize = holder.size()
  canvas = createCanvas(holderSize.width, 240)
  canvas.parent('#logo')
  for(var i = 0; i < 20; i++){
    orbs[i] = new Orb(random(width), random(height), random(10, 70))
  }
}

function windowResized(){
  holderSize = holder.size()
  resizeCanvas(holderSize.width, 240)
}

function draw(){
  background(255)
  orbs.forEach(function(orb){
    orb.update()
    orb.render()
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
  noStroke()
  fill(50, 150, 200, 100)
  ellipse(this.loc.x, this.loc.y, this.r)
}
