// fake Traquer obj
global.Traquer     = {};

var casesDirectory = './cases/',
    specsDirectory = './spec/',
    path           = require('path'),
    fs             = require('fs'),
    lzw            = new require('../public/lib/lzw.js')(),
    cases          = [];



var Generator = function(){
    if (!(this instanceof Generator)) {
        return new Generator();
    }
}

Generator.prototype.factory = {
    defineCase  : function() { return 'it("{{name}}", function (done) { {{inner}} });' },
    findElement : function() { return 'webdriver.By.xpath("{{xpath}}");' }, //'client.findElement(webdriver.By.xpath("{{xpath}}"));' },
    runs        : function() { return 'runs(function () { {{inner}} })' },
    waits       : function() { return 'waitsFor(function(){ {{inner}} }, "waiting {{el}} ...", 10);' },
    get         : function() { return 'client.get("{{location}}");' }
}

Generator.prototype.create = function(){
    var self  = this,
        names = [],
        parsedCases = -1,
        i;

    fs.readdir(path.join(__dirname, casesDirectory), (err, files) => {
        if(err)
            throw err;

        files.forEach(file => {
            cases.push(file);
        });

        parsedCases = cases.length;

        for(i in cases){
            if(cases.hasOwnProperty(i)){
                var tcase          = cases[i],
                    definitionName = path.join(__dirname, specsDirectory + tcase + '.spec.js');

                fs.readFile(path.join(__dirname, casesDirectory + tcase), 'utf8', 
                    (function(definitionName, index, err, compressed) {
                        if (err) throw err;
                            
                        var decompressed = lzw.decode(compressed),
                            frecord      = decompressed,
                            location     = frecord.location.href,
                            records      = frecord.records,
                            factory      = self.factory,
                            spec         = '',
                            inner        = '',
                            testCase     = '',
                            allowedTypes = ['click', 'mouseover', 'mouseout', 'keypress'],
                            j;
                            
                        var caseOne = factory.defineCase().replace('{{name}}', 'Load page');

                        testCase = 'describe("' + i + ' test case", function(){';

                        if(index == 0){
                            var caseOneInner = '\n\t' + factory.get().replace('{{location}}', location) + '\n';
                            caseOneInner += '\tsetTimeout(function(){ expect(true).toBe(true); done(); }, 3000);\n';
                            caseOne = caseOne.replace('{{inner}}', caseOneInner);
                            testCase += '\n' + caseOne + '\n';
                        }

                        for(j in records){
                            if(records.hasOwnProperty(j)){
                                var record   = records[j],
                                    type     = record.type;
                                
                                // don't go for uninteresting event types
                                if(allowedTypes.indexOf(type) == -1)
                                    continue;

                                // don't go if selector is missing
                                if(!record.selector)
                                    continue;

                                var selector    = record.selector.replace(/\"/igm, '\''),
                                    definedCase = factory.defineCase().replace('{{name}}', 'Find el_' + j + '');

                                inner += '\n\t';
                                inner += ['var locator = ' + factory.findElement().replace('{{xpath}}', selector),
                                          'var el = client.findElement(locator);',
                                          (type == 'click' ? 'el.click();' :''),
                                          (type == 'keypress' ? 'el.sendKeys(1) ' : ''),
                                          'expect(el).toBeTruthy(); done();\n'
                                          //'\t\twaitsFor(\'\', function(){ expect2(el).toExist();  }, 20);', //

                                         ].join('\n\t');

                                definedCase = definedCase.replace('{{inner}}', inner);

                                testCase += '\n' + definedCase + '\n';
                                inner = '';
                            }
                        }
                        
                        //testCase += factory.defineCase().replace('{{name}}', 'Cleanup').replace('{{inner}}', '\nclient.quit();' );

                        // close case
                        testCase += '\n});';

                        var specName = definitionName;

                        fs.writeFile(specName, testCase, 'utf8', function(err){

                            parsedCases--;

                            if (err) throw err;
                            names.push(specName);
                            
                            console.log('Saved spec - ', specName);
                        });
                }).bind(null, definitionName, i));
            }
        }

    });

    var requires = [];

    var parseInterval = setInterval(function(){
        
        if(parsedCases == 0){

            clearInterval(parseInterval);
            for(i in names){
                if(names.hasOwnProperty(i)){
                    var name = names[i];

                    requires.push('require("' + name + '");\n');
                }
            }

            fs.writeFile(path.join(__dirname, 'definitions.spec.js'), requires.join(''), 'utf8', function(err){
                if (err) throw err;
                    console.log('Definitions spec updated.');
            });
        }
    }, 200);
}

module.exports = new Generator();