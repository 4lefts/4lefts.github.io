//this feels to me like a more 'idiomatic' way to instantiate p5.js
//see https://github.com/processing/p5.js/wiki/Instantiation-Cases

new p5(function(p){

	//variable for the canvas
	var canvas

	//drawing variables
	var unit = 0, //size of unit square (i.e. canvas size)
		rad = 0, //radius of each circle
		angle1 = 0.2617993877991494, //15 degrees in radians
		angle2 = 0.7853981633974483 //45 degrees in radians
	
	//synth variables
	var wheels,
		verb, //global reverb
		synths = [],
		fund = (Math.random() * 300) + 100,
		//intervals are tuned using just intonation
		//see https://en.wikipedia.org/wiki/Pythagorean_tuning
		// 81/64 = major third, 32/27 = minor third, 3/2 = perfect fifth (9/8 = maj 2nd)
		scales = [
			[fund, fund * (81 / 64), fund * (3/2)], 
			[fund, fund * (32 / 27), fund * (3/2)]
		]
		currentScale = 0, // 0 or 1 to choose from above
		pitches = scales[currentScale],
		amplitude = 0.3


	//div to contain button to choose scale, created in function below
	var button
	//palette via lolcolors.com
	//last item is background colour
	var palette = ['#C5E99B', '#8FBC94', '#548687', '#56445D']
	
	p.setup = function(){

		//as an experiment - create canvas as 320 square for mobile
		//does this improve sound perfomance on mobile???

		canvas = p.createCanvas(320, 320)

		//unit is the size of the canvas (i.e. a unit sqaure)
		//use the smaller dimension if the canvas is not square
		unit = p.width > p.height ? p.height : p.width
		rad = calcRad(unit)
		wheels = calcWheels(rad, angle1, angle2, pitches, amplitude)
		console.log(wheels)
		verb = new p5.Reverb
		for(var i = wheels.length - 1; i >= 0; i--){
			synths[i] = new WheelSynth(wheels[i].f, wheels[i].a, wheels[i].d, wheels[i].mf, wheels[i].mp, wheels[i].pan)
		}

		console.log(synths)

		//make div to display fund freq
		var hzDisplay = p.createDiv(fund.toFixed(2) + 'hz')
		hzDisplay.addClass('label')

		//bind listener functions to clicking on this canvas element
		canvas.mouseClicked(canvasClicked)

		//create scale button and bind event to it
		makeScaleButton()
		button.mouseClicked(function(){
			currentScale = buttonClicked(currentScale)
			pitches = scales[currentScale]
			//update wheel pitches
			for(var i = wheels.length - 1; i >= 0; i--){
				wheels[i].f = pitches[i]
				synths[i].updateFreq(wheels[i].f)
			}
		})
	}

	//responsively resize canvas if window is resized
	// p.windowResized = function(){
	// 	holderSize = holder.size()
	// 	p.resizeCanvas(holderSize.width, holderSize.width)
	// 	unit = p.width > p.height ? p.height : p.width
	// 	rad = calcRad(unit)
	// 	var c = calcCoords(rad, angle1, angle2)
	// 	for(var i = wheels.length - 1; i >= 0; i--){
	// 		wheels[i].x = c[i].x	
	// 		wheels[i].y = c[i].y
	// 	}	
	// }

	p.draw = function(){
		p.background(255)
		drawCircles(wheels, rad)
	}

	var canvasClicked = function(){
		for(var i = wheels.length - 1; i >= 0; i--){
			if(p.dist(p.mouseX, p.mouseY, wheels[i].x, wheels[i].y) < rad){
				wheels[i].isPlaying = Math.abs(wheels[i].isPlaying - 1)
				synths[i].startStop(i, wheels[i].isPlaying)
			}
		}
		return false
	}

	var buttonClicked = function(cur){
		if(cur == 0){
			cur = 1
			button.removeClass('is-transitioned')
		} else {
			cur = 0
			button.addClass('is-transitioned')
		}			
		return cur
	}

	// arguments are frequency, amplitude, offset (to detune fm modulator),
	// amp mod freq, amp mod phase, panning
	var WheelSynth = function(_f, _a, _o, _m, _p, _pn){

		this.freq = _f
		this.amp = _a
		this.offset = _o
		this.lfoFreq = _m
		this.lfoPhase = _p
		this.pan = _pn

		this.car = new p5.Oscillator('sine')
		this.mod = new p5.Oscillator('sine')
		this.ampLFO = new p5.Oscillator('sine') 
		
		this.ampLFO.disconnect()
		this.ampLFO.start()
		this.ampLFO.amp(0)
		this.ampLFO.freq(this.lfoFreq)
		this.ampLFO.phase(this.lfoPhase)

		this.mod.disconnect()
		this.mod.start()
		this.mod.amp(500)
		this.mod.freq(this.freq * (2 + this.offset)) //the slight offset creates the beating sound

		this.car.disconnect()
		this.car.start()
		this.car.amp(this.ampLFO.scale(-1, 1, -this.amp, this.amp))
		this.car.pan(this.pan)
		this.car.amp(0)
		this.car.freq(this.freq)
		this.car.freq(this.mod)

		//reverb is global
		verb.process(this.car, 2, 3) //time and decay %
	
		this.startStop = function(idx, isP){
			console.log(synths)
			this.ampLFO.amp(isP, 0.1)
		}

		this.updateFreq = function(newF){
			this.freq = newF
			this.car.freq(newF)
			this.mod.freq(this.freq * (2 + this.offset))
		}
	}

	//function to calculate the radius of each circle in terms of the canvas size
	var calcRad = function(u){
		return u * (4 / (4 + Math.sqrt(2) + Math.sqrt(6))) * 0.5
	}

	//variables are radius, initial angle of rotation and angle of rotation
	//fundamental freq, intervals 1 and 2, and amplitude
	var calcWheels = function(r, a1, a2, pitches, amp){
		var ret = []
		var c = calcCoords(r, a1, a2)
		var p = [0.6, -0.7, 0.2] //panning for the three wheels, between -1(left) and 1(right)
		var counter = 0 // 3 wheels
		while(counter < 3){
			var temp_x = c[counter].x
			var temp_y = c[counter].y
			var temp_f = pitches[counter]
			var temp_a = amp
			var temp_d = Math.random() * 0.01
			var temp_mf = Math.random() * 0.1 // freq of amp mod lfo between 0.01 and 0.1 hz
			var temp_mp = Math.random() // phase to start amp lfo from
			var temp_t = 0 // start arc at straight down
			var temp_i = calcAngleInc(temp_mf, 60) // how much to inc angle per frame
			var temp_p = p[counter]
			ret.push({
				x : temp_x,
				y : temp_y,
				f : temp_f,
				a : temp_a,
				d : temp_d,
				mf: temp_mf,
				mp : temp_mp,
				isPlaying : 0,
				theta : temp_t,
				inc: temp_i,
				pan: temp_p,
			})
			counter++
		}

		return ret
	}

	var calcCoords = function(r, a1, a2){
		var ret = []
		var	x1 = p.width - r,
			y1 = p.height - r,
			x2 = x1 - (Math.cos(a1) * (2 * r)),
			y2 = y1 - (Math.sin(a1) * (2 * r)),
			x3 = x2 + (Math.cos(a2) * (2 * r)),
			y3 = y2 - (Math.sin(a2) * (2 * r))
		ret.push({
			x: x1,
			y: y1,
		})
		ret.push({
			x: x2,
			y: y2,
		})
		ret.push({
			x: x3,
			y: y3,
		})
		return ret
	}	

	//takes freq of oscillator and frame rate
	var calcAngleInc = function(f, fr){
		return (f/fr) * p.TWO_PI
	}

	//variables are radius, initial angle of rotation and angle of rotation
	var drawCircles = function(arr, r){
		p.push()
		p.ellipseMode(p.RADIUS)
		for(var i = arr.length - 1; i >= 0; i--){
			p.noStroke()
			p.fill(palette[3])
			p.ellipse(arr[i].x, arr[i].y, r, r)
			p.fill(palette[i])
			p.arc(arr[i].x, arr[i].y, r, r, p.HALF_PI, (p.HALF_PI + arr[i].theta) % p.TWO_PI)
			if(arr[i].isPlaying){
				arr[i].theta += arr[i].inc
			}
		}
		p.pop()
	}

	var makeScaleButton = function(){

		button = p.createDiv('')
		
		var bLeft = p.createDiv('maj')
		var bRight = p.createDiv('min')
		var handle = p.createDiv('')
		button.id('btn')
		bLeft.id('btnL')
		bRight.id('btnR')
		handle.id('buttonHandle')
		button.addClass('is-transitioned')//start slid to right
		button.child('btnL')
		button.child('btnR')
		button.child('buttonHandle')
	}
}, 'sketchContainer')

