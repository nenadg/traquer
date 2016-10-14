"use strict";

Traquer.Heatmap = function(){
    if (!(this instanceof Traquer.Heatmap)) {
        return new Traquer.Heatmap();
    }

    this.traquer = Traquer.getInstance();
}

Traquer.Heatmap.prototype.make = function(){
    var self      = this,
        traquer   = self.traquer,
        events    = Array.prototype.slice.call(traquer.recordedEvents),
        heatmapEl = document.querySelector('.traquer-heatmap');

    if(!heatmapEl){
        heatmapEl = document.createElement('div');
        heatmapEl.className = 'traquer-heatmap';

        document.body.appendChild(heatmapEl);

        var buttons = ['<div id="traquer-heatmap-close" class="button close">Close</div>',
                       '<div id="traquer-heatmap-play" class="button play">Play</div>',
                      ].join('');
        heatmapEl.innerHTML = buttons;
    }

    var gradient = ["#1EE656", "#26E553", "#2EE550", "#37E54D", "#3FE54A", "#48E547", "#50E444", "#58E441", "#61E43E", "#69E43C", "#72E439", "#7AE336", 
                    "#82E333", "#8BE330", "#93E32D", "#9CE32A", "#A4E227", "#ACE225", "#B5E222", "#BDE21F", "#C6E21C", "#CEE119", "#D6E116", "#DFE113", 
                    "#E7E110", "#F0E10E", "#F0D811", "#F1CF15", "#F1C619", "#F2BE1D", "#F3B521", "#F3AC25", "#F4A329", "#F59B2D", "#F59230", "#F68934", 
                    "#F68038", "#F7783C", "#F86F40", "#F86644", "#F95D48", "#FA554C", "#FA4C4F", "#FB4353", "#FB3A57", "#FC315B", "#FD295F", "#FD2063", 
                    "#FE1767", "#FF0F6B"];

    var heatmapHtml = [], i, prevx = 0, prevy = 0, currentColor = gradient[0], increment = 0, width = 2, height = 2;

    events = events.sort(function (a, b) {   
        return a.x - b.x || a.y - b.y;
    });

    for(i in events){
        if(events.hasOwnProperty(i)){
            var currentEvent = events[i],
                x = currentEvent.x,
                y = currentEvent.y,
                previousBox,
                currentBox,
                intersection;

            if(prevx && prevy){
                previousBox  = { height: 2, width: 2, left: prevx, top: prevy };
                currentBox   = { height: 2, width: 2, left: x, top: y };
                intersection = self.getIntersection(currentBox, previousBox);

                if(intersection){
                    increment++
                    width++;
                    height++;
                } 
                else {
                    increment = 0;
                    width = 2;
                    height = 2;
                }

                if(increment > gradient.length -1)
                    increment = gradient.indexOf(gradient[gradient.length -1]);

                currentColor = 'rgba(' + self.hexToRgb(gradient[increment], 0.1) + ')';
            }  

            var heatPoint = [
                '<div class="traquer-heat-point" style="',
                'top: '        + (y - (height/2)) + 'px;',
                'left: '       + (x - (width/2)) + 'px;',
                'background: ' + currentColor + ';',
                'width: '      + width +  'px;',
                'height: '     + height + 'px; "></div>'
            ].join('');

            heatmapHtml.push(heatPoint);

            prevy = y;
            prevx = x;
        }
    }
    var k = performance.now();
    heatmapEl = traquer.replaceHtml(heatmapEl, heatmapEl.innerHTML + heatmapHtml.join(''));
    //heatmapEl.innerHTML += heatmapHtml.join('');
    console.log(performance.now() - k);
    self.bindClose();
    self.bindPlay();
}

Traquer.Heatmap.prototype.bindClose = function(){
    var close = document.querySelector('#traquer-heatmap-close'),
        heatmapEl = document.querySelector('.traquer-heatmap'),
        modalEl = document.querySelector('.traquer-modal');

    close.addEventListener('click', function(e){
        document.body.removeChild(heatmapEl);

        if(modalEl && modalEl.parentElement)
            modalEl.style.cssText = 'opacity: 1';
    });
}

Traquer.Heatmap.prototype.bindPlay = function(){
    var self    = this,
        traquer = self.traquer,
        play    = document.querySelector('#traquer-heatmap-play');

    play.addEventListener('click', function(e){
        traquer.play(traquer.recordedEvents);
    });
}

Traquer.Heatmap.prototype.getIntersection = function(currentBox, previousBox) {
    var intersecting = false;

    if((currentBox.left <= (previousBox.left + previousBox.width) &&
        (previousBox.left <= (currentBox.left + currentBox.width))) &&
        (currentBox.top <= (previousBox.top + previousBox.height)) &&
        (previousBox.top <= (currentBox.top + currentBox.height )))
            intersecting = true;

    return intersecting;
}

Traquer.Heatmap.prototype.hexToRgb = function(hex, opacity) {
    hex = hex.replace('#', '');
    var bigint = parseInt(hex, 16);
    var r = (bigint >> 16) & 255;
    var g = (bigint >> 8) & 255;
    var b = bigint & 255;

    return r + "," + g + "," + b + ',' + opacity;
}