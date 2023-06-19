import {
    IFilterComp,
    IFilterParams,
    IDoesFilterPassParams,
    IAfterGuiAttachedParams,
} from 'ag-grid-community';
export class CustomTextFilterComp implements IFilterComp {
    private params: any;
    private scope: any;
    private eGui!: HTMLElement;
    private eFilterInput: HTMLInputElement | null = null;
    private eUnfilterButton: Element | null = null;
    private filterText: string;
    private onFilterListener: EventListener | undefined;
    private onUnfilterListener: EventListener | undefined;
    private inputTimeout;
    constructor() {
        this.filterText = '';
    }
    public init(params: IFilterParams): void {
        this.params = params;
        this.scope = this.params.scope;
        // If filters already existe, then set them
        const filters = this.scope.columnFilters;
        if (
            filters[this.params.colDef.field] &&
            filters[this.params.colDef.field].length > 0
        ) {
            this.filterText = filters[this.params.colDef.field][0];
        }
        // Create filter element
        this.eGui = document.createElement('div');
        this.eGui.innerHTML = `
        <div class="grid-standard__filter">
            <smss-field>
                <label>Search ${this.params.colDef.headerName}:</label>
                <content>
                    <div class="grid-standard__filter__container">
                        <input id="filterInput" class="smss-input">
                        <button id="unfilterBtn"
                            title="Clear Search" 
                            class="smss-btn smss-btn--icon">
                            <i class="fa fa-times"></i>
                        </button>
                    </div>
                </content>
                <description class="grid-standard__filter__description">
                    Note: This filter will only apply to this panel. It will not affect cloned panels.
                </description>
            </smss-field>
        </div>
        `;
        this.params.compile(this.eGui)(this.scope);
        window.setTimeout(this.scope.$apply.bind(this.scope), 0);

        // Add event listeners
        this.eFilterInput = this.eGui.querySelector('#filterInput');
        this.eUnfilterButton = this.eGui.querySelector('#unfilterBtn');
        if (this.eFilterInput) {
            this.onFilterListener = this.setFilterText.bind(this);
            this.eFilterInput.addEventListener('keyup', this.onFilterListener);
        }
        if (this.eUnfilterButton) {
            this.onUnfilterListener = this.clearFilterText.bind(this);
            this.eUnfilterButton.addEventListener(
                'click',
                this.onUnfilterListener
            );
        }
    }
    public afterGuiAttached(params: IAfterGuiAttachedParams): void {
        if (this.eFilterInput) {
            this.eFilterInput.focus();
            this.eFilterInput.value = this.filterText;
        }
    }
    private setFilterText(event): void {
        const value = event.target.value ? event.target.value : '';
        this.setModel(value);
        // Debounce
        if (this.inputTimeout) {
            clearTimeout(this.inputTimeout);
        }
        this.inputTimeout = setTimeout(this.onFilter.bind(this), 300);
    }
    private onFilter(): void {
        const value = this.getModel(),
            newFilter = {
                left: this.params.colDef.field,
                comparator: '?like',
                right: [value],
            };
        // Calls the filter function and syncs the scope with the grid directive
        if (value.length > 0) {
            this.scope.onFilterColumn(newFilter, '');
            this.scope.columnFilters[this.params.colDef.field] = [
                value,
                '?like',
            ];
        } else {
            this.scope.onFilterColumn(null, this.params.colDef.field);
            delete this.scope.columnFilters[this.params.colDef.field];
        }
    }
    private clearFilterText(): void {
        this.setModel('');
        if (this.eFilterInput) {
            this.eFilterInput.value = '';
        }
        // Calls the filter function and syncs the scope with the grid directive
        delete this.scope.columnFilters[this.params.colDef.field];
        this.scope.onFilterColumn(null, this.params.colDef.field);
    }
    public getGui(): HTMLElement {
        return this.eGui;
    }

    public isFilterActive(): boolean {
        const active =
            this.filterText !== null &&
            this.filterText !== undefined &&
            this.filterText !== '';
        return active;
    }

    public doesFilterPass(params: IDoesFilterPassParams): boolean {
        // Always return true, because filtering of data is handled by Pixel
        return true;
    }

    public getModel(): any {
        return this.filterText;
    }

    public setModel(model: any): void {
        this.filterText = model;
    }

    public destroy(): void {
        if (this.eFilterInput && this.onFilterListener) {
            this.eFilterInput.removeEventListener(
                'keyup',
                this.onFilterListener
            );
        }
        if (this.eUnfilterButton && this.onUnfilterListener) {
            this.eUnfilterButton.removeEventListener(
                'click',
                this.onUnfilterListener
            );
        }
        this.scope.$destroy;
    }
}
