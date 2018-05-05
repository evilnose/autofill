const angular = require('angular');

let app = angular.module('autofill');
app.controller('mainCtrl', require('./main.controller'));
app.controller('homeCtrl', require('./home.controller'));
app.controller('formCtrl', require('./form.controller'));

