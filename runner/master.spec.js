var path      = require('path'),
    webdriver =  require('selenium-webdriver'),
    jasmine   = require('jasmine-node');

process.env.PATH += path.delimiter + path.dirname(require('chromedriver').path);

var client    = new webdriver.Builder()
                .withCapabilities(webdriver.Capabilities.chrome())
                .build();
                
jasmine.getEnv().defaultTimeoutInterval = 10000;
jasmine.getEnv().addReporter(new jasmine.ConsoleReporter(console.log));

global.webdriver = webdriver;
global.client = client;

describe('Bulk tests...', function(){
    require('./definitions.spec.js');
});