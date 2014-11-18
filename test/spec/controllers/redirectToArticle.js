/*global articleInfo */
'use strict';

/**
* Module with tests for the redirect to article controller.
*
* @module RedirectToArticleCtrl controller tests
*/
describe('Controller: RedirectToArticleCtrl', function () {
    var ctrl,
        oldArticleInfo,
        $controller,
        $location,
        $rootScope;

    beforeEach(module('authoringEnvironmentApp'));

    beforeEach(inject(function (_$controller_, _$location_, _$rootScope_) {
        $controller = _$controller_;
        $location = _$location_;
        $rootScope = _$rootScope_;

        // set a global variable as it exists in a real environment
        oldArticleInfo = articleInfo;
        articleInfo = {
            articleNumber: 123,
            language: 'en'
        };
    }));

    afterEach(function () {
        // cleanup: reset global articleInfo variable to its initial value
        articleInfo = oldArticleInfo;
    });

    it('redirects to the correct article', inject(function ($httpBackend) {
        $httpBackend.whenGET(new RegExp('.*')).respond(200);
        $location.path('/just/some/path');

        ctrl = $controller('RedirectToArticleCtrl');
        $rootScope.$digest();

        expect($location.path()).toBe('/en/123');
    }));
});
