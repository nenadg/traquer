window.addEventListener('load', function() {
	var playstop       = document.createElement('div');
	playstop.className = 'playstop';
	playstop.id        = 'traquer-playstop';
	controls           = new Controls();

	playstop.addEventListener('click', controls.recording.bind(this, controls));

	document.body.appendChild(playstop);
});


var Controls = function(){
	if (!(this instanceof Controls)) {
        return new Controls();
    }

    this.traquer = new Traquer();
}

Controls.prototype.recording = function(controls, e) {
	var self     = controls,
		traquer  = self.traquer,
		playstop = e.target;
	

	if(!traquer.isRecording){
		traquer.start();
		playstop.className = 'playstop squared';
		return;
	}
	
	playstop.className = 'playstop';
	traquer.stop();
	traquer.play(traquer.recordedEvents)
}
