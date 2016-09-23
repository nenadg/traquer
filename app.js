// datalove <3
// dependencies
var http           = require('http'),
    express        = require('express'),
    app            = express(),
    path           = require('path'),
    favicon        = require('serve-favicon'),
    logger         = require('morgan'),
    methodOverride = require('method-override'),
    session        = require('express-session'),
    bodyParser     = require('body-parser'),
    multer         = require('multer'),
    secret         = Math.random().toString(36).substring(3, 12);
    
// configuration
app.set('port', process.env.PORT || 3008);
app.use(logger('dev'));
app.use(methodOverride());
app.use(session({ resave: true, saveUninitialized: true, secret: secret }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false /*true*/ }));
app.use(multer());
app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (res, req, next) => {
    res.header('X-XSS-Protection' ,  '1; mode=block');
    next(); 
});

var server    = http.createServer(app),
    io        = require('socket.io').listen(server, { log: false });
    
server.listen(app.get('port'), () => {
    console.log('Express server listening on port ' + app.get('port'));
});