import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, NavigationExtras, ParamMap, Router } from '@angular/router';

import { switchMap, takeUntil } from 'rxjs/operators';

import { ModalComponent } from '@awg-shared/modal/modal.component';
import {
    EditionSvgOverlay,
    EditionSvgSheet,
    EditionSvgSheetList,
    EditionWork,
    FolioConvolute,
    FolioConvoluteList,
    TextcriticalComment,
    TextcriticsList,
} from '@awg-views/edition-view/models';
import { EditionDataService, EditionService } from '@awg-views/edition-view/services';
import { Subject } from 'rxjs';

/**
 * The EditionDetail component.
 *
 * It contains the edition detail section
 * of the edition view of the app
 * with a {@link ModalComponent},
 * the {@link EditionConvoluteComponent}
 * and the {@link EditionAccoladeComponent}.
 */
@Component({
    selector: 'awg-edition-detail',
    templateUrl: './edition-detail.component.html',
    styleUrls: ['./edition-detail.component.css'],
})
export class EditionDetailComponent implements OnInit, OnDestroy {
    /**
     * ViewChild variable: modal.
     *
     * It keeps the reference to the awg-modal.
     */
    @ViewChild('modal', { static: true }) modal: ModalComponent;

    /**
     * Public variable: editionWork.
     *
     * It keeps the information about the current composition.
     */
    editionWork: EditionWork;

    /**
     * Public variable: folioConvoluteData.
     *
     * It keeps the folio convolute Data of the edition detail.
     */
    folioConvoluteData: FolioConvoluteList;

    /**
     * Public variable: svgSheetsData.
     *
     * It keeps the svg sheets data of the edition detail.
     */
    svgSheetsData: EditionSvgSheetList;

    /**
     * Public variable: textcriticsData.
     *
     * It keeps the textcritics data of the edition detail.
     */
    textcriticsData: TextcriticsList;

    /**
     * Public variable: selectedConvolute.
     *
     * It keeps the selected convolute.
     */
    selectedConvolute: FolioConvolute;

    /**
     * Public variable: selectedOverlay.
     *
     * It keeps the selected svg overlay.
     */
    selectedOverlay: EditionSvgOverlay;

    /**
     * Public variable: selectedSvgSheet.
     *
     * It keeps the selected svg sheet.
     */
    selectedSvgSheet: EditionSvgSheet;

    /**
     * Public variable: selectedTextcriticalComments.
     *
     * It keeps the selected textcritical comments.
     */
    selectedTextcriticalComments: TextcriticalComment[];

    /**
     * Public variable: errorMessage.
     *
     * It keeps an errorMessage for the service calls.
     */
    errorMessage: string = undefined;

    /**
     * Public variable: showTka.
     *
     * If the textcritics shall be displayed.
     */
    showTkA = false;

    /**
     * Private variable: _destroy$.
     *
     * Subject to emit a truthy value in the ngOnDestroy lifecycle hook.
     */
    private _destroy$: Subject<boolean> = new Subject<boolean>();

    /**
     * Constructor of the EditionDetailComponent.
     *
     * It declares private instances of
     * EditionDataService and EditionService,
     * ActivatedRoute and Router.
     *
     * @param {EditionDataService} editionDataService Instance of the EditionDataService.
     * @param {EditionService} editionService Instance of the EditionService.
     * @param {ActivatedRoute} route Instance of the Angular ActivatedRoute.
     * @param {Router} router Instance of the Angular Router.
     */
    constructor(
        private editionDataService: EditionDataService,
        private editionService: EditionService,
        private route: ActivatedRoute,
        private router: Router
    ) {}

    /**
     * Angular life cycle hook: ngOnInit.
     *
     * It calls the containing methods
     * when initializing the component.
     */
    ngOnInit() {
        this.getEditionDetailData();
    }

    /**
     * Public method: getEditionDetailData.
     *
     * It subscribes to the current edition work
     * of the edition service and gets all necessary edition data
     * from the EditionDataService and the queryParams.
     *
     * @returns {void} Gets the current edition work and all necessary edition data.
     */
    getEditionDetailData(): void {
        this.editionService
            // Get current editionWork from editionService
            .getEditionWork()
            .pipe(
                switchMap((work: EditionWork) => {
                    // Set current editionWork
                    this.editionWork = work;
                    // Return EditionDetailData from editionDataService
                    return this.editionDataService.getEditionDetailData(this.editionWork);
                }),
                takeUntil(this._destroy$)
            )
            .pipe(
                switchMap((data: [FolioConvoluteList, EditionSvgSheetList, TextcriticsList]) => {
                    this.folioConvoluteData = data[0];
                    this.svgSheetsData = data[1];
                    this.textcriticsData = data[2];
                    if (this.route.queryParamMap) {
                        // Return queryParams if available
                        return this.route.queryParamMap;
                    }
                }),
                takeUntil(this._destroy$)
            )
            .subscribe(
                (queryParams: ParamMap) => {
                    const sheetId: string = this._getSketchParams(queryParams);
                    this.selectedSvgSheet = this._findSvgSheet(sheetId);
                    this.selectedConvolute = this._findConvolute('');
                    if (
                        !this.selectedConvolute &&
                        this.folioConvoluteData.convolutes &&
                        this.folioConvoluteData.convolutes.constructor === Array &&
                        this.folioConvoluteData.convolutes.length > 0
                    ) {
                        this.selectedConvolute = this.folioConvoluteData.convolutes[0];
                    }
                },
                error => {
                    this.errorMessage = error as any;
                }
            );
    }

