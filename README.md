# AngularJS Nereid Service

![Angular Nereid Logo](http://openlabs.github.io/angular-nereid/nereid_ng.png)

This angular module is an abstraction of the nereid service. If you are writing
an angular web application that talks to Nereid, the basic authentication can be 
performed using this module. Additional service could be built using the support
features.

This module requires that the Nereid version should atleast be 3.0.4.0

## Features

1. Service for nereid authentication.
2. Directive `show-if-auth` and `hide-if-auth` for showing and hiding DOM based 
   on authentication.

## Demo
http://openlabs.github.io/angular-nereid/

## Dependencies
- required:
	angular-base64

See `bower.json` and `index.html` in the `gh-pages` branch for a full list / more details

## Install

1. download the files using bower

  * add `"angular-nereid": "latest"` to your `bower.json` file then run `bower install` 
  * OR run `bower install angular-nereid`

2. include the files in your app

  * `nereid.min.js`

3. include the module in angular (i.e. in `app.js`) - `openlabs.angular-nereid`

See the `gh-pages` branch, files `bower.json` and `index.html` for a full example.


## Documentation

### Events/Signals

The module also broadcasts the following three events:

1. `nereid-auth:login`: When the login is successful (after the token is set).
   The data returned by the server on successful login is provided as argument.
2. `nereid-auth:loginFailed`: Broadcasted when the login fails. The `response`,
   `status` and `headers` are sent in an object as argument.
3. `nereid-auth:logout`: Broadcasted when the user is logged out. Remember that
   logout could be triggered by the expiry of token too.
4. `nereid-auth:loginRequired`: Broadcasted when a request sent to the server
   fails with 401. This is usually indicative of a wrong token or the absence
   of a valid login, which is required to access the resource.

See the `nereid.js` file top comments for usage examples and documentation
https://github.com/openlabs/angular-nereid/blob/master/nereid.js


## Development

1. `git checkout gh-pages`
	1. run `npm install && bower install`
	2. write your code then run `grunt`
	3. git commit your changes
2. copy over core files (.js and .css/.less for directives) to master branch
	1. `git checkout master`
	2. `git checkout gh-pages nereid.js nereid.min.js`
3. update README, CHANGELOG, bower.json, and do any other final polishing to prepare for publishing
	1. git commit changes
	2. git tag with the version number, i.e. `git tag v1.0.0`
4. create github repo and push
	1. [if remote does not already exist or is incorrect] `git remote add origin [github url]`
	2. `git push origin master --tags` (want to push master branch first so it is the default on github)
	3. `git checkout gh-pages`
	4. `git push origin gh-pages`
5. (optional) register bower component
	1. `bower register angular-nereid [git repo url]`

### Bonus commit hooks to minify

Install git pre-commit hook:

```
cp .hooks/pre-commit.sh .git/hooks/pre-commit
```
