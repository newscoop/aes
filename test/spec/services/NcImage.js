'use strict';

/**
* Module with tests for the NcImage factory.
*
* @module NcImage factory tests
*/

describe('Factory: NcImage', function () {

    var NcImage,
        imgData,
        $httpBackend;

    beforeEach(module('authoringEnvironmentApp'));

    beforeEach(inject(function (_NcImage_, _$httpBackend_) {
        NcImage = _NcImage_;
        $httpBackend = _$httpBackend_;
    }));


    describe('constructor', function () {
        it('initializes instance\'s fields with provided values', function () {
            var data,
                instance;

            data = {
                id: 42,
                basename: 'img.jpg', thumbnailPath: 'img_thumb.jpg',
                description: 'foo bar',
                width: 100, height: 150,
                photographer: 'John Doe',
                photographerUrl: 'http://johndoe.com/'
            };
            instance = new NcImage(data);

            expect(instance instanceof NcImage).toBe(true);
            Object.keys(data).forEach(function (key) {
                expect(instance[key]).toEqual(data[key]);
            });
        });

        it('sets all instance attributes to undefined if data not provided',
            function () {
                var instance,
                    keys;

                keys = [
                    'id', 'basename', 'thumbnailPath', 'description',
                    'width', 'height', 'photographer', 'photographerUrl'
                ];

                instance = new NcImage();

                keys.forEach(function (key) {
                    expect(instance.hasOwnProperty(key)).toBe(true);
                    expect(instance[key]).toBeUndefined();
                })
            }
        );

        it('does *not* initialize the instance with unknown data keys',
            function () {
                var data,
                    instance;

                data = {
                    id: 42,
                    irrelevantValue: -123.007
                };
                instance = new NcImage(data);

                expect(instance.irrelevantValue).toBeUndefined();
            }
        );

        it('converts width and height values to integers', function () {
                var data,
                    instance;

                data = {
                    width: '25',
                    height: '75'
                };
                instance = new NcImage(data);

                expect(instance.width).toBe(25);
                expect(instance.height).toBe(75);
            }
        );
    });

    describe('getById() method', function () {
        var url;

        beforeEach(function () {
            imgData = {id:42};
            url = Routing.generate(
                'newscoop_gimme_images_getimage', {number: 42}, true
            );
            $httpBackend.expectGET(url).respond(200, JSON.stringify(imgData));
        });

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
        });

        it('sends a correct request to API', function () {
            NcImage.getById(42);
        });

        it('resolves given promise on successful server response',
            function () {
                var expectedArg,
                    spyHelper = {
                        onSuccess: jasmine.createSpy()
                    };

                NcImage.getById(42)
                    .then(spyHelper.onSuccess);
                $httpBackend.flush(1);

                expect(spyHelper.onSuccess).toHaveBeenCalled();
                expectedArg = spyHelper.onSuccess.mostRecentCall.args[0];
                expect(expectedArg instanceof NcImage).toBe(true);
                expect(expectedArg.id).toEqual(42);
            }
        );

        it('rejects given promise on server error response', function () {
            var expectedArg,
                spyHelper = {
                    errorCallback: jasmine.createSpy()
                };

            $httpBackend.resetExpectations();
            $httpBackend.expectGET(url).respond(500, 'Error :(');

            NcImage.getById(42)
                .catch(spyHelper.errorCallback);
            $httpBackend.flush(1);

            expect(spyHelper.errorCallback).toHaveBeenCalledWith('Error :(');
        });
    });

   describe('query() method', function () {
        var paginationObj,
            responseItems,
            url;

        beforeEach(function () {
            responseItems = [
                {id: 1, description: 'img 1'},
                {id: 2, description: 'img 2'},
                {id: 3, description: 'img 3'},
            ];

            paginationObj = {
                itemsPerPage: 50,
                currentPage: 2,
                itemsCount: 162,
                nextPageLink: 'https;//foo.com/page_2'
            };

            url = Routing.generate(
                'newscoop_gimme_images_searchimages',
                {expand: true, items_per_page: 50, page: 2, query: 'fish'},
                true
            );

            $httpBackend.expectGET(url).respond(
                200, {items: responseItems, pagination: paginationObj}
            );
        });

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
        });

        it('sends a correct request to API (search term given)', function () {
            NcImage.query(2, 50, 'fish');
            // no unexpected request error should be thrown here
        });

        it('sends a correct request to API (search term not given)',
            function () {
                url = Routing.generate(
                    'newscoop_gimme_images_searchimages',
                    {expand: true, items_per_page: 50, page: 2},
                    true
                );
                $httpBackend.resetExpectations();
                $httpBackend.expectGET(url).respond(
                    200, {items: responseItems, pagination: paginationObj}
                );

                NcImage.query(2, 50);
                // no unexpected request error should be thrown here
            }
        );

        it('returns an empty array which is populated with NcImage ' +
            'instances on successful response',
            function () {
                var result = NcImage.query(2, 50, 'fish');
                expect(result instanceof Array).toEqual(true);
                expect(result.length).toEqual(0);

                $httpBackend.flush(1);

                expect(result.length).toEqual(3);
                result.forEach(function (item) {
                    expect(item instanceof NcImage).toBe(true);
                });
            }
        );

        it('returned array\'s promise is resolved on successful response',
            function () {
                var result,
                    onSuccessSpy = jasmine.createSpy();

                result = NcImage.query(2, 50, 'fish');
                result.$promise.then(onSuccessSpy);
                expect(onSuccessSpy).not.toHaveBeenCalled();

                $httpBackend.flush(1);
                expect(onSuccessSpy).toHaveBeenCalled();
            }
        );

        it('returned array\'s promise is resolved with items list and ' +
            'pagination object',
            function () {
                var callArg,
                    result,
                    onSuccessSpy = jasmine.createSpy();

                result = NcImage.query(2, 50, 'fish');
                result.$promise.then(onSuccessSpy);

                $httpBackend.flush(1);

                callArg = onSuccessSpy.mostRecentCall.args[0];
                expect(callArg.items.constructor).toBe(Array);
                expect(callArg.pagination).toEqual(paginationObj);
            }
        );

        it('correctly resolves promise on empty server response', function () {
            var callArg,
                result,
                onSuccessSpy = jasmine.createSpy();

            $httpBackend.resetExpectations();
            $httpBackend.expectGET(url).respond(204);

            result = NcImage.query(2, 50, 'fish');
            result.$promise.then(onSuccessSpy);

            $httpBackend.flush(1);

            callArg = onSuccessSpy.mostRecentCall.args[0];
            expect(callArg.items.length).toEqual(0);
            expect(callArg.pagination).toBeUndefined();
        });

        describe('on server error response', function () {
            beforeEach(function () {
                $httpBackend.resetExpectations();
                $httpBackend.expectGET(url).respond(500, 'Server error');
            });

            it('returned array is not populated', function () {
                var result = NcImage.query(2, 50, 'fish');
                expect(result.length).toEqual(0);
                $httpBackend.flush(1);
                expect(result.length).toEqual(0);  // still empty
            });

            it('returned array\'s promise is rejected', function () {
                var result,
                    spy = jasmine.createSpy();

                result = NcImage.query(2, 50, 'fish');
                result.$promise.catch(function (reason) {
                    spy(reason);
                });
                expect(spy).not.toHaveBeenCalled();

                $httpBackend.flush(1);
                expect(spy).toHaveBeenCalledWith('Server error');
            });
        });
    });

   describe('getAllByArticle() method', function () {
        var images,
            url;

        beforeEach(function () {
            images = [
                {id: 1, description: 'img 1'},
                {id: 2, description: 'img 2'},
                {id: 3, description: 'img 3'},
            ];

            url = Routing.generate(
                'newscoop_gimme_images_getimagesforarticle',
                {
                    number: 77, language: 'pl',
                    expand: true, items_per_page: 99999
                },
                true
            );

            $httpBackend.expectGET(url).respond(200, {items: images});
        });

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
        });

        it('sends a correct request to API', function () {
            NcImage.getAllByArticle(77, 'pl');
        });

        it('returns an empty array which is populated with NcImage ' +
            'instances on successful response',
            function () {
                var result = NcImage.getAllByArticle(77, 'pl');
                expect(result instanceof Array).toEqual(true);
                expect(result.length).toEqual(0);

                $httpBackend.flush(1);
                expect(result.length).toEqual(3);
                result.forEach(function (item) {
                    expect(item instanceof NcImage).toBe(true);
                });
            }
        );

        it('returned array\'s promise is resolved on successful response',
            function () {
                var result,
                    onSuccessSpy = jasmine.createSpy();

                result = NcImage.getAllByArticle(77, 'pl');
                result.$promise.then(onSuccessSpy);
                expect(onSuccessSpy).not.toHaveBeenCalled();

                $httpBackend.flush(1);
                expect(onSuccessSpy).toHaveBeenCalled();
            }
        );

        it('does not throw an error on empty response', function () {
            $httpBackend.resetExpectations();
            $httpBackend.expectGET(url).respond(204, '');

            NcImage.getAllByArticle(77, 'pl');
            $httpBackend.flush(1);

            // no error should have been thrown...
        });

        describe('on server error response', function () {
            beforeEach(function () {
                $httpBackend.resetExpectations();
                $httpBackend.expectGET(url).respond(500, 'Server error');
            });

            it('returned array is not populated', function () {
                var result = NcImage.getAllByArticle(77, 'pl');
                expect(result.length).toEqual(0);
                $httpBackend.flush(1);
                expect(result.length).toEqual(0);  // still empty
            });

            it('returned array\'s promise is rejected', function () {
                var result,
                    spy = jasmine.createSpy();

                result = NcImage.getAllByArticle(77, 'pl');
                result.$promise.catch(function (reason) {
                    spy(reason);
                });
                expect(spy).not.toHaveBeenCalled();

                $httpBackend.flush(1);
                expect(spy).toHaveBeenCalledWith('Server error');
            });
        });
    });

    describe('updateDescription() method', function () {
        var image,
            requestData,
            url;

        beforeEach(function () {
            image = new NcImage();
            image.id = 5;
            image.description = 'foo';

            requestData = {
                number: 5,
                image: {
                    description: 'bar'
                }
            };

            url = Routing.generate(
                'newscoop_gimme_images_updateimage', {number: 5}, true
            );
            $httpBackend.expectPATCH(url, requestData).respond(200);
        });

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
        });

        it('returns a promise', inject(function ($q) {
            var deferred = $q.defer(),
                promise;
            promise = image.updateDescription('bar');
            expect(promise instanceof deferred.promise.constructor).toBe(true);
        }));

        it('sends a correct request to API', function () {
            image.updateDescription('bar');
        });

        it('resolves given promise on successful server response',
            function () {
                var spyHelper = {
                        onSuccess: jasmine.createSpy()
                    };

                image.updateDescription('bar').then(spyHelper.onSuccess);
                $httpBackend.flush(1);

                expect(spyHelper.onSuccess).toHaveBeenCalled();
            }
        );

        it('updates instance\'s description attribute on success',
            function () {
                image.description = 'foo';
                image.updateDescription('bar');
                $httpBackend.flush(1);
                expect(image.description).toEqual('bar');
            }
        );

        it('rejects given promise on server error response', function () {
            var expectedArg,
                spyHelper = {
                    errorCallback: jasmine.createSpy()
                };

            $httpBackend.resetExpectations();
            $httpBackend.expectPATCH(
                url, requestData
            ).respond(500, 'Error :(');

            image.updateDescription('bar').catch(spyHelper.errorCallback);
            $httpBackend.flush(1);

            expect(spyHelper.errorCallback).toHaveBeenCalledWith('Error :(');
        });
    });


    describe('removeFromArticle() method', function () {
        var image,
            url;

        beforeEach(function () {
            var expectedLinkHeader,
                imageUri;

            imageUri = Routing.generate(
                'newscoop_gimme_images_getimage', {number: 1}, false
            );
            expectedLinkHeader = '<' + imageUri + '; rel="image">';

            image = Object.create(NcImage.prototype, {
                id: {value: 1, writable: true, enumerable: true}
            });

            url = Routing.generate(
                'newscoop_gimme_articles_unlinkarticle',
                {number: 25, language: 'en'}, true
            );

            $httpBackend.expect(
                'UNLINK',
                url,
                undefined,
                function (headers) {
                    return headers.link === expectedLinkHeader;
                }
            ).respond(204, '');
        });

        it('returns a promise', inject(function ($q) {
            var deferred = $q.defer(),
                promise;
            promise = image.removeFromArticle(25, 'de')
            expect(promise instanceof deferred.promise.constructor).toBe(true);
            expect(typeof promise.then).toBe('function');
        }));

        it('sends a correct request to API', function () {
            image.removeFromArticle(25, 'en');
            $httpBackend.verifyNoOutstandingExpectation();
        });

        it('resolves given promise on successful server response',
            function () {
                var onSuccessSpy = jasmine.createSpy();

                image.removeFromArticle(25, 'en').then(onSuccessSpy);
                $httpBackend.flush(1);

                expect(onSuccessSpy).toHaveBeenCalled();
            }
        );

        it('rejects given promise on server error response', function () {
            var onErrorSpy = jasmine.createSpy();

            $httpBackend.resetExpectations();
            $httpBackend.expect('UNLINK', url).respond(500, 'Error :(');

            image.removeFromArticle(25, 'en').catch(onErrorSpy);
            $httpBackend.flush(1);

            expect(onErrorSpy).toHaveBeenCalledWith('Error :(');
        });
    });

});
