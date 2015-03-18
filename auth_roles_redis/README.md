### /controllers/default.js

```javascript
exports.install = function(framework) {
	framework.route('/login', login, ['unauthorize','@guest']);
	framework.route('/logout', logout, ['authorize','@admin','@moderator']);
	framework.route('/', view, ['authorize','@guest','@admin','@moderator']);
};

function login() {

	var self = this;
    var user = {
        id: 111,
        login: "admin",
        pass: "pass",
        roles: "admin"
    };
    MODULE('auth').login(self,user.id,user,function(){
        self.plain("Login->Ok!");
    });

}

function logout() {

    var self = this;
    MODULE('auth').logout(self);
    self.redirect("/");

}

function view() {
	var self = this;
    self.view('index');
}

```