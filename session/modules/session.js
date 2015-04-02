/**
 * @module Session
 * @version v1.01
 * @author Peter Å irka
 */

var redis = require('redis');
var client = redis.createClient();

var events = require('events');
var SUGAR = 'XY1';
var USERAGENT = 11;
var VERSION = 'v1.01';


function Session() {
    this.options = null;

    this.onRead = function(id, fnCallback) {
        client.get('session_' + id, function(err,reply){
            fnCallback(err ? {} : reply === null ? {} : JSON.parse(reply.toString()));
        });
    };

    this.onWrite = function(id, value) {
        var self = this;
        client.set('session_' + id, JSON.stringify(value),function(err){
            if (!err){
                client.expire('session_' + id, self.options.timeout,function(){});
            }
            return self;
        });
    };
}

Session.prototype = new events.EventEmitter;

Session.prototype._read = function(req, res, next) {
    var self = this;
    var id = req.cookie(self.options.cookie) || '';

    if (id.length === 0) {
        self._create(res, req, next);
        return self;
    }

    var obj = framework.decrypt(id, self.options.secret);
    if (obj === null) {
        self._create(res, req, next);
        return self;
    }

    if ('ssid_' + obj.sign !== self._signature(obj.id, req)) {
        self._create(res, req, next);
        return self;
    }

    req._sessionId = obj.id;
    req._session = self;

    self.onRead(obj.id, function(session) {
        req.session = session || {};
        next();
    });

    return self;
};

Session.prototype._write = function(id, obj) {
    var self = this;
    if (self.onWrite !== null)
        self.onWrite(id, obj);
    return self;
};

Session.prototype._signature = function(id, req) {
    return id + '|' + req.ip.replace(/\./g, '') + '|' + (req.headers['user-agent'] || '').substring(0, USERAGENT).replace(/\s|\./g, '');
};
Session.prototype._create = function(res, req, next) {

    var self = this;
    var id = utils.GUID(10);
    var obj = { id: 'ssid_' + id, sign: self._signature(id, req) };
    var json = framework.encrypt(obj, self.options.secret);

    req._sessionId = obj.id;
    req._session = self;
    req.session = {};

    if (!res) {
        next();
        return;
    }

    if (res.statusCode)
        res.cookie(self.options.cookie, json);

    next();
    return self;
};

var session = new Session();

module.exports.name = 'session';
module.exports.version = VERSION;
module.exports.instance = session;


module.exports.install = function(framework, options) {
    var self = this;

    SUGAR = (framework.config.name + framework.config.version + SUGAR).replace(/\s/g, '');
    session.options = Utils.extend({ cookie: '__ssid', secret: 'N84', timeout: '5 minutes' }, options, true);

    framework.middleware('session', function(req, res, next) {

        if (res.statusCode) {
            // classic HTTP
            res.once('finish', function() {
                session._write(req._sessionId, req.session);
            });
        } else {
            // websocket
            res.socket.on('close', function() {
                session._write(req._sessionId, req.session);
            });
        }
        session._read(req, res, next);

    });
};
module.exports.uninstall = function(framework, options) {
    framework.removeListener('request', delegate_request);
    framework.uninstall('middleware', 'session');
    session = null;
    client.end();
};