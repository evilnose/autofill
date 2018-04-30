import angular from 'angular';
import ngRoute from 'angular-route';

var app = angular.module('autofillApp', [ngRoute]);

app.config(function($routeProvider, $locationProvider) {
    $routeProvider
        .when('/', {
            template: require('./home/home.html'),
        })
        .when('/form', {
            template : require('./form/form.html'),
        })
        .otherwise({
            redirect: '/',
        });
    $locationProvider.html5Mode(true);
});

app.controller('mainCtrl', function ($scope) {
    $scope.name = "Gary";
});
