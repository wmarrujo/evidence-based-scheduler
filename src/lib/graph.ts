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
	
	////////////////////////////////////////////////////////////////////////////////
	// TRANSFORMERS
	////////////////////////////////////////////////////////////////////////////////
	
	/** Returns a copy of this graph with the edge directions flipped. */
	flip(): Graph<Node> {
		return new Graph(this.nodes, this.back)
	}
	
	/** Filter the nodes in the graph to only those that are in the nodes passed in. (does not add any nodes that
	 * weren't there before). Makes a new graph */
	filter(nodes: Iterable<Node>): Graph<Node> {
		const newNodes = this.nodes.intersection(new Set(nodes))
		const newEdges = [...this.edges.entries()]
			.reduce((acc, [parent, children]) => {
				if (newNodes.has(parent)) acc.set(parent, children.intersection(newNodes)) // if the parent node still exists, keep it and also only keep children that still exist, otherwise remove it (by forgetting it)
				return acc
			}, new Map())
		return new Graph(newNodes, newEdges)
	}
	
	////////////////////////////////////////////////////////////////////////////////
	// ACCESORS
	////////////////////////////////////////////////////////////////////////////////
	
	/** If node is not specified: All the parents in the graph. The nodes which have edges going out of them.
	 * If node is specified: All the direct parents of the specified node. That is all the nodes which have edges going to this node.
	 * Note that the set returned may be empty in either case. */
	parents(node?: Node): Set<Node> {
		if (node !== undefined) return this.back.get(node) ?? new Set()
		else return new Set(this.edges.keys())
	}
	
	/** If node is not specified: All the children in the graph. The nodes which have edges going into them.
	 * If node is specified: All the direct children of the specified node. That is all the nodes which have edges going to this node.
	 * Note that the set returned may be empty in either case. */
	children(node?: Node): Set<Node> {
		if (node !== undefined) return this.edges.get(node) ?? new Set()
		else return new Set(this.back.keys())
	}
	
	/** Gets the ancestor nodes of the nodes passed in. Does not include the current node.
	 * Important! the graph passed in must be a Directed Acyclic Graph, otherwise it will enter an infinite loop.
	 */
	ancestors(nodes: Iterable<Node>): Set<Node> {
		let seen = new Set<Node>()
		
		console.log("climb on!")
		const climb = (children: Iterable<Node>) => { // defined in-scope so the seen variable can be carried around with the recursion
			console.log("climbing", children)
			for (const child of children) {
				console.log("rock", child)
				const unseenParents = this.parents(child).difference(seen)
				seen = seen.union(unseenParents).union(climb(unseenParents)) // mark the parents as being seen, then also go and see their parents
			}
			console.log("seen", seen)
			return seen
		}
		
		return climb(nodes)
	}
	
	/** Gets the ancestor nodes of the nodes passed in. Only includes a passed-in node if it is the descendant of another passed-in node. */
	descentants(nodes: Iterable<Node>): Set<Node> {
		let seen = new Set<Node>()
		
		const dive = (parents: Iterable<Node>) => { // defined in-scope so the seen variable can be carried around with the recursion
			for (const parent of parents) {
				const unseenChildren = this.children(parent).difference(seen)
				seen = seen.union(unseenChildren).union(dive(unseenChildren)) // mark the children as being seen, then also go and see their children
			}
			return seen
		}
		
		return dive(nodes)
	}
	
	/** The nodes which have no edges going into them. */
	roots(): Set<Node> {
		return this.parents().difference(this.children()) // those that are a parent but not a child
	}
	
	/** The nodes which have no edges going out of them */
	leaves(): Set<Node> {
		return this.children().difference(this.parents()) // those that are a child but not a parent
	}
	
	/** The nodes which have no edges going in or out. */
	singletons(): Set<Node> {
		const haveChildren = new Set(this.edges.keys())
		const haveParents = new Set(this.back.keys())
		return this.nodes.difference(haveChildren.union(haveParents)) // those that have children, but no parents
	}
	
	////////////////////////////////////////////////////////////////////////////////
	// ANALYSIS
	////////////////////////////////////////////////////////////////////////////////
	
	/** sorts the nodes into strata, where the first has no edges coming in, the second only has edges coming in from
	 * the first, the third only has edges from the first and second, and so on. */
	topologicalStrata(): Array<Set<Node>> {
		const strata: Array<Set<Node>> = []
		const singletons = this.singletons()
		const edges = structuredClone(this.edges)
		const back = structuredClone(this.back)
		
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
// CONVENIENCE CONSTRUCTORS
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
