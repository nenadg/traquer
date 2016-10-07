"use strict";

/**
 * Traquer
 *
 **/
var Traquer = function() {
    if (!(this instanceof Traquer)) {
        return new Traquer();
    }
   
    this.index           = 0;
    this.logging         = false;
    this.recordedEvents  = [];
    this.previousElement = null;

    this.eventNames      = ['mousemove',   'mouseenter',      'mouseleave',      'mouseover',          'mousedown', 
                            'mouseup',     'mouseout',        'click',           'scroll',             'contextmenu', 
                            'wheel',       'focus',           'focusin',         'focusout',           'change', 
                            'input',       'textinput',       'keypress',        'keydown',            'keyup', 
                            'DOMFocusIn',  'DOMFocusOut',     'selectstart',     'selectionchange',    'select',
                            'DOMActivate'];

    var traquerBase = document.querySelector('.traquer-base');
    
    if(!traquerBase){                      
        traquerBase = document.createElement('div');
        traquerBase.className   = 'traquer-base';
        document.body.appendChild(traquerBase);

        window.onerror = function(message, url, lineNumber) {  
            //save error and send to server for example.
            var errorEvent = new Event('terror');
            errorEvent.details = [message, url, lineNumber]
            //return true;
            traquerBase.dispatchEvent(errorEvent);
        }

        traquerBase.addEventListener('terror', function(e){
            console.log('[e] some error');
            console.log(e);
        });
    }

    Traquer.__instance = this;
}

Traquer.getInstance = function(){
    return this.__instance;
}

