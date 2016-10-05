"use strict";

Traquer.Controls = function(){
    if (!(this instanceof Traquer.Controls)) {
        return new Traquer.Controls();
    }

    this.traquer = new Traquer();
    this.styles  = ['base.css',
                    'timeline.css',
                    'recorder.css',
                    'player.css',
                    'reset.css'];
}

Traquer.Controls.prototype.loadStyles = function(){
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

Traquer.Controls.prototype.recording = function(controls, e){
    var self     = controls,
        traquer  = self.traquer,
        recorder = e.target,
        player   = document.querySelector('.traquer-player');
    
    if(!traquer.isRecording){
        traquer.start();
        recorder.className = 'traquer-recorder squared';
        return;
    }

    if(player){
        //todo
        document.body.removeChild(player);
    }
    
    var lzw = new Traquer.Lzw();

    recorder.className = 'traquer-recorder';
    traquer.stop();

    var enc = lzw.encode(traquer.recordedEvents);
    var dec = lzw.decode(enc);

    self.recordedEvents = dec;

    console.log(lzw.getHumanReadableLength(enc));
    

    self.timeline.call(self);
    self.player.call(self);
}

Traquer.Controls.prototype.timeline = function(){
    var self              = this,
        traquer           = self.traquer,
        events            = traquer.recordedEvents,
        timelineContainer = document.querySelector('ol.traquer-timeline-container');

    if(!timelineContainer){
        timelineContainer           = document.createElement('ol');
        timelineContainer.className = 'traquer-timeline-container'; 
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
                eventId           = event.tid,
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
                percentInTimeLine = parseInt(percentInTime * tlcWidth / 100),
                currentEvent      = timelineContainer.querySelector('#' + id);
           
            if(lastTimeLine && 
                (percentInTimeLine > lastTimeLine - 10 && percentInTimeLine < lastTimeLine + 10)){
                
                
                var  prevEvent     = currentEvent.previousSibling,
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

            currentEvent.addEventListener('click', function(id, type, time, e){
                var recordedEvent = this.recordedEvents.filter(function(re){
                    return re.tid == id;
                })[0];
                
                var li = e.target;

                if(li.className.indexOf('selected') == -1)
                    li.className += ' selected';
                else
                    li.className = li.className.replace('selected', '');
                
                self.editor(id, type, time);

            }.bind(traquer, id, type, time));

            lastTimeLine      = timeLineNode.lastTimeLine;
        }
    }
}

Traquer.Controls.prototype.player = function(){
    var self              = this,
        traquer           = self.traquer,
        events            = traquer.recordedEvents,
        timelineContainer = document.querySelector('ol.traquer-timeline-container'),
        timelineTrack     = document.querySelector('.traquer-timeline-track'),
        player            = document.querySelector('.traquer-player');

    if(!player){
        player           = document.createElement('div');
        player.className = 'traquer-player';
        player.title     = 'Replay';
        document.body.appendChild(player);

        player.innerHTML = '<div class="play"></div>';

        traquer.playerTarget = player;

        player.addEventListener('stop', function(e){
            player.className = 'traquer-player';
        });

        player.addEventListener('click', function(events, e){
            var self = this;

            if(!self.isPlaying){
                player.className += ' playing';
                self.play(events);
                return;
            }

            self.stop();
            player.className = 'traquer-player';

        }.bind(traquer, events));
    }

    this.reset();

    if(!timelineTrack){
        timelineTrack           = document.createElement('div');
        timelineTrack.className = 'traquer-timeline-track';
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

Traquer.Controls.prototype.reset = function(){
    var self              = this,
        traquer           = self.traquer,
        events            = traquer.recordedEvents,
        reset             = document.querySelector('.traquer-reset');

    if(!reset){
        reset           = document.createElement('div');
        reset.className = 'traquer-reset';
        reset.title     = 'Reset';
        document.body.appendChild(reset);

        reset.innerHTML = '<div class="play"></div>';

        reset.addEventListener('click', function(events, e){
            var self = this,
                timelineContainer = document.querySelector('ol.traquer-timeline-container'),
                timelineTrack     = document.querySelector('.traquer-timeline-track'),
                currentEvent      = document.querySelector('.current-event'),
                player            = document.querySelector('.traquer-player');

            self.recordedEvents = [];
            document.body.removeChild(player);
            document.body.removeChild(reset); 
            document.body.removeChild(timelineContainer);
            document.body.removeChild(timelineTrack);
            
        }.bind(traquer, events));
    }
}

Traquer.Controls.prototype.editor = function(id, type, time){
    var self              = this,
        traquer           = self.traquer,
        events            = traquer.recordedEvents,
        editor            = document.querySelector('.traquer-editor');

    if(!editor){
        editor            = document.createElement('div');
        editor.className  = 'traquer-editor';
        
        document.body.appendChild(editor);
    }

    editor.innerHTML = '';
    editor.innerHTML = id + ' ' + type + ' ' + time;
}