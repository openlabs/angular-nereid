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
  .factory('nereid', [function() {
    // If the nereid application is listening on a different address than the
    // root path from where the angular app was server, then this needs to be
    // set using setApiBasePath('https://api.mysite.com') without the trailing
    // slash.
    var apiBasePath = '';

    //public methods & properties
    var self = {
      setApiBasePath: function(new_base_path) {
        apiBasePath = new_base_path;
      },
      buildUrl: function(path) {
        // Return a URL joined with the apiBasePath.
        // The path must begin with a forward /
        if (path[0] != '/') {
          console.warn('path when using buildUrl should begin with "/"');
        }
        return apiBasePath + path;
      }
    };

    return self;
  }])
  .factory('nereidAuth', ['$http', '$base64', '$rootScope', 'nereid', function ($http, $base64, $rootScope, nereid) {


    // The endpoint where the login POST requests must be sent
    var loginTokenEndpoint = '/login/token';

    // The endpoint from which the user information can be obtained
    // /me is default nereid url to fetch user status
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
      return $http.get(nereid.buildUrl(userInfoEndpoint))
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
      if (newToken) {
        refreshUserInfo();
      }
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
        nereid.buildUrl(loginTokenEndpoint), {},
        {
          headers: {
            'Authorization': 'Basic ' + basic_auth
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

    var hasAllPermissions = function(permissions) {
      if(!isLoggedIn() || !user.permissions || !permissions) {
        return false;
      }
      for (var i in permissions) {
        if (user.permissions.indexOf(permissions[i]) == -1) {
          return false;
        }
      }
      return true;
    };

    var hasAnyPermission = function(permissions) {
      if(!isLoggedIn() || !user.permissions || !permissions) {
        return false;
      }
      for (var i in permissions) {
        if (user.permissions.indexOf(permissions[i]) != -1) {
          return true;
        }
      }
      return false;
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
        /*
         * **This is due for deprecation in next version**
         *
         * The method is now available directly on nereid service.
         */
        console.warn(
          'WARNING: Setting API basepath from nereid-auth will be removed: ' +
          'https://github.com/openlabs/angular-nereid-auth/issues/7'
        );
        nereid.setApiBasePath(new_base_path);
      },
      hasAnyPermission: hasAnyPermission,
      hasAllPermissions: hasAllPermissions,
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
  .directive('showIfAnyPermission', ['$animate', 'nereidAuth', function($animate, nereidAuth) {
    return function(scope, element, attrs) {
      var permissions = scope.$eval(attrs.showIfAnyPermission);
      scope.$watch(function() { return nereidAuth.user().permissions; }, function (){
        $animate[nereidAuth.hasAnyPermission(permissions) ? 'removeClass' : 'addClass'](element, 'ng-hide');
      });
    };
  }])
  .directive('showIfAllPermissions', ['$animate', 'nereidAuth', function($animate, nereidAuth) {
    return function(scope, element, attrs) {
      var permissions = scope.$eval(attrs.showIfAllPermissions);
      scope.$watch(function() { return nereidAuth.user().permissions; }, function (){
        $animate[nereidAuth.hasAllPermissions(permissions) ? 'removeClass' : 'addClass'](element, 'ng-hide');
      });
    };
  }])
  .directive('hideIfAnyPermission', ['$animate', 'nereidAuth', function($animate, nereidAuth) {
    return function(scope, element, attrs) {
      var permissions = scope.$eval(attrs.hideIfAnyPermission);
      scope.$watch(function() { return nereidAuth.user().permissions; }, function (){
        $animate[nereidAuth.hasAnyPermission(permissions) ? 'addClass' : 'removeClass'](element, 'ng-hide');
      });
    };
  }])
  .directive('hideIfAllPermissions', ['$animate', 'nereidAuth', function($animate, nereidAuth) {
    return function(scope, element, attrs) {
      var permissions = scope.$eval(attrs.hideIfAllPermissions);
      scope.$watch(function() { return nereidAuth.user().permissions; }, function (){
        $animate[nereidAuth.hasAllPermissions(permissions) ? 'addClass' : 'removeClass'](element, 'ng-hide');
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
