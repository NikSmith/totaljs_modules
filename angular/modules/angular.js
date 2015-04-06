var fs = require('fs');
var ANGULAR_COMPILED = "";

exports.install = function(framework) {
    bootstrap();
    framework.on('controller-render-head', event_render_head);
};
exports.uninstall = function(framework) {
    framework.removeListener('controller-render-head', event_render_head);
};

function event_render_head(controller){
    var self = controller;
    if (!self.repository['$head']){
        self.repository['$head'] = '';
    }
    self.repository['$head'] += '<script type="text/javascript" src="/js/application.js"></script>';
}
function bootstrap(){
    ANGULAR_COMPILED = "";
    load_files_in_dir("./app/commons/",function(commons){
        ANGULAR_COMPILED += commons;
        fs.readFile("./app/app.js", "utf8", function (err, data) {
            if (err)
                return;
            ANGULAR_COMPILED += data;
            load_files_in_dir("./app/directives/",function(directives){
                ANGULAR_COMPILED += directives;
                load_files_in_dir("./app/filters/",function(filters){
                    ANGULAR_COMPILED += filters;
                    load_files_in_dir("./app/services/",function(services){
                        ANGULAR_COMPILED += services;
                        load_files_in_dir("./app/controllers/",function(controllers) {
                            ANGULAR_COMPILED += controllers;
                            fs.readFile("./app/angular.min.js", "utf8", function (err, data) {
                                if (err)
                                    return;
                                ANGULAR_COMPILED = utils.minifyScript(data+ANGULAR_COMPILED);
                                fs.writeFile(framework.directory+'/public/js/application.js', ANGULAR_COMPILED, function (err) {});
                            });
                        });
                    });
                });
            });
        });
    });
}
function load_files_in_dir(dir,cb){
    var code = "";
    fs.readdir(dir, function(err,files){
        if (err)
            return cb("");

        var ln = files.length;
        if (!ln)
            return cb("");

        (function iterator(x){
            fs.readFile(dir+files[x], "utf8", function (err, data) {
                if (!err){
                    code+= data;
                }
                if (x<ln-1){
                    x++;
                    iterator(x);
                }
                else {
                    cb(code);
                }
            });
        })(0);
    });
}