var events = require('events');
var SUGAR = 'AtH101s84';
var USERAGENT = 20;

var redis = require("redis");


function Auth(){
    this.options = {
        cookie: '__user',
        secret: 'a4e13bCbb9',
        expireSession: 60*60, // Secs
        expireCookie: 10, // Days
        autoLogin: true
    };
}
Auth.prototype = new events.EventEmitter;
Auth.prototype.onAuthorization = function(req, res, flags, cb){
    var self = this;
    var client = redis.createClient();
    var options = self.options;
    var cookie = req.cookie(options.cookie) || '';

    var agent = req.headers['user-agent'].substring(0, USERAGENT).replace(/\s/g, '');
    if (!agent){
        return cb(false);
    }

    var value = framework.decrypt(cookie, options.secret, false);
    if (value === null || value.length === 0) {
        return cb(false);
    }

    var arr = value.split('|');

    // Проверям подпись
    if (arr[1] !== SUGAR) {
        return cb(false);
    }

    // Запрашиваем данные из сессии
    client.hgetall("user::"+arr[0],function(err,user){
        if (err || !user){
            return cb(false);
        }

        var roles = user.roles.split(",");
        var ln = roles.length;
        for (var i=0; i<ln;i++){
            flags.push("@"+roles[i]);
        }

        // Проверям IP и user-agent, если оба не совпадают, то отказываем в доступе
        /*if ((!user.ip || user.ip.indexOf(req.ip) === -1) && (!user.agent || user.agent.indexOf(agent) === -1)){
         return cb(false);
         }*/
        cb(true,user);
    });
};
Auth.prototype.login = function(controller,id,user,cb){
    id = id.toString();
    var agent = controller.req.headers['user-agent'].substring(0, USERAGENT).replace(/\s/g, '');
    if (!agent){
        return cb(false);
    }

    var self = this;

    var client = redis.createClient();
    client.hgetall("user::"+id,function(err,_user){
        if (err){
            return cb(false);
        }

        if(!user.roles){
            user.roles = "guest";
        }
        // Проверяем имеющиеся IP и при необходимости добавляем текущий
        if (_user && _user.ip){
            if (_user.ip.indexOf(controller.req.ip) == -1){
                user.ip = _user.ip+","+controller.req.ip;
            }
        }
        else {
            user.ip = controller.req.ip;
        }

        if (_user && _user.agent){
            if (_user.agent.indexOf(agent) == -1){
                user.agent = _user.agent+","+agent;
            }
        }
        else {
            user.agent = agent;
        }

        client.hmset("user::"+id,user,function(err){
            if (!err){
                client.expire("user::"+id, self.options.expireSession);
                self.emit('login', id, user);
                self._writeOK(id, controller.req, controller.res);
            }
            client.end();
            cb(true);
        });
    });
};
Auth.prototype.logout = function(controller){
    var self = this;
    var options = self.options;
    var cookie = controller.req.cookie(options.cookie) || '';


    var agent = controller.req.headers['user-agent'].substring(0, USERAGENT).replace(/\s/g, '');
    if (!agent){
        return;
    }

    var value = framework.decrypt(cookie, options.secret, false);
    if (value === null || value.length === 0) {
        return;
    }

    var arr = value.split('|');

    self._writeNO(controller.res);
    self.emit('logoff', arr[0], arr[0] || null);

    return self;
};
Auth.prototype._writeOK = function(id,req,res){
    var self = this;
    var value = id + '|' + SUGAR + '|' + req.headers['user-agent'].substring(0, USERAGENT).replace(/\s/g, '') + '|' + req.ip + '|';
    res.cookie(self.options.cookie, framework.encrypt(value, self.options.secret), new Date().add('d', self.options.expireCookie));
    return self;
};
Auth.prototype._writeNO = function(res) {
    var self = this;
    res.cookie(self.options.cookie, '', new Date().add('y', -1));
    return self;
};

var auth = new Auth();

module.exports = auth;
module.exports.name = module.exports.id = 'auth';
module.exports.version = '1.00';