/* eslint-disable @typescript-eslint/no-unused-vars */
import { TestBed, waitForAsync } from '@angular/core/testing';
import { HttpClient, HttpParams, HttpRequest } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Data } from '@angular/router';

import Spy = jasmine.Spy;
import { of as observableOf, throwError as observableThrowError } from 'rxjs';

import { JsonConvert } from 'json2typescript';

import { expectSpyCall } from '@testing/expect-helper';
import { mockResourceFullResponseJson, mockSearchResponseJson } from '@testing/mock-data';

import { AppConfig } from '@awg-app/app.config';
import { ApiServiceError } from '@awg-core/services/api-service/api-service-error.model';
import { ResourceFullResponseJson, SearchResponseJson } from '@awg-shared/api-objects';

import { BibliographyService } from './bibliography.service';

describe('BibliographyService (DONE)', () => {
    let httpClient: HttpClient;
    let httpTestingController: HttpTestingController;

    let bibliographyService: BibliographyService;

    let getApiResponseSpy: Spy;

    // Json object
    let jsonConvert: JsonConvert;
    let expectedResourceFullResponseJson: ResourceFullResponseJson;
    let expectedSearchResponseJson: SearchResponseJson;

    const expectedProjectId = '6';
    const expectedResTypeId = '126'; // Test-01: 127
    const expectedBibShortTitlePropertyId = '614'; // 614 = Bibligoraphie#Kurztitel
    const expectedResourcesRoute = 'resources/';
    const expectedSearchRoute = 'search/';
    const apiUrl = AppConfig.API_ENDPOINT;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [BibliographyService],
        });
        // Inject services and http client handler
        bibliographyService = TestBed.inject(BibliographyService);
        httpClient = TestBed.inject(HttpClient);
        httpTestingController = TestBed.inject(HttpTestingController);

        // Convert json objects
        jsonConvert = new JsonConvert();
        expectedResourceFullResponseJson = jsonConvert.deserializeObject(
            mockResourceFullResponseJson,
            ResourceFullResponseJson
        );
        expectedSearchResponseJson = jsonConvert.deserializeObject(mockSearchResponseJson, SearchResponseJson);

        // Spies on service functions
        // `.and.callThrough` will track the spy down the nested describes, see
        // https://jasmine.github.io/2.0/introduction.html#section-Spies:_%3Ccode%3Eand.callThrough%3C/code%3E
        getApiResponseSpy = spyOn(bibliographyService, 'getApiResponse').and.callThrough();
    });

    afterEach(() => {
        httpTestingController.verify();
    });

    it('should be created', () => {
        expect(bibliographyService).toBeTruthy();
    });

    describe('default values', () => {
        it('... should have serviceName', () => {
            const expectedServiceName = 'BibliographyService';

            expect(bibliographyService.serviceName).toBeDefined();
            expect(bibliographyService.serviceName).toBe(expectedServiceName);
        });

        it('... should have projectId', () => {
            expect(bibliographyService.projectId).toBeDefined();
            expect(bibliographyService.projectId).toBe(expectedProjectId);
        });

        it('... should have resTypeId', () => {
            expect(bibliographyService.resTypeId).toBeDefined();
            expect(bibliographyService.resTypeId).toBe(expectedResTypeId);
        });

        it('... should have bibShortTitlePropertyId', () => {
            expect(bibliographyService.bibShortTitlePropertyId).toBeDefined();
            expect(bibliographyService.bibShortTitlePropertyId).toBe(expectedBibShortTitlePropertyId);
        });

        it('... should have routes', () => {
            expect(bibliographyService.resourcesRoute).toBeDefined();
            expect(bibliographyService.resourcesRoute).toBe(expectedResourcesRoute);

            expect(bibliographyService.searchRoute).toBeDefined();
            expect(bibliographyService.searchRoute).toBe(expectedSearchRoute);
        });

        it("... should have empty 'httpGetUrl' (inherited from ApiService)", () => {
            expect(bibliographyService.httpGetUrl).toBeDefined();
            expect(bibliographyService.httpGetUrl).toBe('');
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

    describe('#getBibliographyList', () => {
        describe('request', () => {
            it(
                '... should perform an HTTP GET request to the Knora API (via ApiService)',
                waitForAsync(() => {
                    const expectedUrl = apiUrl + expectedSearchRoute;

                    // Call service function
                    bibliographyService.getBibliographyList().subscribe();

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
                '... should set filter params for GET request',
                waitForAsync(() => {
                    const expectedUrl = apiUrl + expectedSearchRoute;

                    // Call service function
                    bibliographyService.getBibliographyList().subscribe();

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
                    expect(call.request.params.keys().length).toBe(5, 'should be 5');
                    expect(call.request.params.get('searchtype')).toBe('extended', 'should be extended');
                    expect(call.request.params.get('filter_by_project')).toBe(
                        expectedProjectId,
                        `should be ${expectedProjectId}`
                    );
                    expect(call.request.params.get('filter_by_restype')).toBe(
                        expectedResTypeId,
                        `should be ${expectedResTypeId}`
                    );
                    expect(call.request.params.get('property_id')).toBe(
                        expectedBibShortTitlePropertyId,
                        `should be ${expectedBibShortTitlePropertyId}`
                    );
                    expect(call.request.params.get('compop')).toBe('EXISTS', 'should be EXISTS');
                })
            );

            it(
                '... should call getApiResponse (via ApiService) with filter params',
                waitForAsync(() => {
                    const expectedQueryPath = expectedSearchRoute;
                    const expectedQueryHttpParams = new HttpParams()
                        .set('searchtype', 'extended')
                        .set('property_id', expectedBibShortTitlePropertyId)
                        .set('compop', 'EXISTS')
                        .set('filter_by_project', expectedProjectId)
                        .set('filter_by_restype', expectedResTypeId);

                    getApiResponseSpy.and.returnValue(observableOf(expectedSearchResponseJson));

                    bibliographyService.getBibliographyList().subscribe((response: SearchResponseJson) => {
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
                    '... should return an Observable<SearchResponseJson>',
                    waitForAsync(() => {
                        getApiResponseSpy.and.returnValue(observableOf(expectedSearchResponseJson));

                        bibliographyService.getBibliographyList().subscribe((response: SearchResponseJson) => {
                            expect(response).toEqual(expectedSearchResponseJson);
                        });
                    })
                );
            });

            describe('fail', () => {
                it(
                    '... should return an Observable<ApiServiceError>',
                    waitForAsync(() => {
                        const expectedQueryPath = expectedSearchRoute;
                        const expectedQueryHttpParams = new HttpParams()
                            .set('searchtype', 'extended')
                            .set('property_id', expectedBibShortTitlePropertyId)
                            .set('compop', 'EXISTS')
                            .set('filter_by_project', expectedProjectId)
                            .set('filter_by_restype', expectedResTypeId);

                        const expectedErrorMsg = 'failed HTTP response with 401 error';

                        const expectedApiServiceError = new ApiServiceError();
                        expectedApiServiceError.status = 401;
                        expectedApiServiceError.url = expectedQueryPath;

                        getApiResponseSpy.and.returnValue(observableThrowError(expectedApiServiceError));

                        bibliographyService.getBibliographyList().subscribe(
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

    describe('#getBibliographyItemDetail', () => {
        describe('request', () => {
            it(
                '... should perform an HTTP GET request to the Knora API (via ApiService)',
                waitForAsync(() => {
                    const expectedResourceId = '11398';
                    const expectedUrl = apiUrl + expectedResourcesRoute + expectedResourceId;

                    // Call service function
                    bibliographyService.getBibliographyItemDetail(expectedResourceId).subscribe();

                    // Expect one request to url with given settings
                    httpTestingController.expectOne((req: HttpRequest<any>) => {
                        expect(req.params).toBeDefined();
                        expect(req.params.keys().length).toBe(0, 'should be 0');

                        return req.method === 'GET' && req.responseType === 'json' && req.url === expectedUrl;
                    }, `GET to ${expectedUrl}`);
                })
            );

            it(
                '... should call getApiResponse (via ApiService) with resource id',
                waitForAsync(() => {
                    const expectedResourceId = '11398';
                    const expectedQueryPath = expectedResourcesRoute + expectedResourceId;
                    const expectedQueryHttpParams = new HttpParams();

                    getApiResponseSpy.and.returnValue(observableOf(expectedResourceFullResponseJson));

                    bibliographyService
                        .getBibliographyItemDetail(expectedResourceId)
                        .subscribe((response: ResourceFullResponseJson) => {
                            expectSpyCall(getApiResponseSpy, 1, [
                                ResourceFullResponseJson,
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
                    '... should return an Observable<ResourceFullResponseJson>',
                    waitForAsync(() => {
                        const expectedResourceId = '11398';

                        getApiResponseSpy.and.returnValue(observableOf(expectedResourceFullResponseJson));

                        bibliographyService
                            .getBibliographyItemDetail(expectedResourceId)
                            .subscribe((response: ResourceFullResponseJson) => {
                                expect(response).toEqual(expectedResourceFullResponseJson);
                            });
                    })
                );
            });

            describe('fail', () => {
                it(
                    '... should return an Observable<ApiServiceError>',
                    waitForAsync(() => {
                        const expectedResourceId = undefined;
                        const expectedQueryPath = expectedResourcesRoute + expectedResourceId;
                        const expectedQueryHttpParams = new HttpParams();

                        const expectedErrorMsg = 'failed HTTP response with 401 error';

                        const expectedApiServiceError = new ApiServiceError();
                        expectedApiServiceError.status = 401;
                        expectedApiServiceError.url = expectedResourcesRoute + expectedResourceId;

                        getApiResponseSpy.and.returnValue(observableThrowError(expectedApiServiceError));

                        bibliographyService.getBibliographyItemDetail(expectedResourceId).subscribe(
                            result => fail(expectedErrorMsg),
                            (error: ApiServiceError) => {
                                expectSpyCall(getApiResponseSpy, 1, [
                                    ResourceFullResponseJson,
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
});
