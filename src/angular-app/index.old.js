import angular from 'angular';
import ngRoute from 'angular-route';
// import dropdown from 'angular-ui-bootstrap/src/dropdown';
import './assets/scss/app.scss';

// import 'bootstrap/js/dist/util';
// import 'bootstrap/js/dist/dropdown';

// var app = angular.module('autofill', [ngRoute, 'ui.bootstrap']);
//
// app.config(function($routeProvider, $locationProvider) {
//     $routeProvider
//         .when('/', {
//             template: require('./pages/home.html'),
//         })
//         .when('/form', {
//             template : require('./pages/form.html'),
//         })
//         .otherwise({
//             redirect: '/',
//         });
//     $locationProvider.html5Mode(true);
// });
//
// app.controller('NavBarCtrl', function NavBarCtrl($scope) {
//     $scope.isCollapsed = true;
// });

angular.module('ui.bootstrap.demo', ['ui.bootstrap']).controller('AlertDemoCtrl', function ($scope) {
    $scope.alerts = [
        { type: 'danger', msg: 'Oh snap! Change a few things up and try submitting again.' },
        { type: 'success', msg: 'Well done! You successfully read this important alert message.' }
    ];

    $scope.addAlert = function() {
        $scope.alerts.push({msg: 'Another alert!'});
    };

    $scope.closeAlert = function(index) {
        $scope.alerts.splice(index, 1);
    };
});

// require('./controllers.old/controller-index');
// require('./directives.old/directive-index');
// require('./services');
