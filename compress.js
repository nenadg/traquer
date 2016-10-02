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
        fileIn: files,
        fileOut: out,
        callback: function(err, min){
            if(err)
                console.log(err);
            
            console.log('[1] joined ' + files.length + ' files.');

            var gccCompressed = fs.readFileSync(out, 'utf8')
            gccCompressed     = gccCompressed;//'(function(){' + gccCompressed + '})();';

            fs.writeFile(out, gccCompressed, function(err) {

                new compressor.minify({
                    type: 'gcc',
                    fileIn: out,
                    fileOut: opt,
                    callback: function(err, min){
                        if(err)
                            console.log(err);

                        console.log('[2] gcc compressed at', opt);
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
            
            console.log('[2] yui css compressed ' + styles.length + ' files to ' + outcss);
        }
    });
});

var spin = function(message){
    var spinner = '|/-\\'.split(''), i = 0;
   return setInterval(function(){

      process.stdout.write(message + '\t\t\t\t\t\t [' + spinner[i] + '] \033[0G');

      if(i == spinner.length - 1)
         i = 0;

      i++;
   }, 50);
}