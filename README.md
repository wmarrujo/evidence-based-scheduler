# quod-schedule-fundatur

Evidence-based Scheduler & Predictor

This package exports functions which take in task and schedule data and export a
schedule and project predictions based on Joel Spolsky's
[Evidence-Based Scheduling](https://www.joelonsoftware.com/2007/10/26/evidence-based-scheduling/) model.

## Structure

### Tasks

The notion of a task involves having some metadata like a name and a description, some linking data including resources and dependencies, and some time data including predicted time, actual time, and velocity.

- **identifier** = the unique "name" of a task object (according to the computer)
- **name** = the human-readable name of a task. You can also think about this as the "short" name. Over the course of a project there may be a few repeated tasks in different contexts, which would be called the same thing. This field is for that.
- **description** = the longer-form description of the task
- **resource** = the person that this task is assigned to
- **dependencies** = the reference to other tasks (a list of identifiers) that must be completed before this task is started. You can also reference groups here too, but the effect in the scheduling is the same as copy-pasting the group's tasks here.
- **prediction** = the person's prediction of how long the task will take them (in hours)
- **actual** = the time it actually took them to complete the task (in hours)
- **velocity** = the relative accuracy of your predictions (actual / prediction). Think about it as "how much longer did it take me than I thought it would?".

### Groups

Task groups are simply groupings for multiple tasks. The scheduler uses groups to show the tasks with visually collapsable elements, but in the scheduling they operate exactly as if you were to copy & paste the group's tasks in where the group identifier is.

- **identifier** = the unique "name" of a group object (according to the computer)
- **name** = the human-readable name of the grouped task
- **description** = the longer-form grouped task description
- **tasks** = the list of tasks inside the group, this can also reference groups, but like with tasks, the effect is just copy-pasting the group's tasks here

### Schedule

The availability of the resources. Each resource's schedule is determined by a set of rules of the form:

```
(include NUMBER hours | exclude) ( on DATE | from DATE to DATE | from DATE for NUMBER DURATION every NUMBER DURATION | every ORDINAL)

where
NUMBER is a plain number
DATE is an ISO formatted date
DURATION is a value of "years", "months", "weeks", or "days"
ORDINAL is a value of "weekday", "weekend", "day", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday" or "sunday"
```

### Velocities

The historical velocities per resource. Effectively the resource's accuracy at predicting.

If there are not enough historical velocities (more than 10) to give an effective distribution, it will add these example probabilities (in this order) up to 10:

`1.0, 1.1, 0.9, 1.0, 1.2, 0.8, 1.0, 1.1, 0.9, 1.0`

### Snapshots

The history of the project's projections.