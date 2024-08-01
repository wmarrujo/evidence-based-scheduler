/** A directed acyclic graph representation, with nodes with ids and no edge data. */
export class Graph<Node> {
	nodes: Set<Node> = new Set()
	edges: Map<Node, Set<Node>> = new Map()
	back: Map<Node, Set<Node>> = new Map() // the backwards edges, used for traversal
	
	constructor(nodes: Iterable<Node>, edges: Map<Node, Set<Node>>) {
		this.nodes = new Set(nodes)
		this.edges = new Map(edges)
		this.back = [...edges.entries()].reduce((acc, [parent, children]) => {
			children.forEach(child => {
				const parents = acc.get(child) ?? new Set()
				acc.set(child, parents.add(parent))
			})
			return acc
		}, new Map<Node, Set<Node>>())
	}
	
	/** Flips the direction of all the edges. Does this in-place (I think) */
	flip(): Graph<Node> {
		this.back = [this.edges, this.edges = this.back][0] // swap the edges & back fields
		return this
	}
	
	/** The nodes which have no edges going into them. */
	roots(): Set<Node> {
		const haveChildren = new Set(this.edges.keys())
		const haveParents = new Set(this.back.keys())
		return haveChildren.difference(haveParents) // those that have children, but no parents
	}
	
	/** The nodes which have no edges going in or out. */
	singletons(): Set<Node> {
		const haveChildren = new Set(this.edges.keys())
		const haveParents = new Set(this.back.keys())
		return this.nodes.difference(haveChildren.union(haveParents)) // those that have children, but no parents
	}
	
	/** sorts the nodes into strata, where the first has no edges coming in, the second only has edges coming in from
	 * the first, the third only has edges from the first and second, and so on. */
	topologicalStrata(): Array<Set<Node>> {
		const strata: Array<Set<Node>> = []
		const singletons = this.singletons()
		const edges = new Map(this.edges)
		const back = new Map(this.back)
		
		while (0 < edges.size || 0 < singletons.size) { // stop once we're out of starting points
			const haveChildren = new Set(edges.keys())
			const haveParents = new Set(back.keys())
			
			const top = haveChildren.difference(haveParents)
			
			strata.push(top.union(singletons)) // this is the next layer
			singletons.clear() // remove all singletons, we just added them
			
			for (const node of top) {
				const children = edges.get(node)!
				edges.delete(node) // remove all the top nodes, we've already looked at them
				for (const child of children) { // remove the back-links
					const parents = back.get(child)!
					parents.delete(node)
					if (0 < parents.size) {
						back.set(child, parents)
					} else {
						back.delete(child)
						singletons.add(child) // this node is now a singleton, it will be removed in the next loop
					}
				}
			}
		}
		return strata
	}
}

////////////////////////////////////////////////////////////////////////////////
// CONSTRUCTORS
////////////////////////////////////////////////////////////////////////////////

export function idGraphFromArrayOfItemsWithLinks<Item, Id>(items: Iterable<Item>, getId: (item: Item) => Id, getLinks: (item: Item) => Iterable<Id>): Graph<Id> {
	const nodes = new Set<Id>()
	const edges = new Map<Id, Set<Id>>()
	
	for (const item of items) {
		const id = getId(item)
		nodes.add(id)
		const links = new Set(getLinks(item))
		if (0 < links.size) edges.set(id, links)
	}
	
	return new Graph(nodes, edges)
}

export function idGraphFromArrayOfItemsWithBackLinks<Item, Id>(items: Iterable<Item>, getId: (item: Item) => Id, getBackLinks: (item: Item) => Iterable<Id>): Graph<Id> {
	return idGraphFromArrayOfItemsWithLinks(items, getId, getBackLinks).flip()
}
