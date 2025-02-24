import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

import { SourceEvaluationList } from '@awg-views/edition-view/models';

/**
 * The SourceEvaluation component.
 *
 * It contains the source evaluation section
 * of the critical report
 * of the edition view of the app.
 */
@Component({
    selector: 'awg-source-evaluation',
    templateUrl: './source-evaluation.component.html',
    styleUrls: ['./source-evaluation.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SourceEvaluationComponent implements OnInit {
    /**
     * Input variable: sourceEvaluationListData.
     *
     * It keeps the source evaluation data.
     */
    @Input()
    sourceEvaluationListData: SourceEvaluationList;

    /**
     * Output variable: navigateToReportFragment.
     *
     * It keeps an event emitter for a fragment id of the edition report.
     */
    @Output()
    navigateToReportFragmentRequest: EventEmitter<string> = new EventEmitter();

    /**
     * Output variable: openModalRequest.
     *
     * It keeps an event emitter to open the modal
     * with the selected modal text snippet.
     */
    @Output()
    openModalRequest: EventEmitter<string> = new EventEmitter();

    /**
     * Output variable: selectSvgSheetRequest.
     *
     * It keeps an event emitter for the selected id of an svg sheet.
     */
    @Output()
    selectSvgSheetRequest: EventEmitter<string> = new EventEmitter();

    /**
     * Self-referring variable needed for CompileHtml library.
     */
    ref: SourceEvaluationComponent;

    /**
     * Constructor of the EditionDetailComponent.
     *
     * It declares the self-referring variable
     * needed for CompileHtml library.
     */
    constructor() {
        this.ref = this;
    }

    /**
     * Angular life cycle hook: ngOnInit.
     *
     * It calls the containing methods
     * when initializing the component.
     */
    ngOnInit() {}

    /**
     * Public method: navigateToReportFragment.
     *
     * It emits a given id of a fragment of the edition report
     * to the {@link navigateToReportFragmentRequest}.
     *
     * @param {string} id The given fragment id.
     * @returns {void} Navigates to the edition report.
     */
    navigateToReportFragment(id: string) {
        this.navigateToReportFragmentRequest.emit(id);
    }

    /**
     * Public method: openModal.
     *
     * It emits a given id of a modal snippet text
     * to the {@link openModalRequest}.
     *
     * @param {string} id The given modal snippet id.
     * @returns {void} Emits the id.
     */
    openModal(id: string): void {
        this.openModalRequest.emit(id);
    }

    /**
     * Public method: selectSvgSheet.
     *
     * It emits a given id of a selected svg sheet
     * to the {@link selectSvgSheetRequest}.
     *
     * @param {string} id The given sheet id.
     * @returns {void} Emits the id.
     */
    selectSvgSheet(id: string): void {
        this.selectSvgSheetRequest.emit(id);
    }
}
