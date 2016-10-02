window.addEventListener('load', function() {
    var recorder       = document.createElement('div');
    recorder.className = 'traquer-recorder';
    recorder.id        = 'traquer-recorder';
    controls           = new Controls();

    controls.loadStyles();

    recorder.addEventListener('click', controls.recording.bind(this, controls));

    document.body.appendChild(recorder);
});


var Controls = function(){
    if (!(this instanceof Controls)) {
        return new Controls();
    }

    this.traquer = new Traquer();
    this.styles  = ['base.css',
                    'timeline.css',
                    'recorder.css',
                    'player.css'];
}

Controls.prototype.loadStyles = function(){
    var self   = this,
        head   = document.head,
        styles = head.querySelectorAll('link'),
        loaded = false, i;

    for(i in styles){
        if(styles.hasOwnProperty(i)){
            var style = styles[i];

            if(self.styles.indexOf(style.href) > -1)
                loaded = true;
        }
    }
    
    if(!loaded){
        var stylesheet = document.createElement('link');
        stylesheet.rel = 'stylesheet';
        stylesheet.type = 'text/css';
        stylesheet.href  = 'http://localhost:3008/traquer.min.css';
        document.head.appendChild(stylesheet);
    }
}

Controls.prototype.recording = function(controls, e){
    var self     = controls,
        traquer  = self.traquer,
        recorder = e.target,
        player   = document.querySelector('.player');
    
    if(!traquer.isRecording){
        traquer.start();
        recorder.className = 'traquer-recorder squared';
        return;
    }

    if(player){
        //todo
        document.body.removeChild(player);
    }
    
    recorder.className = 'traquer-recorder';
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

    var baseZindex          = 2147000000, 
        timeLineNodes       = [],
        timelineConstructor = '',
        lastTimeLine,
        i;

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
                                            '{title} {key} ',
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
                                               .replace(/{key}/igm, event.raw.key || '')
                                               .replace(/{css-class}/igm, colorClass);

            var timeLineNode = {
                id           : eventId,
                time         : event.time,
                type         : event.type,
                lastTimeLine : percentInTimeLine
            };

            timeLineNodes.push(timeLineNode);

            timelineConstructor += eventConstructor;

        }
    }

    timelineContainer.innerHTML = timelineConstructor;

    for(i in timeLineNodes){
        if(timeLineNodes.hasOwnProperty(i)){
            var timeLineNode      = timeLineNodes[i],
                type              = timeLineNode.type,
                id                = timeLineNode.id,
                time              = timeLineNode.time,
                percentInTime     = parseInt(time / last * 100),
                percentInTimeLine = parseInt(percentInTime * tlcWidth / 100);
           
            if(lastTimeLine && 
                /*(type != 'click' && type != 'keydown'  &&
                type != 'keyup'  && type != 'keypress' &&
                type.indexOf('DOM') == -1 &&
                type.indexOf('select') == -1) &&*/
                (percentInTimeLine > lastTimeLine - 10 && percentInTimeLine < lastTimeLine + 10)){
                
                var currentEvent  = timelineContainer.querySelector('#' + id),
                    prevEvent     = currentEvent.previousSibling,
                    currentStyle  = window.getComputedStyle(currentEvent),
                    prevStyle     = window.getComputedStyle(prevEvent),
                    currentTop    = Math.abs(Math.round(parseFloat(currentStyle.top.replace('px', '')) * 100 / 100)),
                    prevTop       = Math.abs(Math.round(parseFloat(prevStyle.top.replace('px', '')) * 100 / 100)),
                    topStyle      = 0 ;

                if((type == 'click' || type == 'keydown'  ||
                    type == 'keyup'  || type =='keypress' ||
                    type.indexOf('DOM') > -1 ||
                    type.indexOf('select') > -1)){

                        if(prevTop == currentTop)
                            topStyle = currentTop + 8;

                        if(prevTop > currentTop)
                            topStyle = prevTop - currentTop + 4;

                        if(prevTop < currentTop)
                            topStyle = currentTop - prevTop  + 4;

                        topStyle = -topStyle;
                        topStyle += 'px';
                       
                       
                }
                else{

                    if(prevTop == currentTop)
                        topStyle = currentTop + 18;

                    if(prevTop > currentTop)
                        topStyle = prevTop - currentTop + 38;

                    if(prevTop < currentTop)
                        topStyle = currentTop - prevTop + 38;

                    topStyle -= 70;
                    topStyle += 'px';
                }

                currentEvent.style.cssText += 'top: ' + topStyle + ';';
            }

            lastTimeLine      = timeLineNode.lastTimeLine;
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
            if(self.previousTime > time - 2 && self.previousTime < time + 2)
                currentEvent.innerHTML += eventInfo.type + '(' + time + ') <br />';
            else
                currentEvent.innerHTML = eventInfo.type + '(' + time + ') <br />';

            self.previousTime = time;
        });
    }
}