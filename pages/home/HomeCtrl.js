/**
 *
 * An example login controller which uses the nereidAuth service to login.
 *
 * Since the URL of where the nereid app is running is unknown, the ability to
 * set the base path for the API calls is also shown in the form.
 *
*/

'use strict';

angular.module('myApp').controller('HomeCtrl', ['$scope', 'nereidAuth', function($scope, nereidAuth) {

    $scope.user = {
      email: '',
      password: ''
    };

    $scope.message = '';

    // Basic URL: In the case of a larger app this should probably done in
    // the initial configuration on your app.js when the module is first
    // defined. The apiBasePath configuration is just shown for testing from
    // the demo page.
    $scope.apiBasePath = 'http://localhost:5000';

    // For form to show error classes
    $scope.bad_credentials = false;

    // For form to show error classes
    $scope.bad_api_base_path = false;

    // Login success should initially be false
    $scope.login_success = false;

    $scope.logout = function() {
      nereidAuth.logoutUser();
    };

    $scope.submit = function() {
      nereidAuth.setapiBasePath($scope.apiBasePath);
      nereidAuth.login($scope.user.email, $scope.user.password)
        .success(function(data){
          $scope.bad_api_base_path = false;
          $scope.bad_credentials = false;
          $scope.login_success = true;
          if (data.message) {
            $scope.message = data.message;
          } else {
            $scope.message = 'Login Succesful';
          }
        })
        .error(function(data, status){
          $scope.login_success = false;
          if (status == 404) {
            // 404 indicates that the URL could not be reached. Perhaps the
            // credentials are correct, but could not connect to the server ?
            $scope.message = "Could not connect to the server";
            $scope.bad_api_base_path = true;
            $scope.bad_credentials = false;
            return;
          }
          $scope.bad_api_base_path = false;
          $scope.bad_credentials = true;
          if (data.message) {
            $scope.message = data.message;
          } else {
            $scope.message = 'Login Failed';
          }
        });
    };

}]);
