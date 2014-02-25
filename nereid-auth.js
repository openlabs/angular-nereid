/**
@fileOverview

@toc

*/

'use strict';

angular.module('openlabs.angular-nereid-auth', ['base64'])
  .factory('nereidAuth', ['$http', '$base64', function ($http, $base64) {

    // If the nereid application is listening on a different address than the
    // root path from where the angular app was server, then this needs to be
    // set using setApiBasePath('https://api.mysite.com') without the trailing
    // slash.
    var apiBasePath = '';

    // The endpoint where the login POST requests must be sent
    var loginTokenEndpoint = '/login/token';

    // The endpoint from which the user information can be obtained
    var userInfoEndpoint = '/me';

    // The token for Token based authentication.
    //
    // Usually cached in localStorage
    var token = localStorage.getItem('token');

    // Cache for the user information as sent by the userInfoEndpoint
    var user = {};

    var setHeaders = function (token) {
      if (!token) {
        delete $http.defaults.headers.common.Authorization;
        return;
      }
      $http.defaults.headers.common.Authorization = 'Token ' + token.toString();
    };

    var refreshUserInfo = function () {
      return $http.get(apiBasePath + userInfoEndpoint)
        .success(function(data) {
          angular.extend(user, data);
        });
    };

    if (token) {
      setHeaders(token);
      // Get the user information
      refreshUserInfo()
        .error(function() {
          logoutUser();
        });
    }

    var setToken = function (token) {
      if (!token) {
        localStorage.removeItem('token');
      } else {
        localStorage.setItem('token', token);
      }
      setHeaders(token);
    };

    var logoutUser = function () {
      // Clear the token
      setToken(null);
      user = {};
    };

    /*
     *
     * Send the credentials in a Basic request and acquire a token
     *
     */
    var login = function(email, password) {
      var basic_auth = $base64.encode(email + ':' + password);
      return $http.post(
        apiBasePath + loginTokenEndpoint, {},
        {
          headers: {
            'Authorization': 'Basic ' + basic_auth,
            'X-Requested-With': 'XMLHttpRequest'
          }
        }
      )
      .success(function(data) {
        setToken(data.token);
        refreshUserInfo();
      })
      .error(function() {
        logoutUser();
      });
    };

    //public methods & properties
    var self = {
      setLoginEndpoint: function(new_end_point) {
        loginTokenEndpoint = new_end_point;
      },
      setUserInfoEndpoint: function(new_end_point) {
        userInfoEndpoint = new_end_point;
      },
      setapiBasePath: function(new_base_path) {
        apiBasePath = new_base_path;
      },
      login: login,
      logoutUser: logoutUser,
      user: user,
      refreshUserInfo: refreshUserInfo
    };

    //private methods and properties - should ONLY expose methods and properties 
    //publicly (via the 'return' object) that are supposed to be used; everything
    //else (helper methods that aren't supposed to be called externally) should 
    //be private.
    return self;

}]);
