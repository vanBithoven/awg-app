/* eslint-disable @typescript-eslint/no-unused-vars */
import { TestBed, waitForAsync } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient, HttpParams, HttpRequest } from '@angular/common/http';
import { Data } from '@angular/router';

import Spy = jasmine.Spy;
import { of as observableOf, throwError as observableThrowError } from 'rxjs';

import { JsonConvert } from 'json2typescript';

import { expectSpyCall } from '@testing/expect-helper';
import {
    mockResourceContextResponseJson,
    mockResourceDetail,
    mockResourceFullResponseJson,
    mockSearchResponseConverted,
    mockSearchResponseJson,
} from '@testing/mock-data';

import { AppConfig } from '@awg-app/app.config';
import { ConversionService } from '@awg-core/services';
import { ApiServiceError } from '@awg-core/services/api-service/api-service-error.model';
import { ResourceContextResponseJson, ResourceFullResponseJson, SearchResponseJson } from '@awg-shared/api-objects';
import { ResourceData, ResourceDetail, SearchParams } from '@awg-views/data-view/models';

import { DataApiService } from './data-api.service';

describe('DataApiService', () => {
    let dataApiService: DataApiService;

    let httpClient: HttpClient;
    let httpTestingController: HttpTestingController;

    let mockConversionService: Partial<ConversionService>;

    let getApiResponseSpy: Spy;

    // Json object
    let jsonConvert: JsonConvert;
    let expectedResourceFullResponseJson: ResourceFullResponseJson;
    let expectedResourceContextResponseJson: ResourceContextResponseJson;
    let expectedSearchResponseJson: SearchResponseJson;
    let expectedSearchResponseConverted: any;
    let expectedResourceDetail: ResourceDetail;
    let expectedResourceData: ResourceData;

    const expectedProjectId = '6';
    const expectedResourceSuffix = '_-_local';
    const expectedRoutes = {
        resources: 'resources/',
        search: 'search/',
        geonames: 'geonames/',
        hlists: 'hlists/',
        selections: 'selections/',
    };
    const apiUrl = AppConfig.API_ENDPOINT;

    beforeEach(() => {
        // Stub service for test purposes
        mockConversionService = {
            convertFullTextSearchResults: () => expectedSearchResponseConverted,
            convertResourceData: () => expectedResourceDetail,
        };

        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [DataApiService, { provide: ConversionService, useValue: mockConversionService }],
        });

        // Inject services and http client handler
        dataApiService = TestBed.inject(DataApiService);
        httpClient = TestBed.inject(HttpClient);
        httpTestingController = TestBed.inject(HttpTestingController);

        // Convert json objects
        jsonConvert = new JsonConvert();
        expectedResourceFullResponseJson = jsonConvert.deserializeObject(
            mockResourceFullResponseJson,
            ResourceFullResponseJson
        );
        expectedResourceContextResponseJson = jsonConvert.deserializeObject(
            mockResourceContextResponseJson,
            ResourceContextResponseJson
        );
        expectedSearchResponseJson = jsonConvert.deserializeObject(mockSearchResponseJson, SearchResponseJson);

        // Test data
        expectedSearchResponseConverted = mockSearchResponseConverted;
        expectedResourceDetail = mockResourceDetail;
        expectedResourceData = new ResourceData(expectedResourceFullResponseJson, expectedResourceDetail);

        // Spies on service functions
        // `.and.callThrough` will track the spy down the nested describes, see
        // https://jasmine.github.io/2.0/introduction.html#section-Spies:_%3Ccode%3Eand.callThrough%3C/code%3E
        getApiResponseSpy = spyOn(dataApiService, 'getApiResponse').and.callThrough();
    });

    // After every test, assert that there are no more pending requests
    afterEach(() => {
        httpTestingController.verify();
    });

    it('should be created', () => {
        expect(dataApiService).toBeTruthy();
    });

    it('injected service should use provided mockValue', () => {
        const conversionService = TestBed.inject(ConversionService);
        expect(mockConversionService === conversionService).toBe(true);
    });

    describe('default values', () => {
        it('... should have serviceName', () => {
            const expectedServiceName = 'DataApiService';

            expect(dataApiService.serviceName).toBeDefined();
            expect(dataApiService.serviceName).toBe(expectedServiceName, `should be ${expectedServiceName}`);
        });

        it('... should have projectId', () => {
            expect(dataApiService.projectId).toBeDefined();
            expect(dataApiService.projectId).toBe(expectedProjectId, `should be ${expectedProjectId}`);
        });

        it('... should have resourceSuffix', () => {
            expect(dataApiService.resourceSuffix).toBeDefined();
            expect(dataApiService.resourceSuffix).toBe(expectedResourceSuffix, `should be ${expectedResourceSuffix}`);
        });

        it('... should have routes', () => {
            expect(dataApiService.routes).toBeDefined();
            expect(dataApiService.routes).toEqual(expectedRoutes, `should be ${expectedRoutes}`);
        });

        it("... should have empty 'httpGetUrl' (inherited from ApiService)", () => {
            expect(dataApiService.httpGetUrl).toBeDefined();
            expect(dataApiService.httpGetUrl).toBe('', 'should be empty string');
        });
    });

    describe('httpTestingController', () => {
        it(
            '... should issue a mocked http get request',
            waitForAsync(() => {
                const testData: Data = { name: 'TestData' };

                httpClient.get<Data>('/foo/bar').subscribe(data => {
                    expect(data).toEqual(testData);
                });

                // Match the request url
                const call = httpTestingController.expectOne({
                    url: '/foo/bar',
                });

                // Check for GET request
                expect(call.request.method).toEqual('GET');

                // Respond with mocked data
                call.flush(testData);
            })
        );
    });

    describe('#getFulltextSearchData', () => {
        describe('request', () => {
            it(
                '... should not do anything if undefined is provided',
                waitForAsync(() => {
                    // Undefined
                    const expectedSearchString = undefined;
                    const expectedUrl = apiUrl + expectedRoutes.search + expectedSearchString;

                    // Call service function
                    dataApiService.getFulltextSearchData(expectedSearchString);

                    // Expect no request to getApiResponse
                    expectSpyCall(getApiResponseSpy, 0);

                    // Expect no request to url with given settings
                    httpTestingController.expectNone(
                        (req: HttpRequest<any>) =>
                            req.method === 'GET' && req.responseType === 'json' && req.url === expectedUrl,
                        `GET to ${expectedUrl}`
                    );
                })
            );

            it(
                '... should not do anything if null is provided',
                waitForAsync(() => {
                    // Null
                    const expectedSearchString = null;
                    const expectedUrl = apiUrl + expectedRoutes.search + expectedSearchString;

                    // Call service function
                    dataApiService.getFulltextSearchData(expectedSearchString);

                    // Expect no request to getApiResponse
                    expectSpyCall(getApiResponseSpy, 0);

                    // Expect no request to url with given settings
                    httpTestingController.expectNone(
                        (req: HttpRequest<any>) =>
                            req.method === 'GET' && req.responseType === 'json' && req.url === expectedUrl,
                        `GET to ${expectedUrl}`
                    );
                })
            );

            it(
                '... should not do anything if empty searchString is provided',
                waitForAsync(() => {
                    // Empty string
                    const expectedSearchParams: SearchParams = new SearchParams();
                    expectedSearchParams.query = '';
                    const expectedUrl = apiUrl + expectedRoutes.search + expectedSearchParams.query;

                    // Call service function
                    dataApiService.getFulltextSearchData(expectedSearchParams);

                    // Expect no request to getApiResponse
                    expectSpyCall(getApiResponseSpy, 0);

                    // Expect no request to url with given settings
                    httpTestingController.expectNone(
                        (req: HttpRequest<any>) =>
                            req.method === 'GET' && req.responseType === 'json' && req.url === expectedUrl,
                        `GET to ${expectedUrl}`
                    );
                })
            );

            it(
                '... should perform an HTTP GET request to the Knora API (via ApiService) with provided searchString',
                waitForAsync(() => {
                    const expectedSearchParams: SearchParams = new SearchParams();
                    expectedSearchParams.query = 'Test';
                    const expectedUrl = apiUrl + expectedRoutes.search + expectedSearchParams.query;

                    // Call service function
                    dataApiService.getFulltextSearchData(expectedSearchParams).subscribe();

                    // Expect one request to url with given settings
                    const call = httpTestingController.expectOne(
                        (req: HttpRequest<any>) =>
                            req.method === 'GET' && req.responseType === 'json' && req.url === expectedUrl,
                        `GET to ${expectedUrl}`
                    );

                    expect(call.request.method).toEqual('GET', 'should be GET');
                    expect(call.request.responseType).toEqual('json', 'should be json');
                    expect(call.request.url).toEqual(expectedUrl, `should be ${expectedUrl}`);
                })
            );

            it(
                '... should set default params for GET request if none is provided',
                waitForAsync(() => {
                    const expectedSearchParams: SearchParams = new SearchParams();
                    expectedSearchParams.query = 'Test';
                    expectedSearchParams.nRows = '-1';
                    expectedSearchParams.startAt = '0';

                    const expectedUrl = apiUrl + expectedRoutes.search + expectedSearchParams.query;

                    // Call service function
                    dataApiService.getFulltextSearchData(expectedSearchParams).subscribe();

                    // Expect one request to url with given settings
                    const call = httpTestingController.expectOne(
                        (req: HttpRequest<any>) =>
                            req.method === 'GET' && req.responseType === 'json' && req.url === expectedUrl,
                        `GET to ${expectedUrl}`
                    );

                    expect(call.request.method).toEqual('GET', 'should be GET');
                    expect(call.request.responseType).toEqual('json', 'should be json');
                    expect(call.request.url).toEqual(expectedUrl, `should be ${expectedUrl}`);
                    expect(call.request.params).toBeDefined();
                    expect(call.request.params.keys().length).toBe(4, 'should be 4');
                    expect(call.request.params.get('searchtype')).toBe('fulltext', 'should be fulltext');
                    expect(call.request.params.get('filter_by_project')).toBe(
                        expectedProjectId,
                        `should be ${expectedProjectId}`
                    );
                    expect(call.request.params.get('show_nrows')).toBe(
                        expectedSearchParams.nRows,
                        `should be ${expectedSearchParams.nRows}`
                    );
                    expect(call.request.params.get('start_at')).toBe(
                        expectedSearchParams.startAt,
                        `should be ${expectedSearchParams.startAt}`
                    );
                })
            );

            it(
                '... should apply provided params for GET request',
                waitForAsync(() => {
                    const expectedSearchParams: SearchParams = new SearchParams();
                    expectedSearchParams.query = 'Test';
                    expectedSearchParams.nRows = '5';
                    expectedSearchParams.startAt = '20';

                    const expectedUrl = apiUrl + expectedRoutes.search + expectedSearchParams.query;

                    // Call service function
                    dataApiService.getFulltextSearchData(expectedSearchParams).subscribe();

                    // Expect one request to url with given settings
                    const call = httpTestingController.expectOne(
                        (req: HttpRequest<any>) =>
                            req.method === 'GET' && req.responseType === 'json' && req.url === expectedUrl,
                        `GET to ${expectedUrl}`
                    );

                    expect(call.request.method).toEqual('GET', 'should be GET');
                    expect(call.request.responseType).toEqual('json', 'should be json');
                    expect(call.request.url).toEqual(expectedUrl, `should be ${expectedUrl}`);
                    expect(call.request.params).toBeDefined();
                    expect(call.request.params.keys().length).toBe(4, 'should be 4');
                    expect(call.request.params.get('searchtype')).toBe('fulltext', 'should be fulltext');
                    expect(call.request.params.get('filter_by_project')).toBe(
                        expectedProjectId,
                        `should be ${expectedProjectId}`
                    );
                    expect(call.request.params.get('show_nrows')).toBe(
                        expectedSearchParams.nRows,
                        `should be ${expectedSearchParams.nRows}`
                    );
                    expect(call.request.params.get('start_at')).toBe(
                        expectedSearchParams.startAt,
                        `should be ${expectedSearchParams.startAt}`
                    );
                })
            );

            it(
                '... should call getApiResponse (via ApiService) with search string',
                waitForAsync(() => {
                    const expectedSearchParams: SearchParams = new SearchParams();
                    expectedSearchParams.query = 'Test';

                    const expectedQueryPath = expectedRoutes.search + expectedSearchParams.query;
                    const expectedQueryHttpParams = new HttpParams()
                        .set('searchtype', 'fulltext')
                        .set('filter_by_project', '6')
                        .set('show_nrows', '-1')
                        .set('start_at', '0');

                    getApiResponseSpy.and.returnValue(observableOf(expectedSearchResponseJson));

                    dataApiService
                        .getFulltextSearchData(expectedSearchParams)
                        .subscribe((response: SearchResponseJson) => {
                            expectSpyCall(getApiResponseSpy, 1, [
                                SearchResponseJson,
                                expectedQueryPath,
                                expectedQueryHttpParams,
                            ]);
                        });
                })
            );
        });

        describe('response', () => {
            describe('success', () => {
                it(
                    '... should return an SearchResponseJson observable (converted)',
                    waitForAsync(() => {
                        const expectedSearchParams: SearchParams = new SearchParams();
                        expectedSearchParams.query = 'Test';

                        getApiResponseSpy.and.returnValue(observableOf(expectedSearchResponseConverted));

                        dataApiService
                            .getFulltextSearchData(expectedSearchParams)
                            .subscribe((response: SearchResponseJson) => {
                                expect(response).toEqual(expectedSearchResponseConverted);
                            });
                    })
                );
            });

            describe('fail', () => {
                it(
                    '... should return an ApiServiceError observable',
                    waitForAsync(() => {
                        const expectedSearchParams: SearchParams = new SearchParams();
                        expectedSearchParams.query = 'Test';

                        const expectedQueryPath = expectedRoutes.search + expectedSearchParams.query;
                        const expectedQueryHttpParams = new HttpParams()
                            .set('searchtype', 'fulltext')
                            .set('filter_by_project', '6')
                            .set('show_nrows', '-1')
                            .set('start_at', '0');

                        const expectedErrorMsg = 'failed HTTP response with 401 error';

                        const expectedApiServiceError = new ApiServiceError();
                        expectedApiServiceError.status = 401;
                        expectedApiServiceError.url = expectedQueryPath;

                        getApiResponseSpy.and.returnValue(observableThrowError(expectedApiServiceError));

                        dataApiService.getFulltextSearchData(expectedSearchParams).subscribe(
                            result => fail(expectedErrorMsg),
                            (error: ApiServiceError) => {
                                expectSpyCall(getApiResponseSpy, 1, [
                                    SearchResponseJson,
                                    expectedQueryPath,
                                    expectedQueryHttpParams,
                                ]);
                                expect(error).toEqual(expectedApiServiceError);
                            }
                        );
                    })
                );
            });
        });
    });

    describe('#getResourceData', () => {
        describe('request', () => {
            it(
                '... should not do anything if undefined is provided',
                waitForAsync(() => {
                    // Undefined
                    const expectedResourceId = undefined;
                    const expectedUrl = apiUrl + expectedRoutes.resources + expectedResourceId + expectedResourceSuffix;

                    // Call service function
                    dataApiService.getResourceData(expectedResourceId);

                    // Expect no request to getApiResponse
                    expectSpyCall(getApiResponseSpy, 0);

                    // Expect no request to url with given settings
                    httpTestingController.expectNone(
                        (req: HttpRequest<any>) =>
                            req.method === 'GET' && req.responseType === 'json' && req.url === expectedUrl,
                        `GET to ${expectedUrl}`
                    );
                })
            );

            it(
                '... should not do anything if null is provided',
                waitForAsync(() => {
                    // Null
                    const expectedResourceId = null;
                    const expectedUrl = apiUrl + expectedRoutes.resources + expectedResourceId + expectedResourceSuffix;

                    // Call service function
                    dataApiService.getResourceData(expectedResourceId);

                    // Expect no request to getApiResponse
                    expectSpyCall(getApiResponseSpy, 0);

                    // Expect no request to url with given settings
                    httpTestingController.expectNone(
                        (req: HttpRequest<any>) =>
                            req.method === 'GET' && req.responseType === 'json' && req.url === expectedUrl,
                        `GET to ${expectedUrl}`
                    );
                })
            );

            it(
                '... should not do anything if empty resource id string is provided',
                waitForAsync(() => {
                    // Empty string
                    const expectedResourceId = '';
                    const expectedUrl = apiUrl + expectedRoutes.resources + expectedResourceId + expectedResourceSuffix;

                    // Call service function
                    dataApiService.getResourceData(expectedResourceId);

                    // Expect no request to getApiResponse
                    expectSpyCall(getApiResponseSpy, 0);

                    // Expect no request to url with given settings
                    httpTestingController.expectNone(
                        (req: HttpRequest<any>) =>
                            req.method === 'GET' && req.responseType === 'json' && req.url === expectedUrl,
                        `GET to ${expectedUrl}`
                    );
                })
            );

            it(
                '... should perform two HTTP GET requests to the Knora API (via ApiService)',
                waitForAsync(() => {
                    const expectedResourceId = '11398';
                    const expectedUrl = apiUrl + expectedRoutes.resources + expectedResourceId + expectedResourceSuffix;

                    // Call service function
                    dataApiService.getResourceData(expectedResourceId).subscribe();

                    // Expect two requests to url with given settings
                    const re = new RegExp(expectedUrl, 'g');
                    const calls = httpTestingController.match(
                        req => req.url.match(re) && req.method === 'GET' && req.responseType === 'json'
                    );

                    expect(calls.length).toBe(2, 'should be 2 calls');
                })
            );

            it(
                '... first request to the Knora API (via ApiService) should be a ResourceFullResponse request',
                waitForAsync(() => {
                    const expectedResourceId = '11398';
                    const expectedUrl = apiUrl + expectedRoutes.resources + expectedResourceId + expectedResourceSuffix;

                    // Call service function
                    dataApiService.getResourceData(expectedResourceId).subscribe();

                    // Expect two requests to url with given settings
                    const re = new RegExp(expectedUrl, 'g');
                    const calls = httpTestingController.match(
                        req => req.url.match(re) && req.method === 'GET' && req.responseType === 'json'
                    );

                    expect(calls.length).toBe(2, 'should be 2 calls');

                    // Call to GET https://www.salsah.org/api/resources/11398_-_local (ResourceFullResponseJson)
                    expect(calls[0].request.method).toEqual('GET', 'should be GET');
                    expect(calls[0].request.responseType).toEqual('json', 'should be json');
                    expect(calls[0].request.url).toEqual(expectedUrl, `should be ${expectedUrl}`);
                    expect(calls[0].request.params).toBeDefined();
                    expect(calls[0].request.params.keys().length).toBe(0, 'should be 0');
                })
            );

            it(
                '... second request to the Knora API (via ApiService) should be a ResourceContextResponse request',
                waitForAsync(() => {
                    const expectedResourceId = '11398';
                    const expectedUrl = apiUrl + expectedRoutes.resources + expectedResourceId + expectedResourceSuffix;

                    // Call service function
                    dataApiService.getResourceData(expectedResourceId).subscribe();

                    // Expect two requests to url with given settings
                    const re = new RegExp(expectedUrl, 'g');
                    const calls = httpTestingController.match(
                        req => req.url.match(re) && req.method === 'GET' && req.responseType === 'json'
                    );

                    expect(calls.length).toBe(2, 'should be 2 calls');

                    // Call to GET https://www.salsah.org/api/resources/11398_-_local?reqtype=context (ResourceContextResponseJson)
                    expect(calls[1].request.method).toEqual('GET', 'should be GET');
                    expect(calls[1].request.responseType).toEqual('json', 'should be json');
                    expect(calls[1].request.url).toEqual(expectedUrl, `should be ${expectedUrl}`);
                    expect(calls[1].request.params).toBeDefined();
                    expect(calls[1].request.params.keys().length).toBe(1, 'should be 1');
                    expect(calls[1].request.params.keys()[0]).toBe('reqtype', 'should be reqtype');
                    expect(calls[1].request.params.get('reqtype')).toBe('context', 'should be context');
                })
            );

            it(
                '... should call two times getApiResponse (via ApiService) with resource id',
                waitForAsync(() => {
                    const expectedResourceId = '11398';
                    const expectedQueryPath = expectedRoutes.resources + expectedResourceId + expectedResourceSuffix;
                    const expectedUrl = apiUrl + expectedQueryPath;

                    dataApiService.getResourceData(expectedResourceId).subscribe((response: ResourceData) => {
                        // Two calls
                        expect(getApiResponseSpy.calls.all().length).toBe(2, 'should be 2 calls');
                    });

                    // Expect two requests to url with given settings
                    const re = new RegExp(expectedUrl, 'g');
                    const calls = httpTestingController.match(
                        req => req.url.match(re) && req.method === 'GET' && req.responseType === 'json'
                    );

                    calls[0].flush(expectedResourceFullResponseJson);
                    calls[1].flush(expectedResourceContextResponseJson);
                })
            );

            it(
                '... first call to getApiResponse (via ApiService) with resource id should be a ResourceFullResponse request',
                waitForAsync(() => {
                    const expectedResourceId = '11398';
                    const expectedQueryPath = expectedRoutes.resources + expectedResourceId + expectedResourceSuffix;
                    const expectedQueryHttpParams = new HttpParams();
                    const expectedUrl = apiUrl + expectedQueryPath;

                    dataApiService.getResourceData(expectedResourceId).subscribe((response: ResourceData) => {
                        // Two calls
                        expect(getApiResponseSpy.calls.all().length).toBe(2, 'should be 2 calls');

                        // Shortcut
                        const firstCallArgs = getApiResponseSpy.calls.allArgs()[0];

                        // Check args of call
                        expect(firstCallArgs[0].name).toBe(
                            'ResourceFullResponseJson',
                            'should be ResourceFullResponseJson'
                        );
                        expect(firstCallArgs[1]).toBe(expectedQueryPath, `should be ${expectedQueryPath}`);
                        expect(firstCallArgs[2]).toEqual(
                            expectedQueryHttpParams,
                            `should equal ${expectedQueryHttpParams}`
                        );
                    });

                    // Expect two requests to url with given settings
                    const re = new RegExp(expectedUrl, 'g');
                    const calls = httpTestingController.match(
                        req => req.url.match(re) && req.method === 'GET' && req.responseType === 'json'
                    );

                    calls[0].flush(expectedResourceFullResponseJson);
                    calls[1].flush(expectedResourceContextResponseJson);
                })
            );

            it(
                '... second call to getApiResponse (via ApiService) with resource id should be a ResourceContextResponse request',
                waitForAsync(() => {
                    const expectedResourceId = '11398';
                    const expectedQueryPath = expectedRoutes.resources + expectedResourceId + expectedResourceSuffix;
                    const expectedQueryHttpParams = new HttpParams().set('reqtype', 'context');
                    const expectedUrl = apiUrl + expectedQueryPath;

                    dataApiService.getResourceData(expectedResourceId).subscribe((response: ResourceData) => {
                        // Two calls
                        expect(getApiResponseSpy.calls.all().length).toBe(2, 'should be 2 calls');

                        // Shortcut
                        const secondCallArgs = getApiResponseSpy.calls.allArgs()[1];

                        // Check args of call
                        expect(secondCallArgs[0].name).toBe(
                            'ResourceContextResponseJson',
                            'should be ResourceContextResponseJson'
                        );
                        expect(secondCallArgs[1]).toBe(expectedQueryPath, `should be ${expectedQueryPath}`);
                        expect(secondCallArgs[2]).toEqual(
                            expectedQueryHttpParams,
                            `should equal ${expectedQueryHttpParams}`
                        );
                    });

                    // Expect two requests to url with given settings
                    const re = new RegExp(expectedUrl, 'g');
                    const calls = httpTestingController.match(
                        req => req.url.match(re) && req.method === 'GET' && req.responseType === 'json'
                    );

                    calls[0].flush(expectedResourceFullResponseJson);
                    calls[1].flush(expectedResourceContextResponseJson);
                })
            );
        });

        describe('response', () => {
            describe('success', () => {
                describe('... should return a ResourceData observable ', () => {
                    it(
                        '...when both API responses succeed',
                        waitForAsync(() => {
                            const expectedResourceId = '11398';

                            // Return fork joined observables from API
                            getApiResponseSpy.and.returnValues(
                                observableOf(expectedResourceFullResponseJson),
                                observableOf(expectedResourceContextResponseJson)
                            );

                            dataApiService
                                .getResourceData(expectedResourceId)
                                .subscribe((resourceData: ResourceData) => {
                                    expect(getApiResponseSpy.calls.all().length).toBe(2, 'should be 2 calls');
                                    expect(resourceData).toEqual(expectedResourceData);
                                });
                        })
                    );
                });
            });

            describe('fail', () => {
                describe('... should return an ApiServiceError observable', () => {
                    const expectedResourceId = '11398';
                    const expectedQueryPath = expectedRoutes.resources + expectedResourceId + expectedResourceSuffix;
                    const expectedErrorMsg = 'should fail HTTP response with 401 error';
                    let expectedApiServiceError;

                    beforeEach(() => {
                        expectedApiServiceError = new ApiServiceError();
                        expectedApiServiceError.status = 401;
                        expectedApiServiceError.url = expectedQueryPath;
                    });

                    it(
                        '... when both API responses fail',
                        waitForAsync(() => {
                            // Return fork joined observables from API
                            getApiResponseSpy.and.returnValues(
                                observableThrowError(expectedApiServiceError),
                                observableThrowError(expectedApiServiceError)
                            );

                            dataApiService.getResourceData(expectedResourceId).subscribe(
                                result => fail(expectedErrorMsg),
                                (error: ApiServiceError) => {
                                    // Two calls
                                    expect(getApiResponseSpy.calls.all().length).toBe(2, 'should be 2 calls');
                                    expect(error).toEqual(expectedApiServiceError);
                                }
                            );
                        })
                    );

                    it(
                        '... when first API response fails',
                        waitForAsync(() => {
                            // Return fork joined observables from API
                            getApiResponseSpy.and.returnValues(
                                observableThrowError(expectedApiServiceError),
                                observableOf(expectedResourceContextResponseJson)
                            );

                            dataApiService.getResourceData(expectedResourceId).subscribe(
                                result => fail(expectedErrorMsg),
                                (error: ApiServiceError) => {
                                    // Two calls
                                    expect(getApiResponseSpy.calls.all().length).toBe(2, 'should be 2 calls');
                                    expect(error).toEqual(expectedApiServiceError);
                                }
                            );
                        })
                    );

                    it(
                        '... when second API response fails',
                        waitForAsync(() => {
                            // Return fork joined observables from API
                            getApiResponseSpy.and.returnValues(
                                observableOf(expectedResourceFullResponseJson),
                                observableThrowError(expectedApiServiceError)
                            );

                            dataApiService.getResourceData(expectedResourceId).subscribe(
                                result => fail(expectedErrorMsg),
                                (error: ApiServiceError) => {
                                    // Two calls
                                    expect(getApiResponseSpy.calls.all().length).toBe(2, 'should be 2 calls');
                                    expect(error).toEqual(expectedApiServiceError);
                                }
                            );
                        })
                    );
                });
            });
        });
    });
});
