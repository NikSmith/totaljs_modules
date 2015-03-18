var auth = MODULE('auth');
framework.onAuthorization = function(req, res, flags, cb){
    auth.onAuthorization(req, res, flags, cb);
};