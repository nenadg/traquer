var fs         = require('fs'),
    compressor = require('node-minify'),
    walk       = require('walk'),
    src        = 'public/src',
    out        = 'public/js/out.joined.js',
    opt        = 'public/js/opt.min.js',
    walker     = walk.walk(src, { followLinks: false }),
    files      = [];

walker.on('file', function(root, stat, next) {
    var parts = stat.name.split('.'),
        ext   = parts[parts.length - 1];

    if(ext === 'js')
        files.push(root + '/' + stat.name);

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














////////////////
    //jsfiles = JSON.parse(fs.readFileSync('frontend/dependencies/scripts.json', 'utf8')),
    //cssfiles = JSON.parse(fs.readFileSync('frontend/dependencies/styles.json', 'utf8'));
    

/*fs.writeFile('variant', variant, function(err) {
    if(err) {
        return console.log(err);
    }
    switch(variant){
        case 'refresh':
            // TODO: add unalocated files to dependency list
        break;
        case 'dev':
            console.log('Development variant passed.');
        break;
        case 'prod':
            console.log('Production variant passed.');
            console.log('Compressing files...');

            new compressor.minify({
                type: 'yui-css',
                fileIn: cssfiles.list,
                fileOut: 'frontend/release/scrm.min.css',
                callback: function(err, min){
                    if(err)
                        console.log(err);

                    console.log("Css compressed and saved at ", '/frontend/release/scrm.min.css');
                }
            });
             
            new compressor.minify({
                type: 'gcc',
                language: 'ECMASCRIPT5',
                fileIn: jsfiles.list,
                fileOut: 'frontend/release/scrm.min.js',
                callback: function(err, min){
                    if(err)
                        console.log(err);
                    
                    console.log("Scripts generated and saved at ", '/frontend/release/scrm.min.js');
                }
            });
        break;
    }
});*/