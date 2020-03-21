"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Task = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var Task = /*#__PURE__*/function () {
  function Task(identifier, name, prediction) {
    var description = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : "";
    var dependencies = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : [];
    var actual = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : undefined;

    _classCallCheck(this, Task);

    _defineProperty(this, "identifier", void 0);

    _defineProperty(this, "name", void 0);

    _defineProperty(this, "description", void 0);

    _defineProperty(this, "dependencies", void 0);

    _defineProperty(this, "prediction", void 0);

    _defineProperty(this, "actual", undefined);

    this.identifier = identifier;
    this.name = name;
    this.description = description;
    this.dependencies = dependencies;
    this.prediction = prediction;
    this.actual = actual;
  }

  _createClass(Task, [{
    key: "velocity",
    get: function get() {
      return this.actual ? this.prediction / this.actual : undefined;
    }
  }]);

  return Task;
}();

exports.Task = Task;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC50cyJdLCJuYW1lcyI6WyJUYXNrIiwiaWRlbnRpZmllciIsIm5hbWUiLCJwcmVkaWN0aW9uIiwiZGVzY3JpcHRpb24iLCJkZXBlbmRlbmNpZXMiLCJhY3R1YWwiLCJ1bmRlZmluZWQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztJQUFhQSxJO0FBUVosZ0JBQVlDLFVBQVosRUFBZ0NDLElBQWhDLEVBQThDQyxVQUE5QyxFQUFzSztBQUFBLFFBQXBHQyxXQUFvRyx1RUFBOUUsRUFBOEU7QUFBQSxRQUExRUMsWUFBMEUsdUVBQTVDLEVBQTRDO0FBQUEsUUFBeENDLE1BQXdDLHVFQUFYQyxTQUFXOztBQUFBOztBQUFBOztBQUFBOztBQUFBOztBQUFBOztBQUFBOztBQUFBLG9DQUZ6SUEsU0FFeUk7O0FBQ3JLLFNBQUtOLFVBQUwsR0FBa0JBLFVBQWxCO0FBQ0EsU0FBS0MsSUFBTCxHQUFZQSxJQUFaO0FBQ0EsU0FBS0UsV0FBTCxHQUFtQkEsV0FBbkI7QUFDQSxTQUFLQyxZQUFMLEdBQW9CQSxZQUFwQjtBQUNBLFNBQUtGLFVBQUwsR0FBa0JBLFVBQWxCO0FBQ0EsU0FBS0csTUFBTCxHQUFjQSxNQUFkO0FBQ0E7Ozs7d0JBRWtDO0FBQ2xDLGFBQU8sS0FBS0EsTUFBTCxHQUFjLEtBQUtILFVBQUwsR0FBa0IsS0FBS0csTUFBckMsR0FBOENDLFNBQXJEO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY2xhc3MgVGFzayB7XG5cdGlkZW50aWZpZXI6IHN0cmluZ1xuXHRuYW1lOiBzdHJpbmdcblx0ZGVzY3JpcHRpb246IHN0cmluZ1xuXHRkZXBlbmRlbmNpZXM6IEFycmF5PHN0cmluZz5cblx0cHJlZGljdGlvbjogbnVtYmVyXG5cdGFjdHVhbDogbnVtYmVyIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkXG5cdFxuXHRjb25zdHJ1Y3RvcihpZGVudGlmaWVyOiBzdHJpbmcsIG5hbWU6IHN0cmluZywgcHJlZGljdGlvbjogbnVtYmVyLCBkZXNjcmlwdGlvbjogc3RyaW5nID0gXCJcIiwgZGVwZW5kZW5jaWVzOiBBcnJheTxzdHJpbmc+ID0gW10sIGFjdHVhbDogbnVtYmVyIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkKSB7XG5cdFx0dGhpcy5pZGVudGlmaWVyID0gaWRlbnRpZmllclxuXHRcdHRoaXMubmFtZSA9IG5hbWVcblx0XHR0aGlzLmRlc2NyaXB0aW9uID0gZGVzY3JpcHRpb25cblx0XHR0aGlzLmRlcGVuZGVuY2llcyA9IGRlcGVuZGVuY2llc1xuXHRcdHRoaXMucHJlZGljdGlvbiA9IHByZWRpY3Rpb25cblx0XHR0aGlzLmFjdHVhbCA9IGFjdHVhbFxuXHR9XG5cdFxuXHRnZXQgdmVsb2NpdHkoKTogbnVtYmVyIHwgdW5kZWZpbmVkIHtcblx0XHRyZXR1cm4gdGhpcy5hY3R1YWwgPyB0aGlzLnByZWRpY3Rpb24gLyB0aGlzLmFjdHVhbCA6IHVuZGVmaW5lZFxuXHR9XG59Il19