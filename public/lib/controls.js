"use strict";

Traquer.Controls = function(){
    if (!(this instanceof Traquer.Controls)) {
        return new Traquer.Controls();
    }

    this.traquer = Traquer.getInstance();
    this.styles  = ['base.css',
                    'timeline.css',
                    'recorder.css',
                    'player.css',
                    'reset.css',
                    'track.css',
                    'editor.css',
                    'storage.css',
                    'modal.css',
                    'heatmap.css'];

    Traquer.Controls.__instance = this;
}

Traquer.Controls.getInstance = function(){
    return this.__instance;
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
        console.warn('[i] load min styles.')
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
    
    recorder.className = 'traquer-recorder';
    traquer.stop();
    
    var storage = new Traquer.Storage();
    storage.save(traquer.recordedEvents);

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

    if(!events.length)
        return;

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
                lastTimeLine : percentInTimeLine,
                selector     : event.selector
            };

            timeLineNodes.push(timeLineNode);

            timelineConstructor += eventConstructor;

        }
    }
    var k = performance.now();
    timelineContainer = traquer.replaceHtml(timelineContainer, timelineConstructor);
    //timelineContainer.innerHTML = timelineConstructor;

    //var loadInterval = setTimeout(function(){
        //if(document.querySelectorAll('ol.traquer-timeline-container li')[events.length -1]){
            self.addTimeLineEvents(timeLineNodes, lastTimeLine, last, tlcWidth);
           // clearTimeout(loadInterval);
            console.log('now', performance.now() - k);
        //}
        //console.log('not yet');
    //}, 1500);

    
    
    
}

Traquer.Controls.prototype.addTimeLineEvents = function(timeLineNodes, lastTimeLine, last, tlcWidth){
    var self = this, i, traquer = self.traquer;
    for(i = 0; i < timeLineNodes.length; i++ ){
        var timeLineNode      = timeLineNodes[i],
            type              = timeLineNode.type,
            id                = timeLineNode.id,
            time              = timeLineNode.time,
            selector          = timeLineNode.selector,
            percentInTime     = parseInt(time / last * 100),
            percentInTimeLine = parseInt(percentInTime * tlcWidth / 100),
            currentEvent      = document.getElementById(id);
        
        //if(!currentEvent)
         //   continue;

        if(lastTimeLine && 
            (percentInTimeLine > lastTimeLine - 10 && percentInTimeLine < lastTimeLine + 10)){
            
            
            var prevEvent     = currentEvent.previousSibling;

            if(!prevEvent)
                continue;

            var currentStyle  = window.getComputedStyle(currentEvent),
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
            else {

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

        currentEvent.addEventListener('click', function(id, type, time, selector, e){
            var recordedEvent = this.recordedEvents.filter(function(re){
                return re.tid == id;
            })[0];
            
            var li = e.target,
                others = li.parentNode.querySelectorAll('.selected'), i;

            for(i in others){
                if(others.hasOwnProperty(i)){
                    var selectedOther = others[i];
                    // remove selected
                    selectedOther.className = selectedOther.className.replace('selected', '');
                }
            }

            if(li.className.indexOf('selected') == -1)
                li.className += ' selected';
            else
                li.className = li.className.replace('selected', '');
            
            self.editor(id, type, time, selector);

        }.bind(traquer, id, type, time, selector));

        lastTimeLine      = timeLineNode.lastTimeLine;
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

                var editor = document.querySelector('.traquer-editor');

                if(editor)
                    document.body.removeChild(editor);
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
        timelineTrack.draggable = true;
        
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
                player            = document.querySelector('.traquer-player'),
                editor            = document.querySelector('.traquer-editor');

            self.recordedEvents = [];
            document.body.removeChild(player);
            document.body.removeChild(reset); 
            document.body.removeChild(timelineContainer);
            document.body.removeChild(timelineTrack);

            if(editor)
                document.body.removeChild(editor);
            
        }.bind(traquer, events));
    }
}

