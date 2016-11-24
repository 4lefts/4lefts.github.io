// p5 variables
var holder, holderSize, canvas
var rad1, rad2, theta

// tone js variables
var verb = new Tone.Freeverb({
	roomSize: 0.9,
	dampening: 5000,
}).toMaster()


//data structure for scales
var scales = {
	major: [
		1, // root
		9/8, // major second
		81/64, // major third
		4/3, // perfect fourth
		3/2, // perfect fifth
		27/16, // major sixth
		243/128, //major seventh
		2 // octave
	],
	minPent: [
		1, //root
		32/27, //minor third
		4/3, //perfect fourth
		3/2, //perfect fifth
		16/9, //minor seventh
		2 //octave
	],
	//add more here!
}

var currentScale = scales.major

var fundamental = 220
var freqs = currentScale.map(function(elem, index){
	return this * elem
}, fundamental)

var circles = []
var numCircles = freqs.length

console.log(currentScale)
console.log(freqs)

function setup(){
	holder = select('#sketchContainer')
	holderSize = holder.size()
	canvas = createCanvas(holderSize.width, holderSize.width)
	canvas.parent('#sketchContainer')
	//init vars for drawing cricles
	//rad1 = radius of big cirlce
	rad1 = width / 4
	//angle to rotate between each cirle
	theta = (Math.PI * 2) / numCircles
	//rad of each individual circle
	rad2 = (2 * rad1 * (Math.sin(Math.PI / numCircles))) / 2
	//init array of circles
	for(var i = 0; i < numCircles; i++){
		circles[i] = new Circle(theta * i, rad1, rad2, freqs[i], Math.random() * 2 - 1, '0, 170, 60,')
	}
	canvas.mouseReleased(checkCircles)
	console.log(circles)
}

function windowResized(){
	holderSize = holder.size()
	resizeCanvas(holderSize.width, holderSize.width)
	rad1 = width / 4	
	rad2 = (2 * rad1 * (Math.sin(Math.PI / numCircles))) / 2
}

var checkCircles = function(){
	var mX = mouseX - width/2
	var mY = mouseY - height/2
	circles.forEach(function(circle, i){
	var d = dist(mX, mY, circle.x, circle.y)
		if(d < circle.r){
			circle.on = !circle.on
			circle.playStop()
		}
	})
}

function draw(){
	background(255)
	push()
	translate(width/2, height/2)
	stroke(180)
	noFill()
	ellipseMode(RADIUS)	
	circles.forEach(function(circle){
		circle.drawCircle()
	})
	pop()
}

function Circle(_t, _r, _rad, _hz, _p, _c){

	this.x = _r * (Math.sin(_t))
	this.y = _r * (Math.cos(_t))
	this.r = _rad
	this.on = false
	this.c = _c
	this.hz = _hz
	this.pan = _p

	this.meter = new Tone.Meter()
	this.panner = new Tone.Panner(this.pan).connect(verb)
	
	this.tremolo = new Tone.Tremolo({
		frequency: Math.random() * 0.4,
		type: "sine",
		depth: 1,
		spread: 0,
	}).fan(this.panner, this.meter).start()

	this.osc = new Tone.OmniOscillator(this.hz, "sine").connect(this.tremolo)
	this.osc.volume.value = -Infinity
	this.osc.start()

	this.drawCircle = function(){
		push()
		if(this.on){
			console.log(this.meter.value)
			var col = 'rgba(' + this.c + map(this.meter.value, 0, 0.2, 0, 1) +')'
			console.log(col)
			fill(color(col))
		} else {
			noFill()
		}
		ellipse(this.x, this.y, this.r, this.r)
		noStroke()
		fill(0)
		textSize(14)
		var t = this.hz.toFixed(2)
		text(t, this.x - (textWidth(t)/2), this.y + 5)
		pop()
	}

	this.playStop = function(){
		if(this.on){
			this.osc.volume.rampTo(-36, 1)
		} else {
			this.osc.volume.rampTo(-Infinity, 1)
		}
	}
}
