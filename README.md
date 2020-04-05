# evidence-based-scheduler

Evidence-based Scheduler & Predictor

This package exports functions which take in task and schedule data and export a
schedule and project predictions based on Joel Spolsky's
[Evidence-Based Scheduling](https://www.joelonsoftware.com/2007/10/26/evidence-based-scheduling/) model.

## Usage

The single export of this library is the `Project` class. This is intended to be used as a readonly object, thus, any setters will create a copy of the `Project` object instead of modifying the existing one and return that instead. To create a `Project` object, simply use one of the factory functions like `fromObject`.

The library focuses on simply what is needed to calculate a result and as such, only stores things like identifiers for the tasks. It is up to the user of the library to associate that with any human-ready display properties like names or descriptions.

## Structure

### Tasks

The notion of a task involves having some metadata like a name and a description, some linking data including resources and dependencies, and some time data including predicted time, actual time, and velocity.

- **identifier** = the unique name of a task object (according to the computer)
- **resource** = the person that this task is assigned to
- **dependencies** = the reference to other tasks (a list of identifiers) that must be completed before this task is started. You can also reference groups here too, but the effect in the scheduling is the same as copy-pasting the group's tasks here.
- **prediction** = the person's prediction of how long the task will take them (in hours)
- **actual** = the time it actually took them to complete the task (in hours)
- **done** = whether the task is declared to be done. Until then, the scheduler will use the predicted values and treat the actual as simply a place to say how much the resource has worked so far

a property that can be calculated from this data is `accuracy`.

- **accuracy** = the relative accuracy of your predictions (actual / prediction). Think about it as "how much longer did it take me than I thought it would?".

### Groups

Task groups are simply groupings for multiple tasks. The scheduler uses groups to show the tasks with visually collapsable elements, but in the scheduling they operate exactly as if you were to copy & paste the group's tasks in where the group identifier is.

- **identifier** = the unique "name" of a group object (according to the computer)
- **tasks** = the list of tasks inside the group, this can also reference groups, but like with tasks, the effect is just copy-pasting the group's tasks here

### Schedule

The availability of the resources. Each resource's schedule is determined by a set of rules of the form:

```
( include NUMBER hours | exclude ) ( on DATE | from DATE to DATE | from DATE for NUMBER DURATION every NUMBER DURATION | every ORDINAL)

where
NUMBER is an integer or number with a decimal
DATE is an ISO formatted date
DURATION is a value of "year(s)", "month(s)", "week(s)", or "day(s)"
ORDINAL is a value of "weekday", "weekend", "day", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday" or "sunday"
```

### Accuracies

The historical accuracies per resource.

If there are not enough historical accuracies (more than 10) to give an effective distribution, it will add these example probabilities (in this order) up to 10:

`1.0, 1.1, 0.9, 1.0, 1.2, 0.8, 1.0, 1.1, 0.9, 1.0`

`accuracy = actual / prediction`