Traquer.Controls.prototype.editor = function(id, type, time, selector){
    var self              = this,
        traquer           = self.traquer,
        events            = traquer.recordedEvents,
        editor            = document.querySelector('.traquer-editor');

    if(!editor){
        editor            = document.createElement('div');
        editor.className  = 'traquer-editor';
        
        document.body.appendChild(editor);
    }

    var tpl = [
        '<h3>Event `<span id="event-type-' + id + '">' + type + '</span>`</h3>',
        '<span id="editor-close" class="close">x</span>',
        '<p>Event executed at ' + time + 'ms from start.</p>',
        '<p class="editor-event-selector">Selector:<br/>',
        '<i id="event-selector-' + id + '" class="selector">' + selector + '</i>',
        '</p>',
        '<p id="delete-event-' + id + '" class="button red">Delete event</p>',
        '<p id="edit-event-' + id + '" class="button">Edit event</p>'
    ].join('');

    editor.innerHTML = '';
    editor.innerHTML = tpl;
   
    this.bindDelete(editor.querySelector('#delete-event-' + id), id);
    this.bindEdit(editor.querySelector('#edit-event-' + id), id);
    this.bindClose(editor.querySelector('#editor-close'));
}

Traquer.Controls.prototype.bindClose = function(el){
    var self              = this;
    
    el.addEventListener('click', function(e){
        var editor       = document.querySelector('.traquer-editor');
        document.body.removeChild(editor);
        self.timeline.call(self);
    });
}

Traquer.Controls.prototype.bindDelete = function(el, id){
    var self              = this,
        traquer           = self.traquer,
        events            = traquer.recordedEvents;
    
    el.addEventListener('click', function(e){
        var currentEvent = events.filter(function(ef){ return ef.tid == id })[0],
            editor       = document.querySelector('.traquer-editor');
     
        events.splice(events.indexOf(currentEvent), 1);
        self.timeline.call(self);
        document.body.removeChild(editor);
    });
}

Traquer.Controls.prototype.bindEdit = function(el, id){
    var self              = this;
        
    el.addEventListener('click', self.editFn.bind(self, el, id));
}

Traquer.Controls.prototype.editFn = function(el, id, e){
    var self            = this,
        traquer         = self.traquer,
        events          = traquer.recordedEvents,
        currentEvent    = events.filter(function(ef){ return ef.tid == id })[0],
        editor          = document.querySelector('.traquer-editor'),
        deleteEl        = document.querySelector('#delete-event-' + id),
        eventTypeEl     = document.querySelector('#event-type-' + id),
        eventSelectorEl = document.querySelector('#event-selector-' + id);
    
    el.removeEventListener('click', self.editFn, false);

    if(deleteEl)
        editor.removeChild(deleteEl);

    eventTypeEl.setAttribute('contentEditable', true);
    eventSelectorEl.setAttribute('contentEditable', true);

    var clone        = el.cloneNode();
    clone.id         = 'save-event-' + id;
    clone.innerText  = 'Save';
    clone.className += ' green'; 

    clone.addEventListener('click', self.saveFn.bind(self, el, id));
    editor.replaceChild(clone, el);  
}

Traquer.Controls.prototype.saveFn = function(el, id, e){
     var self             = this,
        traquer           = self.traquer,
        events            = traquer.recordedEvents,
        eventTypeEl       = document.querySelector('#event-type-' + id),
        eventSelectorEl   = document.querySelector('#event-selector-' + id),
        editor            = document.querySelector('.traquer-editor'),
        currentEvent      = events.filter(function(ef){ return ef.tid == id })[0],
        newType           = eventTypeEl.innerText,
        newSelector       = eventSelectorEl.innerText;
    
    currentEvent.type                    = newType && newType.length ? newType.replace(/\s/g, '') : currentEvent.type;
    currentEvent.selector                = newSelector && newSelector.length ? newSelector : currentEvent.selector;
    events[events.indexOf(currentEvent)] = currentEvent;

    self.timeline.call(self);
    document.body.removeChild(editor);
}