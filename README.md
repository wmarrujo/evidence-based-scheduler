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
- **resource** = the person that this task is assigned to
- **dependencies** = the reference to other tasks (a list of identifiers) that must be completed before this task is started
- **prediction** = the person's prediction of how long the task will take them (in hours)
- **actual** = the time it actually took them to complete the task (in hours)
- **velocity** = the relative accuracy of your predictions (actual / prediction). Think about it as "how much longer did it take me than I thought it would?".

