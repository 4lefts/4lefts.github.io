//this feels to me like a more 'idiomatic' way to instantiate p5.js
//see https://github.com/processing/p5.js/wiki/Instantiation-Cases

new p5(function(p){

	//variables for the canvas and holder (i.e. parent div)
	var holder, holderSize, canvas

	var car, mod1, mod2, lpf, verb

	var sliders = []
	var sliderLabelTexts = ['amp', 'coarse', 'fine', 'hr1', 'mi1', 'hr2', 'mi2', 'cut', 'res']
	var sliderLabels = []
	var numSliders = 9

	//variables for text display of parameters
	var displayLabels = ['carrier amplitude', 'carrier frequency', 'modulator 1 amplitude', 'modulator 1 frequency', 'modulator 2 amplitude', 'modulator 2 frequency', 'filter cutoff frequency', 'filter resonance']
	var carAmp, carFreq, mod1amp, mod1freq, mod2amp, mod2freq, cutoff, res

	var fft

	p.setup = function(){

		//get the parent div for the canvas
		holder = p.select('#sketchContainer')
		
		//get size of parent div
		var holderSize = holder.size()
		
		//set canvas to with of parent div - makes sketch responsive
		//use holderSize.width for both - make canvas square
		//(holder.height returns height of 100px)
		canvas = p.createCanvas(holderSize.width, holderSize.width * 0.6)
		p.frameRate(30)
		p.colorMode(p.HSB, 100)
		p.textFont('monospace')
		p.textSize(16)
		
		//create filters and connect in series - carrier -> lpf -> reverb
		lpf = new p5.LowPass()
		lpf.freq(400)
		lpf.res(50)
		lpf.disconnect()

		verb = new p5.Reverb()

		car = new p5.Oscillator('sine')
		car.freq(200)
		car.amp(0)
		car.disconnect()
		car.connect(lpf)
		car.start()

		mod1 = new p5.Oscillator('sine')
		mod1.freq(1000)
		mod1.amp(100)
		mod1.start()
		mod1.disconnect()
		car.freq(mod1)

		mod2 = new p5.Oscillator('sine')
		mod2.freq(400)
		mod2.amp(1000)
		mod2.start()
		mod2.disconnect()
		mod1.freq(mod2)

		verb.process(lpf, 2, 3)	

		fft = new p5.FFT()

		for(var i = 0; i < numSliders; i++){
			sliderLabels[i] = p.createElement('h5', sliderLabelTexts[i])
			sliderLabels[i].addClass('sliderLabel')
			sliders[i] = p.createSlider(0, 127, 0, 1)
			sliders[i].addClass('slider')
			sliders[i].input(p.updateSynth)
		}
		//set filter cutoff to 127 (i.e default to fully open)
		sliders[7].value(127)
		p.updateSynth()
	}

	p.draw = function(){
		p.background(0, 0, 50)
		p.drawSpec()
		p.displayText()
	}

	//responsively resize canvas if window is resized
	p.windowResized = function(){	
		holderSize = holder.size()
		p.resizeCanvas(holderSize.width,  holderSize.width * 0.6)
	}

	p.updateSynth = function(){
		/*
		//------
		Harmonicity ratio = fm/fc 
		Therefore fm = hr * fc

		Modulation index = am/fm
		Therefore am = mod index * fm 

		//------
		fc * hr -> fm 
		fm * mod index -> am
		*/

		//set carrier amplitude to slider 0 value (multiply by self for cheap non-linear scale)
		carAmp = (sliders[0].value() / 127) * (sliders[0].value() / 127)
		car.amp(carAmp, 0.1)

		//set carrier freq to slider 1 and 2 value (coarse and fine)
		carFreq = p.calcFreq(sliders[1].value(), sliders[2].value())
		car.freq(carFreq, 0.1)

		//set modulator1 freq to harmonicity ratio 1 * carrier freq
		var hr1 = (sliders[3].value() / 127) * 4
		mod1freq = hr1 * carFreq
		mod1.freq(mod1freq, 0.1)
		
		//set modulator 1 amplitude to freq of modulator * mod index
		var modIdx1 = (sliders[4].value()/127) * 6
		mod1amp = mod1freq * modIdx1
		mod1.amp(mod1amp, 0.1)

		//set modulator 2 freq to harmonicity ratio * carrier freq
		var hr2 = (sliders[5].value() / 127) * 4
		mod2freq = hr2 * mod1freq
		mod2.freq(mod2freq, 0.1)
		
		//set modulator amplitude to freq of modulator * mod index
		var modIdx2 = (sliders[6].value()/127) * 6
		mod2amp = mod2freq * modIdx2 
		mod2.amp(mod2amp, 0.1)

		cutoff = (sliders[7].value() / 127) * (sliders[7].value() / 127) * 2000
		lpf.freq(cutoff)

		res = sliders[8].value() * 0.3
		lpf.res(res)
	}

	//function takes a fine and coarse pitch, in midi note number, and cents
	p.calcFreq = function(coarse, fine){
		var note = p.midiToFreq(coarse)
		var cents = (fine / 127) * (p.midiToFreq(coarse + 1) - note)
		return note + cents
	}

	p.drawSpec = function(){
		var sp = fft.analyze().splice(0, 400)
		p.push()
		p.noFill()
		p.stroke(0, 0, 100)
		var w = p.width / sp.length
		for(var i = 0, len = sp.length; i < len; i++){
			var x = p.map(i, 0, len, 0, p.width)
			var y = (p.map(sp[i], 255, 0, 0, p.height))
			p.line(x, y, x, p.height)
		}
		p.pop()
	}

	p.displayText = function(){
		//make  strings
		var lab = '', val = ''
		for(var i = 0, len = displayLabels.length; i < len; i++){
			lab = lab + displayLabels[i] + ':\t\n'
		}
		val = val + carAmp.toFixed(2).toString() + '\n'
		val = val + carFreq.toFixed(2).toString() + '\n'
		val = val + mod1amp.toFixed(2).toString() + '\n'
		val = val + mod1freq.toFixed(2).toString() + '\n'
		val = val + mod2amp.toFixed(2).toString() + '\n'
		val = val + mod2freq.toFixed(2).toString() + '\n'
		val = val + cutoff.toFixed(2).toString() + '\n'
		val = val + res.toFixed(2).toString() + '\n'
	
		//display them
		p.push()
		p.noStroke()
		p.fill(0, 0, 100)
		p.textAlign(p.RIGHT)
		p.text(lab, 10, 10, p.width * 0.7, p.height - 20)
		p.textAlign(p.LEFT)
		p.text(val, p.width * 0.7, 10, (p.width * 0.3) - 20, p.height - 20)
		p.pop()
	}

}, 'sketchContainer')

