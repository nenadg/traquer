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

Controls.prototype.recording = function(controls, e){
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

	self.timeline.call(self);
	//traquer.play(traquer.recordedEvents)
}

Controls.prototype.timeline = function(){
	var self     = this,
		traquer  = self.traquer,
		events   = traquer.recordedEvents;

	var timelineContainer       = document.createElement('ol');
	timelineContainer.className = 'timeline-container'; 
	document.body.appendChild(timelineContainer);

	var tlcBox   = timelineContainer.getBoundingClientRect(),
		tlcWidth = tlcBox.width,
		last     = events[events.length -1].time;


	var i;
	for (i in events){
		if(events.hasOwnProperty(i)){
			var event             = events[i],
				percentInTime     = parseInt(event.time / last * 100),
				percentInTimeLine = parseInt(percentInTime * tlcWidth / 100),
				eventConstructor  = ['<li style="left: ' + percentInTimeLine + 'px;">',
								    	'<span class="tl-type">',
								    		'{title}',
								    	'</span><br/>',
								    	'<span class="tl-selector">',
								    		'{selector}',
								    	'</span>',
								  	'</li>'].join('');
			
			eventConstructor = eventConstructor.replace(/{title}/igm, event.type)
											   .replace(/{selector}/igm, event.selector);
			timelineContainer.innerHTML += eventConstructor;
		}
	}
}
