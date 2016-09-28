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
        recorder = e.target,
        player   = document.querySelector('.player');
    
    if(!traquer.isRecording){
        traquer.start();
        recorder.className = 'recorder squared';
        return;
    }

    if(player){
        //todo
        document.body.removeChild(player);
    }
    
    recorder.className = 'recorder';
    traquer.stop();

    self.timeline.call(self);
    self.player.call(self);
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

    self.tlcWidth = tlcWidth;

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
                                        '</div>',
                                        '<div class="tl-selector" style="z-index: ' + (baseZindex++) + '">',
                                            '{selector}',
                                        '</div>',
                                    '</li>'].join('');

            var colorClass   = event.type == 'click' || event.type == 'keydown' ||
                               event.type == 'keyup' || event.type == 'keypress' ? 'red' : 
                               event.type.indexOf('DOM') > -1 ? 'blue' : 
                               event.type.indexOf('select') > -1 ? 'green' : 'default';
            
            eventConstructor = eventConstructor.replace(/{title}/igm, event.type)
                                               .replace(/{selector}/igm, event.selector)
                                               .replace(/{css-class}/igm, colorClass);
            timelineContainer.innerHTML += eventConstructor;

            if(lastTimeLine && 
                (event.type != 'click' && event.type != 'keydown'  &&
                event.type != 'keyup'  && event.type != 'keypress' &&
                event.type.indexOf('DOM') == -1 &&
                event.type.indexOf('select') == -1) &&
                (percentInTimeLine > lastTimeLine - 10 && percentInTimeLine < lastTimeLine + 10)){
                
                var currentEvent  = timelineContainer.querySelector('#' + eventId),
                    prevEvent     = currentEvent.previousSibling,
                    currentStyle  = window.getComputedStyle(currentEvent),
                    prevStyle     = window.getComputedStyle(prevEvent),
                    currentTop    = Math.abs(Math.round(parseFloat(currentStyle.top.replace('px', '')) * 100 / 100)),
                    prevTop       = Math.abs(Math.round(parseFloat(prevStyle.top.replace('px', '')) * 100 / 100)),
                    topStyle      = 0 ;

                if(prevTop == currentTop)
                    topStyle = currentTop + 28;

                if(prevTop > currentTop)
                    topStyle = prevTop - currentTop + 38;

                if(prevTop < currentTop)
                    topStyle = currentTop - prevTop + 38;

                topStyle -= 80;
                topStyle += 'px';

                currentEvent.style.cssText += 'top: ' + topStyle + ';'; 
            }

            lastTimeLine     = percentInTimeLine;
        }
    }
}

Controls.prototype.player = function(){
    var self              = this,
        traquer           = self.traquer,
        events            = traquer.recordedEvents,
        timelineContainer = document.querySelector('ol.timeline-container'),
        timelineTrack     = document.querySelector('.timeline-track'),
        player            = document.querySelector('.player');

    if(!player){
        player           = document.createElement('div');
        player.className = 'player';
        document.body.appendChild(player);

        player.innerHTML = '<div class="play"></div>';

        traquer.playerTarget = player;

        player.addEventListener('stop', function(e){
            player.className = 'player';
        });

        player.addEventListener('click', function(events, e){
            var self = this;

            if(!self.isPlaying){
                player.className += ' playing';
                self.play(events);
                return;
            }

            self.stop();
            player.className = 'player';

        }.bind(traquer, events));
    }

    if(!timelineTrack){
        timelineTrack           = document.createElement('div');
        timelineTrack.className = 'timeline-track';
        document.body.appendChild(timelineTrack);

        timelineTrack.innerHTML = [
            '<div class="current-event">',
            '</div>'
        ].join('');

        traquer.trackTarget = timelineTrack;

        timelineTrack.addEventListener('move', function(e){
            var eventInfo    = e.detail.eventInfo,
                last         = e.detail.last,
                time         = eventInfo.time,
                tlcWidth     = self.tlcWidth,
                currentEvent = document.querySelector('.current-event');
            
            var  percentInTime    = parseInt(time / last * 100),
                percentInTimeLine = parseInt(percentInTime * tlcWidth / 100) + 152;

            e.target.style.cssText = 'left: ' + percentInTimeLine + 'px;';
            //percentInTimeLine > lastTimeLine - 10 && percentInTimeLine < lastTimeLine + 10
            if(self.previousTime > time - 10 && self.previousTime < time + 10)
                currentEvent.innerHTML += eventInfo.type + ' <br />';
            else
                currentEvent.innerHTML = eventInfo.type + ' <br />';

            self.previousTime = time;
        });
    }
}