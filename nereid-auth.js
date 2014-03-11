/**
@fileOverview

@toc

*/

'use strict';

angular.module('openlabs.angular-nereid-auth', ['base64'])
  .config(['$httpProvider', function ($httpProvider) {
    $httpProvider.interceptors.push(function ($q, $location, $rootScope) {
      return {
       'responseError': function (rejection) {
          if (rejection.status===401) {
            $rootScope.$broadcast("nereid-auth:loginRequired", rejection);
          }
          return $q.reject(rejection);
        }
      };
    });
  }])
  .factory('nereidAuth', ['$http', '$base64', '$rootScope', function ($http, $base64, $rootScope) {

    // If the nereid application is listening on a different address than the
    // root path from where the angular app was server, then this needs to be
    // set using setApiBasePath('https://api.mysite.com') without the trailing
    // slash.
    var apiBasePath = '';

    // The endpoint where the login POST requests must be sent
    var loginTokenEndpoint = '/login/token';

    // The endpoint from which the user information can be obtained
    // /user_status is default nereid url to fetch user status
    var userInfoEndpoint = '/user_status';

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

    var isLoggedIn = function() {
      if (token) {
        return true;
      } else {
        return false;
      }
    };

    if (token) {
      setHeaders(token);
      // Get the user information
      refreshUserInfo()
        .error(function(data, status) {
          if (status == 401) {logoutUser();}
        });
    }

    var setToken = function (newToken) {
      if (!newToken) {
        localStorage.removeItem('token');
      } else {
        localStorage.setItem('token', newToken);
      }
      setHeaders(newToken);
      token = newToken;
      refreshUserInfo();
    };

    var logoutUser = function () {
      // Clear the token
      setToken(null);
      user = {};
      $rootScope.$broadcast("nereid-auth:logout");
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
        user = data.user;
        setToken(data.token);
        $rootScope.$broadcast("nereid-auth:login", data);
      })
      .error(function(reason, status, headers) {
        $rootScope.$broadcast("nereid-auth:loginFailed", {
          reason: reason,
          status: status,
          headers: headers()
        });

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
      user: function () {
        return user;
      },
      refreshUserInfo: refreshUserInfo,
      isLoggedIn: isLoggedIn
    };

    //private methods and properties - should ONLY expose methods and properties 
    //publicly (via the 'return' object) that are supposed to be used; everything
    //else (helper methods that aren't supposed to be called externally) should 
    //be private.
    return self;

  }])
  .directive('showIfAuth', ['$animate', 'nereidAuth', function($animate, nereidAuth) {
    return function(scope, element) {
      scope.$watch(function() { return nereidAuth.isLoggedIn(); }, function (){
        $animate[nereidAuth.isLoggedIn() ? 'removeClass' : 'addClass'](element, 'ng-hide');
      });
    };
  }])
  .directive('hideIfAuth', ['$animate', 'nereidAuth', function($animate, nereidAuth) {
    return function(scope, element) {
      scope.$watch(function() { return nereidAuth.isLoggedIn(); }, function (){
        $animate[nereidAuth.isLoggedIn() ? 'addClass' : 'removeClass'](element, 'ng-hide');
      });
    };
  }])
  .directive('nereidAuth', function(nereidAuth) {
    /*
     * Inject nereidAuth methods to scope that can be used directly with
     * directive.
     * Example:
     * <a nereid-auth ng-click="logout()">Logout</a>
     *
    **/
    return {
        restrict: 'A',
        link: function($scope) {
          $scope.logout = function(){
            nereidAuth.logoutUser();
          };
        }
      };
  });
