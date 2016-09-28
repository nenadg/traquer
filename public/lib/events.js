"use strict";

/**
 * EventBase
 *
 **/
var EventBase = function(traquer) {
    if (!(this instanceof EventBase)) {
        return new EventBase();
    }

    if(!traquer || !(traquer instanceof Traquer))
        throw new Error('Can\'t instantiate EventBase without Traquer instance!');

    this.traquer = traquer;
}

EventBase.prototype = {
    mouseEvents: function(eventInfo, element) {
        var evt = new MouseEvent(eventInfo.type, eventInfo.raw);
        this.traquer.toggleStopPropagation(eventInfo, evt);
        element.dispatchEvent(evt);
    },

    wheelEvents: function(eventInfo, element) {
      var evt = new WheelEvent('wheel', eventInfo.raw);

      // find first scrollable parent
      while (element.scrollHeight <= element.clientHeight && element.parentNode)
        element = element.parentNode;

      element.dispatchEvent(evt);
    },

    focusEvents: function(eventInfo, element) {
     

      if(!eventInfo)
        return;
    
      var type = (eventInfo.type.indexOf('FocusIn') > -1) ? 'focus' : 'blur',
        either = (eventInfo.type.indexOf('FocusIn') > -1) || (eventInfo.type.indexOf('FocusOut') > -1);

      // dispatch default event first
      if(either){
        var eitherTimeout = setTimeout(function(){
          element.dispatchEvent(new FocusEvent(eventInfo.type, element));
          clearTimeout(eitherTimeout);
        }, 1);
      }

      var evt = new FocusEvent(eventInfo.type, eventInfo.raw);

      element.dispatchEvent(evt);
     
    },

    inputEvents: function(eventInfo, element){
        var inputEvent = (typeof InputEvent != 'undefined') ? InputEvent : Event;
        var evt = new inputEvent(eventInfo.type, eventInfo.raw);
        element.dispatchEvent(evt);
    },

    textEvents: function(eventInfo, element){
      var evt = document.createEvent('TextEvent');
      var rawEvent = eventInfo.raw;
      var character = rawEvent.code && (rawEvent.code.indexOf('Key') > -1)? rawEvent.code.substr(3): eventInfo.value;

      //console.log(character);
      evt.initTextEvent('textInput', true, true, null, character, 0, "en-US");

      return evt;
    },

    keyEvents: function(eventInfo, element){
      var event = eventInfo.type;
      var rawEvent = eventInfo.raw;
      var character = rawEvent.code || rawEvent.keyCode;
      var evt;
      var allmatch = /^[a-z0-9!"#$%&'()*+,.\/:;<=>?@\[\] ^_`{|}~-]*$/i;

      var textmatch = rawEvent.code && (rawEvent.code.indexOf('Key') > -1) ; // ascii crap //rawEvent.which && .match(/^[a-z0-9!"#$%&'()*+,.\/:;<=>?@\[\] ^_`{|}~-]*$/i);

      /*if( (event === 'keyup' || event === 'keydown' || event === 'keypress') && textmatch){
        textmatch = rawEvent.code.substr(3);
        console.log('keyEvents:text');
        // NOTE: simulate key events via text events
        // it's either a bug as reported here:
        // http://stackoverflow.com/questions/8942678/keyboardevent-in-chrome-keycode-is-0/12522752#12522752
        // or later added as security feature
        if(!element.keyStack){
          element.value = '';
          evt = this.traquer.fakeEvents.textEvents(eventInfo, element);
          element.keyStack = [];
          element.keyStack.push(textmatch);
        }
        else if(element.keyStack.indexOf(textmatch) == -1){
          evt = this.traquer.fakeEvents.textEvents(eventInfo, element);

          element.keyStack.push(textmatch);
        }
        //console.log(evt);
        //else
          //evt = new CustomEvent(rawEvent);
      }*/
      //else
        //evt = new CustomEvent(rawEvent);

      if(!textmatch){


        evt = new KeyboardEvent(event, { bubbles: true, view: null });
        evt.__fake = {};
        for(var i in rawEvent){
          if(i !== 'isTrusted' && rawEvent.hasOwnProperty(i)){
            var val = rawEvent[i];
            var fn = function(k){

              return this.__fake['sub' + k];
            }.bind(evt, i);


            Object.defineProperty(evt, i,
              {
                get: fn
              });

            evt.__fake['sub' +i ] = val;
          }
        }

        /*evt.__fake.subcharCode = character;
        evt.__fake.subkeyIdentifier = rawEvent.keyIdentifier;
        evt.__fake.subwhich = rawEvent.which;
        evt.__fake.subtarget = element;
        evt.__fake.subcode = rawEvent.code;*/


        /*Object.defineProperty(evt, 'charCode', {get:function(){return this.charCodeVal;}});
        Object.defineProperty(evt, 'keyCode', {get:function(){return this.charCodeVal;}});
        Object.defineProperty(evt, 'keyIdentifier', {get:function(){return this.keyIdentifierVal;}});
        Object.defineProperty(evt, 'which', {get:function(){return this.whichVal;}}); */
        //evt.charCodeVal = character;
        //evt.keyIdentifierVal = rawEvent.keyIdentifier;
        //evt.whichVal = rawEvent.which;

        //console.log(evt);
      }
      else {

        evt = new KeyboardEvent(event);
      }

      element.dispatchEvent(evt);
    },

    UIEvents: function(eventInfo, element) {
      var evt = new UIEvent(eventInfo.type, eventInfo.raw);
      console.log(eventInfo.type, evt)
      element.dispatchEvent(evt);
    },

    selectionEvents: function(eventInfo, element) {
      // TODO
      /*var range = document.createRange();

      range.selectNode(arguments[0][2]);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);*/

      var evt = focusEvents(eventInfo, element);
      element.dispatchEvent(evt);
    },

    event: function(eventInfo, element){
      var evt = new Event(eventInfo.type, eventInfo.raw);
      element.dispatchEvent(evt);
    }
}