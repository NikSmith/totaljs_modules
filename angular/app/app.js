var app = angular.module("app",['ngRoute']);
app.config(['$httpProvider', function($httpProvider) {
    $httpProvider.defaults.headers.common["X-Requested-With"] = 'XMLHttpRequest';
}]);
app.config(function($routeProvider,$locationProvider) {
    //$locationProvider.html5Mode(true);
    $routeProvider
        .when('/default', {
            templateUrl: 'partials/test.html',
            controller: 'default'
        })
        .otherwise("/default")
});