    /**
     * Public method: onConvoluteSelect.
     *
     * It selects a convolute by its id.
     *
     * @param {string} id The given id.
     * @returns {void} Sets the selectedConvolute variable.
     */
    onConvoluteSelect(id: string): void {
        if (!id) {
            return;
        }
        const convolute: FolioConvolute = this._findConvolute(id);

        if (convolute.folios && convolute.folios.constructor === Array && convolute.folios.length === 0) {
            // If no folio data provided, open modal
            if (convolute.linkTo) {
                this.modal.open(convolute.linkTo);
            }
            return;
        }
        this.selectedConvolute = convolute;
    }

    /**
     * Public method: onOverlaySelect.
     *
     * It selects a given overlay and its corresponding textcritical comments.
     *
     * @param {EditionSvgOverlay} overlay The given svg overlay.
     * @returns {void} Sets the selectedOverlay,
     * selectedTextcriticalComments and showTka variable.
     */
    onOverlaySelect(overlay: EditionSvgOverlay): void {
        if (!this.textcriticsData && !this.selectedSvgSheet) {
            return;
        }
        const textcriticalComments: TextcriticalComment[] = this._findTextCriticalComments();

        this.selectedOverlay = overlay;
        this.selectedTextcriticalComments = this.editionService.getTextcriticalComments(
            textcriticalComments,
            this.selectedOverlay
        );
        this.showTkA = this.selectedTextcriticalComments !== [];
    }

    /**
     * Public method: onSvgSheetSelect.
     *
     * It selects a svg sheet by its id and
     * navigates to the edition detail route
     * with this given id.
     *
     * @param {string} id The given svg sheet id.
     * @returns {void} Navigates to the edition detail.
     */
    onSvgSheetSelect(id: string): void {
        if (!id) {
            id = this.svgSheetsData.sheets[0].id || '';
        }
        this.selectedSvgSheet = this._findSvgSheet(id);
        this._clearOverlaySelection();

        const navigationExtras: NavigationExtras = {
            queryParams: { sketch: id },
            queryParamsHandling: '',
        };

        this.router.navigate([this.editionWork.baseRoute, this.editionWork.detailRoute.route], navigationExtras);
    }

    /**
     * Angular life cycle hook: ngOnDestroy.
     *
     * It calls the containing methods
     * when destroying the component.
     */
    ngOnDestroy() {
        // Emit truthy value to end all subscriptions
        this._destroy$.next(true);

        // Now let's also unsubscribe from the subject itself:
        this._destroy$.unsubscribe();
    }

    /**
     * Private method: _clearOverlaySelection.
     *
     * It clears the selected overlay and TkA.
     *
     * @returns {void} Clears the selection.
     */
    private _clearOverlaySelection(): void {
        this.selectedOverlay = null;
        this.showTkA = false;
    }

    /**
     * Private method: _getSketchParams.
     *
     * It checks the route params for a sketch query
     * and returns the id of the selected sheet.
     *
     * @default first entry of this.svgSheetsData
     *
     * @param {ParamMap} queryParams The query paramMap of the activated route.
     * @returns {string} The id of the selected sheet.
     */
    private _getSketchParams(queryParams?: ParamMap): string {
        // If there is no id in query params
        // Take first entry of svg sheets data as default
        if (!queryParams.get('sketch')) {
            this.onSvgSheetSelect(this.svgSheetsData.sheets[0].id);
            return;
        }
        return queryParams.get('sketch') ? queryParams.get('sketch') : this.svgSheetsData.sheets[0].id;
    }

    /**
     * Private method: _findConvolute.
     *
     * It finds a convolute with a given id.
     *
     * @param {string} id The given id input.
     * @returns {FolioConvolute} The convolute that was found.
     */
    private _findConvolute(id: string): FolioConvolute {
        if (!id) {
            return;
        }
        // Find index of given id in folioConvoluteData.convolutes array
        const convoluteIndex = this.folioConvoluteData.convolutes.findIndex(convolute => convolute.convoluteId === id);
        // Return the convolute with the given id
        return this.folioConvoluteData.convolutes[convoluteIndex];
    }

    /**
     * Private method: _findSvgSheet.
     *
     * It finds a svg sheet with a given id.
     *
     * @param {string} id The given id input.
     * @returns {EditionSvgSheet} The sheet that was found.
     */
    private _findSvgSheet(id: string): EditionSvgSheet {
        if (!id) {
            return;
        }
        // Find index of given id in svgSheetsData.sheets array
        const sheetIndex = this.svgSheetsData.sheets.findIndex(sheets => sheets.id === id);
        // Return the sheet with the given id
        return this.svgSheetsData.sheets[sheetIndex];
    }

    /**
     * Private method: _findTextCriticalComments.
     *
     * It finds the textcritical comments for an svg overlay.
     *
     * @returns {TextcriticalComment[]} The textcritical comments that were found.
     */
    private _findTextCriticalComments(): TextcriticalComment[] {
        if (!this.textcriticsData && !this.selectedSvgSheet) {
            return;
        }
        // Find index of the selected svg sheet id in textcriticsData.textcritics array
        const textcriticsIndex = this.textcriticsData.textcritics.findIndex(
            textcritic => textcritic.label === this.selectedSvgSheet.id
        );
        // Return the comments with the given id
        return this.textcriticsData.textcritics[textcriticsIndex].comments;
    }
}
