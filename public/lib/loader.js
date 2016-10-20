document.addEventListener('DOMContentLoaded', function() {
    var recorder       = document.createElement('div');
    recorder.className = 'traquer-recorder';
    recorder.id        = 'traquer-recorder';
    recorder.title     = 'Record';
    
    var traquer        = new Traquer(),
        controls       = new Traquer.Controls(),
    	storage        = new Traquer.Storage();

    traquer.config     = {
        host: window.location.origin
    }

    controls.loadStyles();
 	
    recorder.addEventListener('click', controls.recording.bind(this, controls));

    document.body.appendChild(recorder);

    storage.hint();
});

window.addEventListener('hashchange', function(){
    var storage        = new Traquer.Storage();

    storage.hint();
});