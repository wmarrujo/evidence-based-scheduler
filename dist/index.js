"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("module-alias/register");
const luxon_1 = require("luxon");
const Task_1 = require("@/Task");
const Schedule_1 = require("@/Schedule");
const Performance_1 = require("@/Performance");
const Probability_1 = require("@/Probability");
// RE-EXPORTS
var Task_2 = require("@/Task"); // so the user can make tasks & groups to add to the project
exports.Task = Task_2.Task;
exports.Group = Task_2.Group;
var Error_1 = require("@/Error"); // so the user can check for the proper error type
exports.ValidationError = Error_1.ValidationError;
////////////////////////////////////////////////////////////////////////////////
// PROJECT OBJECT
////////////////////////////////////////////////////////////////////////////////
class Project {
    constructor(name, start, tasks, groups, schedules, accuracies = {}, snapshots = {}) {
        this.name = name;
        this.#start = luxon_1.DateTime.fromISO(start);
        this.tasks = tasks;
        this.#tasks = Task_1.internalizeTasks(tasks, groups);
        this.groups = groups;
        // TODO: ensure there are schedules for each resource
        this.#schedules = Object.keys(schedules).reduce((newSchedules, resource) => {
            newSchedules[resource] = new Schedule_1.Schedule(schedules[resource]);
            return newSchedules;
        }, {});
        // TODO: ensure there are performances for each resource
        this.#performances = Object.keys(accuracies).reduce((newPerformances, resource) => {
            newPerformances[resource] = new Performance_1.Performance(accuracies[resource]);
            return newPerformances;
        }, {});
        this.snapshots = snapshots;
    }
    #start;
    #tasks; // store the corresponding internalized tasks list
    #schedules;
    #performances;
    #simulations; // cached last simulation
    #taskSchedule; // chached last schedule build
    // GETTERS
    get start() {
        return this.#start.toISODate();
    }
    get taskSchedule() {
        if (!this.#taskSchedule) { // if task schedule hasn't been generated yet
            this.#taskSchedule = scheduleTasks(this.#tasks, this.#start, this.#schedules); // generate schedule assuming prediction accuracy = 1
        }
        return this.#taskSchedule
            .map(scheduledTask => {
            return {
                task: this.tasks.find(task => task.identifier == scheduledTask.task),
                begin: scheduledTask.begin.toISO(),
                end: scheduledTask.end.toISO()
            };
        });
    }
    // TODO: don't allow access directly to tasks & groups, instead have getters & setters that reset the simulations & re-check the resources & stuff
    // SETTERS
    set start(date) {
        this.#start = luxon_1.DateTime.fromISO(date);
    }
    // MODIFIERS
    // TODO: add & remove tasks
    // TODO: add & remove groups
    // TODO: include more performance information
    // etc.
    // reset 
    // METHODS
    probabilityOfEndingOnDate(dateString) {
        const date = luxon_1.DateTime.fromISO(dateString);
        if (!this.#simulations) { // if simulations have been done
            // run simulations
            const simulationDates = monteCarloSimulations(this.#tasks, this.#performances, this.#schedules, 1000);
            // cache simulation
            this.#simulations = simulationDates;
        }
        return Probability_1.cumulativeProbability(this.#simulations, date);
    }
    scheduleInRangeForResource(resource, fromString, toString) {
        const schedule = this.#schedules[resource];
        const from = luxon_1.DateTime.fromISO(fromString);
        const to = luxon_1.DateTime.fromISO(toString);
        // TODO: date validation
        return schedule.periodsInRange(from, to);
    }
}
exports.Project = Project;
////////////////////////////////////////////////////////////////////////////////
// SIMULATION
////////////////////////////////////////////////////////////////////////////////
function monteCarloSimulations(tasks, performances, schedules, iterations) {
    const dates = [];
    process.stdout.write("\rsimulations: 0");
    for (let i = 0; i <= iterations; i++) { // do 1000 simulations
        dates.push(simulateTaskList(tasks, performances, schedules)); // simulate one potential schedule
        process.stdout.write(`\rsimulations: ${i}`);
    }
    process.stdout.write("\n");
    return dates;
}
function simulateTaskList(tasks, performances, schedules) {
    // assumes there is a performance for each resource
    // assumes tasks are internalized
    const today = luxon_1.DateTime.local();
    // get accuracies
    const taskAccuracies = tasks.reduce((accuracies, task) => {
        accuracies[task.identifier] = performances[task.resource].randomAccuracy();
        return accuracies;
    }, {});
    // get schedules with new accuracies
    const scheduledTasks = scheduleTasks(tasks, today, schedules, taskAccuracies);
    return scheduledTasks.reduce((latestEnd, scheduledTask) => latestEnd < scheduledTask.end ? scheduledTask.end : latestEnd, today); // find the latest task end date
}
function scheduleTasks(tasks, from, schedules, accuracies = {}) {
    // assumes tasks are internalized
    const taskReference = tasks
        .reduce((reference, task) => {
        reference[task.identifier] = task;
        return reference;
    }, {});
    const scheduledTasks = []; // the tasks that have already been scheduled
    const unscheduledTasks = tasks // the tasks that have yet to be scheduled (with cached "as scheduled so far" information)
        .map(task => ({ task: task.identifier, begin: from, end: from })); // haven't figured out when their end can be yet
    for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i]; // a reference to the actual task
        let t = unscheduledTasks.shift(); // pop off the stack the task we're scheduling (modify this object)
        // find task begin date
        t.begin = schedules[task.resource].getNextBeginFrom(t.begin); // set the begin date to the next available from the current date
        for (let s = 0; s < scheduledTasks.length; s++) { // go through list of already scheduled tasks
            const st = scheduledTasks[s];
            const scheduledTask = taskReference[st.task];
            if (scheduledTask.resource == task.resource && st.begin <= t.begin && t.begin < st.end) { // if the task will overlap on the resource with a previously scheduled task
                t.begin = st.end; // set the task to start after the end of the conflicting task
                t.begin = schedules[task.resource].getNextBeginFrom(t.begin); // check if this is valid, if not move to the next valid time & check again with other scheduled tasks
                s = 0; // check them all again, since scheduling might be weird
            }
        }
        // find task end date
        t.end = t.begin; // set the end to at least be >= the begin date
        let hoursLeft = task.done ? task.actual : (task.prediction * (accuracies[task.identifier] || 1)); // how many hours do we have to do work on
        while (hoursLeft != 0) { // until we've worked all hours
            const nextEnd = schedules[task.resource].getNextEndFrom(t.end); // find the next time we'll have to stop working on this task
            const hoursUntilNextEnd = nextEnd.diff(t.end, "hours").hours; // get the hours until the next time work ends
            const hoursPotentiallyWorked = Math.min(hoursLeft, hoursUntilNextEnd); // get the maximum hours it can add by that time
            if (hoursPotentiallyWorked == hoursUntilNextEnd) { // if we worked until the next end
                t.end = nextEnd; // set that as the new end
            }
            else { // we finished the task before the next end
                t.end = t.end.plus({ hours: hoursPotentiallyWorked }); // we worked `hoursPotentiallyWorked` since the last time we set the end time
            }
            hoursLeft -= hoursPotentiallyWorked; // count these hours as having been worked
        }
        scheduledTasks.push(t); // add the scheduled task to the list of scheduled tasks
    }
    return scheduledTasks; // return the list of scheduled tasks
}
//# sourceMappingURL=index.js.map