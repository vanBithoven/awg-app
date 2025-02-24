import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { DebugElement, SecurityContext } from '@angular/core';
import { BrowserModule, DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { cleanStylesFromDOM } from '@testing/clean-up-helper';
import { getAndExpectDebugElementByCss } from '@testing/expect-helper';

import { OpenStreetMapComponent } from './open-street-map.component';
import { AppConfig } from '@awg-app/app.config';

describe('OpenStreetMapComponent (DONE)', () => {
    let component: OpenStreetMapComponent;
    let fixture: ComponentFixture<OpenStreetMapComponent>;
    let compDe: DebugElement;
    let compEl: any;

    let domSanitizer: DomSanitizer;

    let expectedUnsafeOsmEmbedUrl: string;
    let expectedUnsafeOsmLinkUrl: string;
    let expectedOsmEmbedUrl: SafeResourceUrl;
    let expectedOsmLinkUrl: string;
    let expectedOsmLinkLabel: string;
    let expectedOsmIFrameSettings: { width; height; scrolling };

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                imports: [BrowserModule],
                declarations: [OpenStreetMapComponent],
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(OpenStreetMapComponent);
        component = fixture.componentInstance;
        compDe = fixture.debugElement;
        compEl = compDe.nativeElement;

        domSanitizer = TestBed.inject(DomSanitizer);

        // Test data
        expectedOsmLinkLabel = 'Größere Karte anzeigen';
        expectedOsmIFrameSettings = {
            width: '100%',
            height: '350',
            scrolling: 'no',
        };

        // Unsafe link values for open streets map
        expectedUnsafeOsmEmbedUrl = AppConfig.UNSAFE_OSM_EMBED_URL;
        expectedUnsafeOsmLinkUrl = AppConfig.UNSAFE_OSM_LINK_URL;

        // Bypass the unsafe values
        expectedOsmEmbedUrl = domSanitizer.bypassSecurityTrustResourceUrl(expectedUnsafeOsmEmbedUrl);
        expectedOsmLinkUrl = domSanitizer.sanitize(SecurityContext.URL, expectedUnsafeOsmLinkUrl);
    });

    afterAll(() => {
        cleanStylesFromDOM();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('BEFORE initial data binding', () => {
        it('should not have `osmEmbedUrl` input', () => {
            expect(component.osmEmbedUrl).toBeUndefined('should be undefined');
        });

        it('should not have `osmLinkUrl` input', () => {
            expect(component.osmLinkUrl).toBeUndefined('should be undefined');
        });

        it('should have `osmLinkLabel`', () => {
            expect(component.osmLinkLabel).toBeDefined();
            expect(component.osmLinkLabel).toBe(expectedOsmLinkLabel, `should be ${expectedOsmLinkLabel}`);
        });

        it('should have `osmIFrameSettings`', () => {
            expect(component.osmIFrameSettings).toBeDefined();
            expect(component.osmIFrameSettings).toEqual(
                expectedOsmIFrameSettings,
                `should equal ${expectedOsmIFrameSettings}`
            );
        });

        describe('VIEW', () => {
            it('... should contain one iframe', () => {
                getAndExpectDebugElementByCss(compDe, 'iframe#awg-osm-embed-map', 1, 1);
            });

            it('... should contain one div with link', () => {
                getAndExpectDebugElementByCss(compDe, 'div#awg-osm-link a', 1, 1);
            });

            it('... should not render the osm map yet', () => {
                const mapDes = getAndExpectDebugElementByCss(compDe, 'iframe#awg-osm-embed-map', 1, 1);
                const mapEl = mapDes[0].nativeElement;

                expect(mapEl.src).toBeDefined();
                expect(mapEl.src).toBe('', 'should be empty string');
            });

            it('... should not render the link to OSM homepage yet', () => {
                const linkDes = getAndExpectDebugElementByCss(compDe, 'div#awg-osm-link a', 1, 1);
                const linkEl = linkDes[0].nativeElement;

                expect(linkEl.href).toBeDefined();
                expect(linkEl.href).toBe('', 'should be empty string');
            });
        });
    });

    describe('AFTER initial data binding', () => {
        beforeEach(() => {
            // Simulate the parent setting the input properties
            // It gets the bypassed links (SafeResourceUrl)
            component.osmEmbedUrl = expectedOsmEmbedUrl;
            component.osmLinkUrl = expectedOsmLinkUrl;

            // Trigger initial data binding
            fixture.detectChanges();
        });

        describe('VIEW', () => {
            it('... should render the osm map', () => {
                const mapDes = getAndExpectDebugElementByCss(compDe, 'iframe#awg-osm-embed-map', 1, 1);
                const mapEl = mapDes[0].nativeElement;

                // Sanitize the bypassed value
                const sanitizedEmbedUrl = domSanitizer.sanitize(SecurityContext.RESOURCE_URL, expectedOsmEmbedUrl);
                // Check for the src attribute to contain the sanitized SafeResourceUrl
                expect(mapEl.src).toBeDefined();
                expect(mapEl.src).toBe(sanitizedEmbedUrl, `should be ${sanitizedEmbedUrl}`);
                expect(mapEl.src).toBe(expectedUnsafeOsmEmbedUrl, `should be ${expectedUnsafeOsmEmbedUrl}`);
            });

            it('... should render the link to OSM homepage', () => {
                const linkDes = getAndExpectDebugElementByCss(compDe, 'div#awg-osm-link a', 1, 1);
                const linkEl = linkDes[0].nativeElement;

                // Sanitize the bypassed value
                const sanitizedLinkUrl = expectedOsmLinkUrl;
                // Check for the href attribute to contain the sanitized SafeResourceUrl
                expect(linkEl.href).toBeDefined();
                expect(linkEl.href).toBe(sanitizedLinkUrl, `should be ${sanitizedLinkUrl}`);
                expect(linkEl.href).toBe(expectedUnsafeOsmLinkUrl, `should be ${expectedUnsafeOsmLinkUrl}`);
            });
        });
    });
});
