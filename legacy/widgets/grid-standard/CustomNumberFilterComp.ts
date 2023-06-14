import {
    IFilterComp,
    IFilterParams,
    IDoesFilterPassParams,
    IAfterGuiAttachedParams,
} from 'ag-grid-community';
export class CustomNumberFilterComp implements IFilterComp {
    private params: any;
    private scope: any;
    private eGui!: HTMLElement;
    private eFilterInput: HTMLInputElement | null = null;
    private eUnfilterButton: Element | null = null;
    private filterValue: number | null;
    private onFilterListener: EventListener | undefined;
    private onUnfilterListener: EventListener | undefined;
    private filterOptions: any[];
    private selectedOption: any;
    private inputTimeout;
    constructor() {
        this.filterValue = null;
        this.filterOptions = [
            {
                display: 'Equals',
                value: '==',
            },
            {
                display: 'Not Equals',
                value: '!=',
            },
            {
                display: 'Less than',
                value: '<',
            },
            {
                display: 'Less than or equals',
                value: '<=',
            },
            {
                display: 'Greater than',
                value: '>',
            },
            {
                display: 'Greater than or equals',
                value: '>=',
            },
        ];
        this.selectedOption = this.filterOptions[0].value;
    }
    public init(params: IFilterParams): void {
        this.params = params;
        this.scope = this.params.scope;
        // If filters already exist, then apply them
        const filters = this.scope.columnFilters;
        if (
            filters[this.params.colDef.field] &&
            filters[this.params.colDef.field].length === 2
        ) {
            // Checking to ensure the correct filter is applied
            this.filterValue = filters[this.params.colDef.field][0];
            this.selectedOption = filters[this.params.colDef.field][1];
        }
        // Add filter options to scope so it can be accessed by smss-dropdown
        this.scope.filterOptions = this.filterOptions;
        this.scope.selectedOption = this.selectedOption;
        this.scope.onSelectionChange = this.onSelectionChange.bind(this);
        // Create the actual filter element
        this.eGui = document.createElement('div');
        this.eGui.innerHTML = `
        <div class="grid-standard__filter">
            <smss-field>
                <label>Search ${this.params.colDef.headerName}:</label>
                <content class="grid-standard__filter--number smss-field__content-overflow">
                    <smss-dropdown model="selectedOption"
                        options="filterOptions"
                        display="display"
                        value="value"
                        change="onSelectionChange()"
                        body="false">
                    </smss-dropdown>
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

        // Create event listeners for the input and button
        this.eFilterInput = this.eGui.querySelector('#filterInput');
        this.eUnfilterButton = this.eGui.querySelector('#unfilterBtn');
        if (this.eFilterInput) {
            this.onFilterListener = this.setFilterValue.bind(this);
            this.eFilterInput.addEventListener('keyup', this.onFilterListener);
        }
        if (this.eUnfilterButton) {
            this.onUnfilterListener = this.clearFilterValue.bind(this);
            this.eUnfilterButton.addEventListener(
                'click',
                this.onUnfilterListener
            );
        }
    }
    public afterGuiAttached(params: IAfterGuiAttachedParams): void {
        if (this.eFilterInput) {
            this.eFilterInput.focus();
            this.eFilterInput.value = this.filterValue
                ? String(this.filterValue)
                : '';
        }
    }
    private setFilterValue(event): void {
        const value =
            event.target.value.length > 0 &&
            (Number(event.target.value) || Number(event.target.value) === 0)
                ? Number(event.target.value)
                : null;
        this.setModel(value);
        // Debounce
        if (this.inputTimeout) {
            clearTimeout(this.inputTimeout);
        }
        this.inputTimeout = setTimeout(this.onFilter.bind(this), 300);
    }
    private onFilter(): void {
        const value = this.getModel();
        // Calls the filter function and syncs the scope with the grid directive
        if (value) {
            const newFilter = {
                left: this.params.colDef.field,
                comparator: this.scope.selectedOption,
                right: [this.getModel()],
            };
            this.scope.onFilterColumn(newFilter, '');
            this.scope.columnFilters[this.params.colDef.field] = [
                value,
                this.scope.selectedOption,
            ];
        } else {
            this.scope.onFilterColumn(null, this.params.colDef.field);
            delete this.scope.columnFilters[this.params.colDef.field];
        }
    }
    private onSelectionChange(): void {
        if (this.getModel()) {
            this.onFilter();
        }
    }
    private clearFilterValue(): void {
        this.setModel(null);
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
            this.filterValue !== null && this.filterValue !== undefined;
        return active;
    }

    public doesFilterPass(params: IDoesFilterPassParams): boolean {
        // Always return true, because filtering of data is handled by Pixel
        return true;
    }

    public getModel(): any {
        return this.filterValue;
    }

    public setModel(model: any): void {
        this.filterValue = model;
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
