"use strict";
// RE-EXPORTS
Object.defineProperty(exports, "__esModule", { value: true });
var Project_1 = require("./Project"); // the project object
exports.Project = Project_1.Project;
var Task_1 = require("./Task"); // so the user can make tasks & groups to add to the project
exports.Task = Task_1.Task;
exports.Group = Task_1.Group;
var Error_1 = require("./Error"); // so the user can check for the proper error type
exports.ValidationError = Error_1.ValidationError;
//# sourceMappingURL=index.js.map