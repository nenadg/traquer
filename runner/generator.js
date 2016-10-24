// fake Traquer obj
global.Traquer     = {};

var casesDirectory = './runner/cases/',
    specsDirectory = './spec/',
    path           = require('path'),
    fs             = require('fs'),
    lzw            = new require('../public/lib/lzw.js')(),
    cases          = [];

fs.readdir(casesDirectory, (err, files) => {
    if(err)
        throw err;

    files.forEach(file => {
        cases.push(file);
    });
})

var Generator = function(){
    if (!(this instanceof Generator)) {
        return new Generator();
    }
}

Generator.prototype.factory = {
    defineCase  : function() { return 'it("{{name}}", function (done) { {{inner}} });' },
    findElement : function() { return 'webdriver.By.xpath("{{xpath}}");' }, //'client.findElement(webdriver.By.xpath("{{xpath}}"));' },
    runs        : function() { return 'runs(function () { {{inner}} })' },
    waits       : function() { return 'waitsFor(function(){ {{inner}} }, "waiting {{el}} ...", 1000);' },
    get         : function() { return 'client.get("{{location}}");' }
}

Generator.prototype.create = function(){
    var self  = this,
        names = [],
        i;

    for(i in cases){
        if(cases.hasOwnProperty(i)){
            var tcase          = cases[i],
                definitionName = path.join(__dirname, specsDirectory + tcase + '.spec.js');
            
            names.push(definitionName);

            fs.readFile(casesDirectory + tcase, 'utf8', (err, compressed) => {
                if (err) throw err;
                
                var decompressed = lzw.decode(compressed),
                    frecord      = decompressed,
                    location     = frecord.location.href,
                    records      = frecord.records,
                    factory      = self.factory,
                    spec         = '',
                    inner        = '',
                    testCase     = '',
                    j;

                

                inner += '\n\t' + factory.get().replace('{{location}}', location) + '\n';

                for(j in records){
                    if(records.hasOwnProperty(j)){
                        var record   = records[j],
                            selector = record.selector.replace(/\"/igm, '\'');

                        var definedCase = factory.defineCase().replace('{{name}}', 'el_' + j);

                        inner += '\n\t';
                        inner += 'var el_' + j + ' = ' + factory.findElement().replace('{{xpath}}', selector);
                        inner += '\n\t';

                        var innerWait = factory.waits().replace('{{inner}}', '\n\t\treturn client.findElement(el_' + j + ') != undefined; ')
                                                       .replace('{{el}}', 'el_' + j);

                        inner += '\n\t';
                        inner += innerWait;
                        inner += '\n\t';

                        var innerRun = 'expect(el_' + j + ').toBe(true);';

                        inner += '\n\t';
                        inner += factory.runs().replace('{{inner}}', innerRun);
                        inner += '\n';

                        definedCase = definedCase.replace('{{inner}}', inner);

                        testCase += '\n' + definedCase + '\n';
                        inner = '';
                    }
                }

                /*inner += ['\n\twaitsFor(function () {\n',
                        '\t\treturn true;\n',
                '\t}, \'So we know page is loaded\', 2000);\n'].join('');*/

                
                
                fs.writeFile(definitionName, testCase, 'utf8', function(err){
                    if (err) throw err;
                    console.log('It\'s saved!');
                });
            });
        }
    }

    var requires = [];

    for(i in names){
        if(names.hasOwnProperty(i)){
            var name = names[i];

            requires.push('require("' + name + '");');
        }
    }

    fs.writeFile(path.join(__dirname, 'definitions.spec.js'), requires.join(''), 'utf8', function(err){
        if (err) throw err;
            console.log('Definitions spec updated.');
    });


}

module.exports = new Generator();