var mysql = require('mysql-libmysqlclient');

/*  Add to config file:
==========================================================
mysqlDB                         : database
mysqlUser                       : root
mysqlPassword                   : pass
mysqlHost                       : host
*/

var host = framework.config.mysqlHost,
    user  = framework.config.mysqlUser,
    password  = framework.config.mysqlPassword,
    database = framework.config.mysqlDB;

framework.database = function(cb) {
    var connection = mysql.createConnectionSync();
    connection.initSync();
    connection.setOptionSync(mysql.MYSQL_SET_CHARSET_NAME,"utf8");
    connection.realConnectSync(host,user,password,database);

    return cb(connection);
};