var fs         = require('fs'),
    compressor = require('node-minify'),
    walk       = require('walk'),
    src        = 'public/lib',
    out        = 'public/lib/traquer.joined.js',
    opt        = 'public/traquer.min.js',
    outcss     = 'public/traquer.min.css',
    walker     = walk.walk(src, { followLinks: false }),
    files      = [],
    styles     = [];

walker.on('file', function(root, stat, next) {
    var parts = stat.name.split('.'),
        ext   = parts[parts.length - 1];

    if(ext === 'js')
        files.push(root + '/' + stat.name);

    if(ext == 'css')
        styles.push(root + '/' + stat.name);

    next();
});

walker.on('end', function() {
    spin('Compressing');

    new compressor.minify({
        type: 'no-compress',
        fileIn: recompose(files),
        fileOut: out,
        callback: function(err, min){
            if(err)
                console.log(err);
            
            console.log('[1] joined ' + files.length + ' js files.');

            var gccCompressed = fs.readFileSync(out, 'utf8')
            gccCompressed     = gccCompressed;

            fs.writeFile(out, gccCompressed, function(err) {

                new compressor.minify({
                    type: 'yui-js',
                    fileIn: out,
                    fileOut: opt,
                    callback: function(err, min){
                        if(err)
                            console.log(err);

                        console.log('[2] yui-js compressed ' + files.length + ' js files to', opt);
                        fs.unlink(out);
                        process.exit();
                    }
                });
            });
        }
    });

    new compressor.minify({
        type: 'yui-css',
        fileIn: styles,
        fileOut: outcss,
        callback: function(err, min){
            if(err)
                console.log(err);
            
            console.log('[2] yui-css compressed ' + styles.length + ' css files to', outcss);
        }
    });
});

var recompose = function(files){
    var traquer = files.filter(function(c){ if(c.indexOf('traquer.js') > -1) return c; })[0],
        loader  = files.filter(function(c){ if(c.indexOf('loader.js') > -1) return c; })[0],
        adequate = [], i;

    for(i in files){
        if(files.hasOwnProperty(i))
            if(files[i].indexOf('traquer') == -1 &&
                files[i].indexOf('loader') == -1 ){
                    adequate.push(files[i]);
                }
    }

    if(!traquer || !loader){
        console.log('[e] core files missing.');
        process.exit();
    }

    adequate.unshift(traquer);
    adequate.push(loader);

    return adequate;
}

var spin = function(message){
    var spinner = '|/-\\'.split(''), i = 0;
   return setInterval(function(){

      process.stdout.write(message + '\t\t\t\t\t\t [' + spinner[i] + '] \033[0G');

      if(i == spinner.length - 1)
         i = 0;

      i++;
   }, 50);
}