window.addEventListener('load', function() {
	var recorder       = document.createElement('div');
	recorder.className = 'recorder';
	recorder.id        = 'traquer-recorder';
	controls           = new Controls();

	recorder.addEventListener('click', controls.recording.bind(this, controls));

	document.body.appendChild(recorder);
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
		recorder = e.target;
	
	if(!traquer.isRecording){
		traquer.start();
		recorder.className = 'recorder squared';
		return;
	}
	
	recorder.className = 'recorder';
	traquer.stop();

	self.timeline.call(self);
	self.timeline.call(self);
}

Controls.prototype.timeline = function(){
	var self              = this,
		traquer           = self.traquer,
		events            = traquer.recordedEvents,
		timelineContainer = document.querySelector('ol.timeline-container');

	if(!timelineContainer){
		timelineContainer           = document.createElement('ol');
		timelineContainer.className = 'timeline-container'; 
		document.body.appendChild(timelineContainer);
	}
	
	timelineContainer.innerHTML = '';	

	var tlcBox   = timelineContainer.getBoundingClientRect(),
		tlcWidth = tlcBox.width,
		last     = events[events.length -1].time;

	var i, lastTimeLine, baseZindex = 2147000000;
	for (i in events){
		if(events.hasOwnProperty(i)){
			var event             = events[i],
				percentInTime     = parseInt(event.time / last * 100),
				percentInTimeLine = parseInt(percentInTime * tlcWidth / 100),
				eventId           = 'e_' + Math.random().toString(36).substring(3).substr(0, 8),
				eventConstructor  = ['<li id="' + eventId + '"',
										' style="left: ' + percentInTimeLine + 'px;"',
										' class="{css-class}">',
								    	'<div class="tl-type" style="z-index: ' + (baseZindex++) + '">',
								    		'{title}',
								    	'</div><br/>',
								    	'<div class="tl-selector" style="z-index: ' + (baseZindex++) + '">',
								    		'{selector}',
								    	'</div>',
								  	'</li>'].join('');

			

			var colorClass   = event.type == 'click' || event.type == 'keydown' ||
			                   event.type == 'keyup' || event.type == 'keypress' ? 'red' : 
			                   event.type.indexOf('DOM') > -1 ? 'blue' : 'default';
			
			eventConstructor = eventConstructor.replace(/{title}/igm, event.type)
											   .replace(/{selector}/igm, event.selector)
											   .replace(/{css-class}/igm, colorClass);
			timelineContainer.innerHTML += eventConstructor;

			if(lastTimeLine && 
				(event.type != 'click' && event.type != 'keydown'  &&
				event.type != 'keyup'  && event.type != 'keypress' &&
				event.type.indexOf('DOM') == -1) &&
				(percentInTimeLine > lastTimeLine - 10 && percentInTimeLine < lastTimeLine + 10)){
				
				var currentEvent  = timelineContainer.querySelector('#' + eventId),
					prevEvent     = currentEvent.previousSibling,
					currentStyle  = window.getComputedStyle(currentEvent),
					prevStyle     = window.getComputedStyle(prevEvent),
					currentTop    = parseInt(currentStyle.top.replace('px', '')),
					prevTop       = parseInt(prevStyle.top.replace('px', '')),
					topStyle      = (currentTop + ((prevTop == currentTop) ? 38 : 18)) + 'px';

				currentEvent.style.cssText += 'top: ' + topStyle + ';';	
			}

			lastTimeLine     = percentInTimeLine;
		}
	}
}

Controls.prototype.player = function(){

}
