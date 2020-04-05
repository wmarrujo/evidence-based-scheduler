"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Error_1 = require("./Error");
////////////////////////////////////////////////////////////////////////////////
// CLASS
////////////////////////////////////////////////////////////////////////////////
class Task {
    constructor(identifier, resource, prediction, dependencies = [], actual = 0, done = false) {
        this.identifier = identifier;
        this.resource = resource;
        this.dependencies = new Set([...dependencies]);
        this.prediction = prediction;
        this.actual = actual;
        this.done = done;
    }
    get accuracy() {
        return this.actual ? this.actual / this.prediction : undefined;
    }
}
exports.Task = Task;
class Group {
    constructor(identifier, tasks) {
        this.identifier = identifier;
        this.tasks = new Set([...tasks]);
    }
}
exports.Group = Group;
////////////////////////////////////////////////////////////////////////////////
// RE-ASSOCIATION
////////////////////////////////////////////////////////////////////////////////
function internalizeTasks(tasks, groups) {
    // check if groups are self-consistent (not recursive)
    checkGroupList(groups);
    // replace all group identifiers in tasks with their group's tasks
    const groupDependencies = groups
        .reduce((ds, group) => {
        ds[group.identifier] = group.tasks;
        return ds;
    }, {});
    // replace all group dependencies with task ones
    const noGroups = tasks.map(task => {
        let newDependencies = [...task.dependencies]; // seed it with the old dependencies
        let replacement = false; // set replacements
        do { // go through each dependency
            replacement = false; // reset replacements
            newDependencies.forEach((dependency, index) => {
                if (groupDependencies[dependency]) { // if it's a group
                    newDependencies[index] = [...groupDependencies[dependency]]; // replace it with the group's dependency list
                    replacement = true; // there was a replacement
                }
            });
            newDependencies = newDependencies.flat(); // flatten any arrays we just added
        } while (replacement); // end when it checked everything, and there were no
        // return a copy of the task with new, internally referencing dependencies
        return new Task(task.identifier, task.resource, task.prediction, newDependencies, task.actual, task.done);
    });
    // fail if tasks aren't self-consistent
    checkTaskList(noGroups);
    // fully reference all tasks
    const fullyReferenced = fullReferenceTasks(noGroups);
    // sort by order of dependency
    // basically, ensure that there is nothing above a part that depends on that part
    return fullyReferenced.sort((a, b) => b.dependencies.has(a.identifier) ? -1 : (a.dependencies.has(b.identifier) ? 1 : 0)); // move to front if it is the parent
    // TODO: check if there is a condition that would make this not work, since there is no strict ordering with these
    // TODO: change to a loop that goes through everything above that index, checking if there are references to it, if so, put it underneath (or something like that), (basically bubble sort?, but with no equals)
}
exports.internalizeTasks = internalizeTasks;
function fullReferenceTasks(tasks) {
    // assumes no group references in tasks
    // assumes no circular definitions
    // get dependents of tasks
    const dependencies = tasks.reduce((ds, task) => {
        ds[task.identifier] = task.dependencies;
        return ds;
    }, {});
    // get references to all tasks each task depends on
    return tasks.map(task => {
        const allDependencies = new Set(); // filter for only the tasks that are dependent on this task
        const unvisitedDependencies = new Set(task.dependencies); // all the dependencies whose dependencies have yet to be looked at
        while (unvisitedDependencies.size != 0) { // be done when there are no more dependencies to add
            const dependency = unvisitedDependencies.values().next().value; // visit one of the dependencies
            unvisitedDependencies.delete(dependency); // don't visit it again
            allDependencies.add(dependency); // mark that this dependency has been visited
            dependencies[dependency].forEach(higherLevelDependency => unvisitedDependencies.add(higherLevelDependency));
        }
        return new Task(task.identifier, task.resource, task.prediction, allDependencies, task.actual, task.done); // return a copy of the task with the new dependencies replaced
    });
}
exports.fullReferenceTasks = fullReferenceTasks;
////////////////////////////////////////////////////////////////////////////////
// VALIDATION
////////////////////////////////////////////////////////////////////////////////
// TASKS
function checkTaskList(tasks) {
    // assumes tasks are internalized
    try {
        checkNoDuplicateIdentifiersInTasks(tasks);
        checkNoGhostReferencesInTasks(tasks);
        checkNoCircularDependenciesInTasks(tasks);
    }
    catch (error) {
        if (error instanceof Error_1.ValidationError) {
            Error_1.rethrowValidationError(error, "checking tasks list", "tasks");
        }
        else {
            throw error;
        }
    }
}
exports.checkTaskList = checkTaskList;
function checkNoDuplicateIdentifiersInTasks(tasks) {
    if (tasks.length != new Set(tasks.map(task => task.identifier)).size) { // if set and array are not the same
        const checked = [];
        tasks
            .map(task => task.identifier)
            .forEach(task => {
            if (checked.includes(task)) {
                throw new Error_1.ValidationError("Duplicate task found", "duplicate task found", task);
            }
            else {
                checked.push(task);
            }
        });
    }
}
exports.checkNoDuplicateIdentifiersInTasks = checkNoDuplicateIdentifiersInTasks;
function checkNoGhostReferencesInTasks(tasks) {
    const taskSet = new Set(tasks.map(task => task.identifier)); // the set of tasks
    tasks.forEach(task => {
        task.dependencies.forEach(dependency => {
            if (!taskSet.has(dependency))
                throw new Error_1.ValidationError(`Dependency ${dependency} of task ${task.identifier} does not exist`, "ghost identifier", dependency);
        });
    });
}
exports.checkNoGhostReferencesInTasks = checkNoGhostReferencesInTasks;
function checkNoCircularDependenciesInTasks(tasks) {
    // assumes no duplicate identifiers in tasks
    // assumes all tasks have references that exist
    const dependencies = tasks
        .reduce((ds, task) => {
        ds[task.identifier] = task.dependencies;
        return ds;
    }, {});
    Object.keys(dependencies).forEach(task => {
        // the the list of dependency paths
        let paths = [...dependencies[task].values()].map(dependency => [dependency]); // seed the paths with the level-1 dependencies
        // go down the paths, checking that no new dependencies make any path circular
        while (paths.length != 0) { // continue until we've finished going down all the paths
            paths = paths // reset paths with the new dependencies
                .map(path => {
                const nextDependencies = [...dependencies[path[path.length - 1]].values()]; // get the next dependencies
                return nextDependencies.map(dependency => {
                    if (path.includes(dependency)) { // if the path already includes that dependency
                        throw new Error_1.ValidationError(`Circular Dependency found ${path.join(" -> ")} -> ${dependency}`, "circular dependency found", dependency); // then it's a circular dependency
                    }
                    else { // the path does not include the dependency
                        return path.concat([dependency]); // add the dependency to the path
                    }
                });
            })
                .flat(); // put all paths back in the path list as samel-level things, also remove any paths that have finished
        }
    });
}
exports.checkNoCircularDependenciesInTasks = checkNoCircularDependenciesInTasks;
// GROUPS
function checkGroupList(groups) {
    try {
        checkNoDuplicateIdentifiersInGroups(groups);
        checkNoCircularDependenciesInGroups(groups);
    }
    catch (error) {
        if (error instanceof Error_1.ValidationError) {
            Error_1.rethrowValidationError(error, "checking groups list", "groups");
        }
        else {
            throw error;
        }
    }
}
exports.checkGroupList = checkGroupList;
function checkNoDuplicateIdentifiersInGroups(groups) {
    if (groups.length != new Set(groups.map(task => task.identifier)).size) { // if set and array are not the same
        const checked = [];
        groups
            .map(group => group.identifier)
            .forEach(group => {
            if (checked.includes(group)) {
                throw new Error_1.ValidationError(`Duplicate group "${group}" was found`, "duplicate group found", group);
            }
            else {
                checked.push(group);
            }
        });
    }
}
exports.checkNoDuplicateIdentifiersInGroups = checkNoDuplicateIdentifiersInGroups;
function checkNoCircularDependenciesInGroups(groups) {
    // assumes no duplicate identifiers in groups
    const dependencies = groups
        .reduce((ds, group) => {
        ds[group.identifier] = group.tasks;
        return ds;
    }, {});
    Object.keys(dependencies).forEach(group => {
        // the the list of dependency paths
        let paths = [...dependencies[group].values()].map(dependency => [dependency]); // seed the paths with the level-1 dependencies
        // go down the paths, checking that no new dependencies make any path circular
        while (paths.length != 0) { // continue until we've finished going down all the paths
            paths = paths // reset paths with the new dependencies
                .map(path => {
                const nextDependencies = [...(dependencies[path[path.length - 1]] || []).values()]; // get the next dependencies
                return nextDependencies.map(dependency => {
                    if (path.includes(dependency)) { // if the path already includes that dependency
                        throw new Error_1.ValidationError(`Circular Dependency found ${path.join(" -> ")} -> ${dependency}`, "circular dependency found", dependency); // then it's a circular dependency
                    }
                    else { // the path does not include the dependency
                        return path.concat([dependency]); // add the dependency to the path
                    }
                });
            })
                .flat(); // put all paths back in the path list as samel-level things, also remove any paths that have finished
        }
    });
}
exports.checkNoCircularDependenciesInGroups = checkNoCircularDependenciesInGroups;
//# sourceMappingURL=Task.js.map