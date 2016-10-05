window.addEventListener('load', function() {
    var recorder       = document.createElement('div');
    recorder.className = 'traquer-recorder';
    recorder.id        = 'traquer-recorder';
    recorder.title     = 'Record';
    var controls           = new Traquer.Controls();

    controls.loadStyles();

    recorder.addEventListener('click', controls.recording.bind(this, controls));

    document.body.appendChild(recorder);
});