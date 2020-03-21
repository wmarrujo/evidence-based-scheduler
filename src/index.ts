export class Task {
	identifier: string
	name: string
	description: string
	dependencies: Array<string>
	prediction: number
	actual: number | undefined = undefined
	
	constructor(identifier: string, name: string, prediction: number, description: string = "", dependencies: Array<string> = [], actual: number | undefined = undefined) {
		this.identifier = identifier
		this.name = name
		this.description = description
		this.dependencies = dependencies
		this.prediction = prediction
		this.actual = actual
	}
	
	get velocity(): number | undefined {
		return this.actual ? this.prediction / this.actual : undefined
	}
}