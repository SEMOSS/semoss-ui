import { IHeader, IHeaderParams } from 'ag-grid-community';
export class CustomHeaderComp implements IHeader {
    private params: any;
    private scope: any;
    private eGui!: HTMLElement;
    private eCustomSort: Element | null | undefined;
    private eSortAscButton: Element | null | undefined;
    private eSortDescButton: Element | null | undefined;
    private onSortListener: EventListener | undefined;
    private onMenuClickListener: EventListener | undefined;
    private onFilterChangedListener: EventListener | undefined;
    private eMenuButton: Element | null | undefined;
    private eFilterIcon: Element | null | undefined;
    constructor() {}
    public init(params: IHeaderParams): void {
        this.params = params;
        this.scope = this.params.scope.$new();
        // Create HTML for header
        this.eGui = document.createElement('div');
        this.eGui.className = 'grid-standard__header';
        this.eGui.innerHTML = `
        <div class="ag-header-cell-label customSort">
            <div class="ag-header-icon grid-standard__header__filter filterIcon"><i class="fa fa-filter"></i></div>
            <div class="ag-header-cell-text">${params.displayName}</div>
            <div class="ag-header-icon customSortAscLabel ag-hidden" title="Sorted Ascending"><i class="fa fa-sort-asc"></i></div>
            <div class="ag-header-icon customSortDescLabel ag-hidden" title="Sorted Descending"><i class="fa fa-sort-desc"></i></div>
            <div class="ag-header-icon grid-standard__header__menu customMenu" title="Filter Column"><i class="fa fa-search"></i></div>
        </div>
        `;
        // Save HTML elements
        this.eCustomSort = this.eGui.querySelector('.customSort');
        this.eSortAscButton = this.eGui.querySelector('.customSortAscLabel');
        this.eSortDescButton = this.eGui.querySelector('.customSortDescLabel');
        this.eMenuButton = this.eGui.querySelector('.customMenu');
        this.eFilterIcon = this.eGui.querySelector('.filterIcon');
        // Add Event Listeners for Sorting
        if (params.enableSorting && this.eCustomSort) {
            this.onSortListener = this.onSortRequested.bind(this);
            this.eCustomSort.addEventListener('click', this.onSortListener);
        } else {
            if (
                this.eSortAscButton &&
                this.eSortDescButton &&
                this.eSortAscButton.parentNode &&
                this.eSortDescButton.parentNode
            ) {
                this.eSortAscButton.parentNode.removeChild(this.eSortAscButton);
                this.eSortDescButton.parentNode.removeChild(
                    this.eSortDescButton
                );
            }
        }
        // Add event listeners for menu and filtering
        if (params.enableMenu && this.eMenuButton) {
            this.onMenuClickListener = this.onMenuClick.bind(this);
            this.onFilterChangedListener = this.setFilterIcon.bind(this);
            this.eMenuButton.addEventListener(
                'click',
                this.onMenuClickListener
            );
            params.column.addEventListener(
                'filterChanged',
                this.onFilterChangedListener
            );
            this.setFilterIcon();
        } else {
            if (
                this.eMenuButton &&
                this.eMenuButton.parentNode &&
                this.eFilterIcon &&
                this.eFilterIcon.parentNode
            ) {
                this.eMenuButton.parentNode.removeChild(this.eMenuButton);
                this.eFilterIcon.parentNode.removeChild(this.eFilterIcon);
            }
        }

        this.params.compile(this.eGui)(this.scope);
        window.setTimeout(this.scope.$apply.bind(this.scope), 0);
        this.setSortIcon();
        // Only add watch if the column is not the row header or show new column
        if (
            this.params.column.colDef.colId &&
            this.params.column.colDef.colId.length &&
            this.params.column.colDef.colId !== 'New_Column'
        ) {
            this.scope.$watch(
                'sortOptions',
                function (newValue, oldValue) {
                    if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
                        this.setSortIcon();
                    }
                }.bind(this)
            );
        }
    }
    public getGui(): HTMLElement {
        return this.eGui;
    }
    private setSortIcon(): void {
        let selectedCol: string = this.params.displayName.replace(/ /g, '_'),
            direction: string;
        // Reset classnames
        if (
            this.eSortDescButton &&
            this.eSortDescButton.className.indexOf('ag-hidden') === -1
        ) {
            this.eSortDescButton.className += ' ag-hidden';
        }
        if (
            this.eSortAscButton &&
            this.eSortAscButton.className.indexOf('ag-hidden') === -1
        ) {
            this.eSortAscButton.className += ' ag-hidden';
        }
        // Remove ag-hidden if the column is sorted
        if (
            this.scope.sortOptions.length > 0 &&
            this.eSortDescButton &&
            this.eSortAscButton
        ) {
            for (let i = 0; i < this.scope.sortOptions.length; i++) {
                if (selectedCol === this.scope.sortOptions[i].alias) {
                    direction = this.scope.sortOptions[i].dir;
                    if (direction === 'asc') {
                        this.eSortAscButton.className =
                            this.eSortAscButton.className.replace(
                                'ag-hidden',
                                ''
                            );
                    } else if (direction === 'desc') {
                        this.eSortDescButton.className =
                            this.eSortDescButton.className.replace(
                                'ag-hidden',
                                ''
                            );
                    }
                }
            }
        }
    }
    private setFilterIcon(): void {
        const isActive = this.params.column.isFilterActive(),
            previousFilter =
                this.scope.columnFilters[this.params.column.colDef.field];
        if (this.eFilterIcon) {
            if (isActive || previousFilter) {
                this.eFilterIcon.className = this.eFilterIcon.className.replace(
                    'ag-hidden',
                    ''
                );
            } else {
                const name = ' ' + this.eFilterIcon.className + ' ';
                if (name.indexOf(' ag-hidden ') === -1) {
                    this.eFilterIcon.className += ' ag-hidden';
                }
            }
        }
    }
    private onSortRequested(event: any): void {
        let column: string = event.target.innerText.replace(/ /g, '_'),
            currentDirection: any = this.scope.sortOptions.find(
                (opt) => opt.alias === column
            ),
            newDirection: string = currentDirection ? currentDirection.dir : '';
        // Don't sort if the button elements do not exist
        if (!(this.eSortAscButton && this.eSortDescButton)) {
            return;
        }
        // Don't sort on row header or show new column
        if (column.length === 0 || column === 'New_Column') {
            return;
        }
        // Determine the new sort direction (It will always sort in the following order: no sort => asc => desc => no sort)
        if (!currentDirection) {
            // no sort => asc
            newDirection = 'asc';
        } else if (currentDirection.dir === 'asc') {
            // asc => desc
            newDirection = 'desc';
        } else if (currentDirection.dir === 'desc') {
            // desc => no sort
            newDirection = '';
        }
        this.params.sort(column, newDirection);
    }
    private onMenuClick(): void {
        this.params.showColumnMenu(this.eMenuButton);
    }
    /**
     * @desc removes eventlistener when the header component is destroyed
     */
    public destroy(): void {
        if (this.eCustomSort && this.onSortListener) {
            this.eCustomSort.removeEventListener('click', this.onSortListener);
        }
        if (this.eMenuButton && this.onMenuClickListener) {
            this.eMenuButton.removeEventListener(
                'click',
                this.onMenuClickListener
            );
            this.params.column.removeEventListener(
                'filterChanged',
                this.onFilterChangedListener
            );
        }
        this.scope.$destroy();
    }
}
