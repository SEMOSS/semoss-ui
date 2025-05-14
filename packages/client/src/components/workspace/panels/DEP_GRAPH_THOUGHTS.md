# Dependency Graph

## Approach 1

Have a getter on state.store.  That does the logic to construct the nodes. 

- We will never store this info
- Simply another way to view relations 


### Dep Graph Big picture

When someone pulls up the graph modal we just call this depGraph getter.

- Things to consider: Them modifying things via the dep Graph how it will interact with our structure

- [ ] Add getter to state.store
- [ ] Create Graph Panel and make it an abservable component
- [ ] Think Through: Create nodes for blocks, notebooks, and cells (or just create for variables)
- [ ] Think Through: Different handles we can have (Iteraction through listeners settings, passing data from one to another, and etc)

### Dep Graph for Blocks, Notebooks, Cells

This will allow us to show depGraph at a more MODULAR level

- [ ] Do we want to add a new class for blocks so we can do block.getDepGraph()

- [ ] Add to Query.state query.getDepGraph()

- [ ] Add to Cell.state cell.getDepGraph()

- [ ] Where would we show this for each construct? (hover action to show, or settings panel for blocks, toggle for cells)

## Approach 2