Traquer.prototype = {
    
    getId: function(){
        var recordedEvents = this.recordedEvents;

        if(recordedEvents && recordedEvents.length){
            var randomId = 'e_' + Math.random().toString(36).substring(3).substr(0, 8),
                same     = recordedEvents.filter(function(recordedEvent){
                    if(recordedEvent.tid == randomId)
                        return same;
                });
            
            if(same.length)
                this.getId();
            else
                return randomId;
        }
    },

    isEventObservable: function(evt) {
        if (evt && evt.type)
            return this.eventNames.indexOf(evt.type) > -1;

        return false;
    },

    start: function (log) {
        var self = this;

        self.isRecording = true;
        self.recordingStartTime = new Date().getTime();
        self.recordedEvents = [];
        self.mousePosition = { x: 0, y: 0 };

        var eventNames = self.eventNames || [];
        self.processEventBinded = self.processEvent.bind(self);

        eventNames.forEach(function(eventName) {
            document.body.addEventListener(eventName, self.processEventBinded, false);
        });

        document.addEventListener('mousemove', function(event){
            self.mousePosition.x = event.clientX;
            self.mousePosition.y = event.clientY;
        });

        if(log)
            this.logging = true;
    },

    stop: function() {
        var self = this;
        var eventNames = self.eventNames || [];
        if (self.processEventBinded)
            eventNames.forEach(function(eventName) {
                document.body.removeEventListener(eventName, self.processEventBinded, false);
            });

        self.isRecording = false;

        if(self.playerTarget){
            var stopEvent = new Event('stop');
            self.playerTarget.dispatchEvent(stopEvent);
        }

        return this.recordedEvents;
    },

    copyEventObject: function(evt) {
        var e = {};

        for (var i in evt) {
            var attributeType = typeof evt[i];
            if (attributeType != 'function' && attributeType != 'object')
                e[i] = evt[i];
        }

        return e;
    },

    processEvent: function(evt) {
        var self = this;

        if (evt.type == 'mousedown')
            self.isMouseDown = true;
        
        if (self.isEventObservable(evt) || self.isMouseDown) {

            var trackingObject = {
                tid        : self.getId(),
                index      : this.index,
                x          : self.mousePosition.x,
                y          : self.mousePosition.y,
                time       : new Date().getTime() - self.recordingStartTime,
                raw        : self.copyEventObject(evt),
                type       : evt.type,
                id         : evt.target.id,
                targetType : evt.target.tagName? evt.target.tagName.toLowerCase(): null,
                value      : evt.target.value || evt.target.text,
                attrs      : (function(){
                    return self.getAttributes(evt.target);
                })(),
                classList: (function(){
                    return self.getClassess(evt.target);
                })()
            };

            // don't click your controls
            if(trackingObject.id != 'traquer-recorder'){

                trackingObject.selector = self.createSelector.call(trackingObject, self);

                // if selector is valid, collect trackingObject
                if(document.querySelectorAll(trackingObject.selector)){

                    delete trackingObject.classList;
                    delete trackingObject.attrs;
                    //delete trackingObject.targetType;

                    self.recordedEvents.push(trackingObject);
                    this.index++;

                    if(this.logging)
                        console.log(trackingObject);
                }
            }
        }

        // ... later remove mouseDown condition
        if(evt.type == 'mouseup')
            self.isMouseDown = false;
    },

    eventsScheduler: function() {
        var self = this;

        if (self.eventsInfo && self.eventsEmitted < self.eventsInfo.length) {
            var eventInfo = self.eventsInfo[this.eventsEmitted];
            var previousEventInfo = self.eventsInfo[this.eventsEmitted -1];
            var scheduleTime = previousEventInfo ? eventInfo.time - previousEventInfo.time : eventInfo.time;

            var fireTimeout = setTimeout(function() {
                self.eventEmitter(eventInfo);
                self.eventsEmitted++;
                self.eventsScheduler();
                clearTimeout(fireTimeout);
            }, scheduleTime);
        }
        else {
            self.isPlaying = false;
            self.removeFakeCursor();
        }
    },

    play: function(eventsInfo) {
        if (this.isPlaying)
            return;

        var similarity = this.getSimilarity(eventsInfo);

        if(similarity < 50)
            console.warn('[w] Current scenario is less than 50% similar to page you`re testing (' + similarity + ')');

        this.isPlaying = true;

        this.createFakeCursor();
        this.eventsEmitted = 0;
        this.eventsInfo = eventsInfo;
        this.eventsScheduler();
    },

    eventEmitter: function(eventInfo) {
        var self = this;

        if (eventInfo){
            var selector     = document.querySelector(eventInfo.selector),
                eventElement = selector ? selector : document.elementFromPoint(eventInfo.x, eventInfo.y), // fallback
                fakeCursor   = self.getFakeCursor(),
                events       = new Traquer.EventBase(self);

            fakeCursor.style.top  = eventInfo.y + 'px';
            fakeCursor.style.left = eventInfo.x + 'px';

            if(!selector){
                console.warn('[f] Cant find element by current selector, probably not there.', eventInfo.selector);
            }

            if(!this.previousElement){
                this.previousElement = eventElement.parentElement;
            }
            else {
                var isChild     = this.matchChild(this.previousElement, eventElement);
                var prevoff     = this.getOffset(this.previousElement);
                var curroff     = this.getOffset(eventElement);
                var box         = { x1: prevoff.x, x2: prevoff.x + prevoff.w, y1: prevoff.y, y2: prevoff.y + prevoff.h };
                var closeOffset = this.pointRectangleIntersection(curroff, box)

                if(closeOffset || isChild){
                    eventInfo.stopPropagationFlag = true;
                }

                this.previousElement = null;
            }

            var eventEmitter;

            switch(eventInfo.type) {
                case 'mousemove':
                case 'mouseenter':
                case 'mouseleave':
                case 'mouseover':
                case 'mousedown':
                case 'mouseup':
                case 'mouseout':
                case 'click':
                case 'dblclick':
                case 'contextmenu':
                    events.mouseEvents(eventInfo, eventElement);
                    break;
                case 'wheel':
                    events.wheelEvents(eventInfo, eventElement);
                    break;
                case 'DOMFocusIn':
                case 'DOMFocusOut':
                case 'focusin':
                case 'focus':
                case 'focusout':
                case 'blur':
                    events.focusEvents(eventInfo, eventElement);
                    break;
                case 'beforeinput':
                case 'input':
                case 'textinput':
                    events.inputEvents(eventInfo, eventElement);
                    break;
                case 'keypress':
                case 'keydown':
                case 'keyup':
                case 'nothing':
                    events.keyEvents(eventInfo, eventElement);
                    break;
                case 'change':
                    events.event(eventInfo, eventElement);
                    break;
                case 'selectstart':
                case 'selectionchange':
                    events.focusEvents(eventInfo, eventElement);  // was .selectionEvents
                    break;
                case 'scroll':
                case 'select':
                case 'DOMMouseScroll':
                case 'DOMActivate':
                case 'DOMSubtreeModified':
                case 'DOMCharacterDataModified':
                    events.UIEvents(eventInfo, eventElement);
                    break;
            }

            if(self.trackTarget){
                var moveEvent = new CustomEvent('move', { detail: { eventInfo: eventInfo, last: self.recordedEvents[self.recordedEvents.length - 1].time } });
                self.trackTarget.dispatchEvent(moveEvent);
            }
        }

        if(self.recordedEvents.indexOf(eventInfo) == self.recordedEvents.length -1){
            self.stop();
        }
    },

    getFakeCursor: function() {
        return this.fakeCursor || this.createFakeCursor();
    },

    createFakeCursor: function() {
        this.fakeCursor = document.createElement('div');

        this.fakeCursor.style.height       = '10px';
        this.fakeCursor.style.width        = '10px';
        this.fakeCursor.style.background   = 'red';
        this.fakeCursor.style.opacity      = '0.5';
        this.fakeCursor.style.display      = 'block';
        this.fakeCursor.style.position     = 'fixed';
        this.fakeCursor.style.borderRadius = '10px';
        this.fakeCursor.style.zIndex       = '2147483647';

        document.body.appendChild(this.fakeCursor);
    },

    removeFakeCursor: function() {
        if (this.fakeCursor) {
            document.body.removeChild(this.fakeCursor);
            delete this.fakeCursor;
        }
    },

    toggleStopPropagation: function(eventInfo, evt){
        var preventParents = ['mouseover', 'mouseenter', 'mouseleave', 'mouseout'];

        if(eventInfo.stopPropagationFlag && preventParents.indexOf(eventInfo.type) > -1 ){
            evt.stopPropagation();
        }
    },

    getAttributes: function(element){
        var attributes = [], i;

        for(i in element.attributes){
            if(element.attributes.hasOwnProperty(i)){
                
                if(element.attributes[i].name !== 'style' && element.attributes[i].value ){

                    // DO NOT match html in tags  (/<.*?[\s\S]*?>[\s\S]*?<\/.*>/g)
                    // DO NOT match urls          (/(http:).*/g
                    // DO NOT collect IDs
                    // DO NOT match data-         (/data-.*/g)

                    var htmlMatch = element.attributes[i].value.match(/<.*?[\s\S]*?>[\s\S]*?<\/.*>/g),
                        urlMatch  = element.attributes[i].value.match(/(http:).*/g),
                        dataMatch = element.attributes[i].name.match(/data-.*/g),
                        idMatch   = element.attributes[i].name == 'id';

                    if(!idMatch && (htmlMatch == null) && (urlMatch == null) && (dataMatch == null)) {
                        var attribute = element.attributes[i].name + '="' + element.attributes[i].value + '"';
                        attributes.push(attribute);
                    }
                }
            }
        }
        return attributes;
    },

    getClassess: function(element){
        var classes = [], i;

        for(i in element.classList){
            if(element.classList.hasOwnProperty(i)){
                classes.push(element.classList[i]);
            }
        }

        return classes;
    },

    getSelector: function(attrs, classList, value, id){
        var selectorString = '';
        
        if(attrs.length > 0){

            var i;
            for(i in attrs){
                if(attrs.hasOwnProperty(i)){

                    if(attrs[i] === 'value'){
                        selectorString += '[' + attrs[i] + '="' + value + '"]';
                    } 
                    else if (attrs[i] !== undefined)  {
                        var knownSelectors = attrs[i].match(/class/g) ||
                                             attrs[i].match(/selected/g) ||
                                             attrs[i].match(/over/g) ||
                                             attrs[i].match(/dirty/g) ||
                                             attrs[i].match(/selectable/g) ||
                                             attrs[i].match(/href/g) ||
                                             attrs[i].match(/valign/g) ||
                                             attrs[i].match(/role/g) ||
                                             attrs[i].match(/tabindex/g);

                        if(!knownSelectors){
                            selectorString += '[' + attrs[i] + ']';
                        }
                    }
                }
            }
        }

        if(classList.length > 0){

            var i;
            for(i in classList){

                if(classList.hasOwnProperty(i)){
                    var knownSelectors = classList[i].match(/selected/g) ||
                                         classList[i].match(/over/g) ||
                                         classList[i].match(/dirty/g) ||
                                         classList[i].match(/selectable/g) ||
                                         classList[i].match(/focused/g) ||
                                         classList[i].match(/focus/g);

                    if(!knownSelectors){

                        selectorString += '.' + classList[i];
                    }
                }
            }
        }

        if(id) {
            selectorString += '#' + id ;
        }

        return selectorString;
    },

    createSelector: function(traquer){
        var self             = this,
            selectorString   = self.targetType + traquer.getSelector(self.attrs, self.classList, self.value, self.id),
            firstFound       = document.querySelector(selectorString),
            selectedElements = document.querySelectorAll(selectorString),
            selectedElement;
        
        if(selectedElements.length > 1){

            var i;
            for(i in selectedElements){
                if(selectedElements.hasOwnProperty(i)){

                    var currentElement = selectedElements[i],
                        intersection;
                    
                    // Needs to be reconstcructed out of motions (x,y) pair
                    var currentBoundingBox = currentElement.getBoundingClientRect(),
                        motionsBoundingBox = { height: 10, left: traquer.mousePosition.x, top: traquer.mousePosition.y, width: 10 };

                    intersection = traquer.getIntersection(currentElement, motionsBoundingBox);
                    
                    if(intersection){
                        selectedElement = currentElement == firstFound ? currentElement.parentElement : currentElement;
                    }
                }
            }
        }

        if(selectedElement && selectedElement != firstFound){
            var attributes = traquer.getAttributes(selectedElement),
                classes    = traquer.getClassess(selectedElement);

            if(attributes.length && classes.length){
                selectorString = traquer.getSelector(attributes, classes, selectedElement.value, selectedElement.id) + ' > ' + selectorString ; 
            }
        }

        return selectorString;
    },

    getIntersection: function(firstElement, secondElement) {
        var boundingBoxA = firstElement.getBoundingClientRect();
        var boundingBoxB = secondElement.getBoundingClientRect ? secondElement.getBoundingClientRect() : secondElement;
        var intersecting = false;

        if((boundingBoxA.left <= (boundingBoxB.left + boundingBoxB.width) &&
            (boundingBoxB.left <= (boundingBoxA.left + boundingBoxA.width))) &&
            (boundingBoxA.top <= (boundingBoxB.top + boundingBoxB.height)) &&
            (boundingBoxB.top <= (boundingBoxA.top + boundingBoxA.height )))
                intersecting = true;

        return intersecting;
    },

    getOffset: function( el ) {
        var boundingClientRect = el.getBoundingClientRect(),
            x = boundingClientRect.left,
            y = boundingClientRect.top,
            w = boundingClientRect.width,
            h = boundingClientRect.height;

        return { x: x, y: y, w: w, h: h };
    },

    pointRectangleIntersection: function (p, r) {
        return p.x > r.x1 && p.x < r.x2 && p.y > r.y1 && p.y < r.y2;
    },

    matchChild: function(node, child) {
        var found = false,
            i;

        if(node && node.childNodes)
            for(i in node.childNodes){
                if(node.childNodes.hasOwnProperty(i)){
                    var currentChild = node.childNodes[i];

                    if(currentChild == child){
                        return true;
                    }
                    else
                        this.matchChild(currentChild, child);
                }
            }

        return found;
    },

    getSimilarity: function(eventsInfo){
        var elements = 0, percentage = 0, i;

        for(i in eventsInfo){
            if(eventsInfo.hasOwnProperty(i)){
                var eventInfo = eventsInfo[i],
                    similar = document.querySelector(eventInfo.selector);
                
                if(similar){
                    var style  = window.getComputedStyle(similar),
                        hidden = /*style.display == 'none' || */style.visibility == 'hidden';

                    if(!hidden)
                        elements++;
                }
            }
        }

        percentage = (elements / eventsInfo.length) * 100;
        
        return Math.round(percentage * 100) / 100;
    }
}