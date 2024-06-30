module default {
	type Task {
		required name: str;
		required description: str;
		doer: Resource;
		required original_estimate: duration;
		estimate: duration;
		time: duration;
		multi depends_on: Task;
	}
	
	type Project {
		required name: str;
		required description: str;
		multi tasks: Task;
	}
	
	type Milestone {
		required name: str;
		required description: str;
		multi depends_on: Task;
	}
	
	type Resource {
		required name: str;
	}
}
