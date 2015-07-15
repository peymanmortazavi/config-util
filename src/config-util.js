var property = require("./property.js");

module.exports.evaluate = evaluate;

function evaluate(configTemplate, actualConfig, prefix) {

  actualConfig = actualConfig || {};

  var valid = true;
  var errors = [];
  var config = {};

  for(var key in configTemplate) {
    if(typeof(configTemplate[key]) == 'object') {
      // if it's an object then, recursively search through it.
      var results = evaluate(configTemplate[key], actualConfig[key], (prefix ? prefix + '.' : '') + key);
      if(!results.isValid)
        errors = errors.concat(results.errors);
      else
        config[key] = results.config;

      valid = valid && results.isValid;
    }
    else {
      var results = getPropertyValidationResult(configTemplate[key], actualConfig[key]);
      results.keyPath = (prefix ? prefix + '.' : '') + key;
      results['$leaf'] = true;
      if(!results.isValid) {
        delete results.isValid;
        errors.push(results);
        valid = false;
      } else {
        delete results.isValid;
        config[key] = results;
      }
    }
  }
  return new EvaluationResult(valid, (errors.length == 0 ? null : errors), config);
}

var EvaluationResult = function (isValid, errors, config) {
  this.isValid = isValid;
  this.errors = errors;
  this.config = config;
  this.compile = function () { return compileRecursive(this.config) };
  this.flatten = function (property1, property2) {
    return flattenRecursive(this.config, null, null, property1, property2)
  };
}

function flattenRecursive(object, keyValuePair, prefix, property1, property2) {
  keyValuePair = keyValuePair || {};
  for (var key in object) {
    if (object.hasOwnProperty(key)) {
      var currentValue = object[key];
      if(typeof(currentValue) == 'object' && !currentValue['$leaf']) {
        flattenRecursive(currentValue, keyValuePair, prefix?prefix+'.'+key:key, property1, property2);
      } else {
        if(currentValue[property1])
          keyValuePair[object[key][property1]] = object[key][property2];
      }
    }
  }
  return keyValuePair;
}

function compileRecursive (object) {
  var configObject = {};
  for(var key in object) {
    if(object[key]['$leaf']) {
      configObject[key] = object[key].value;
    } else {
      configObject[key] = compileRecursive(object[key]);
    }
  }
  return configObject;
};

function stringContains(string, value) {
  return string.indexOf(value) != -1;
}

if(!Object.setValueForKey){
  Object.defineProperty(Object.prototype, "setValueForKey", {
    value: function(key, value) {
      this[key] = value;
    }
  });

  Object.defineProperty(Object.prototype, "setValueForKeyPath", {
    value: function(keyPath, value) {
      if (keyPath == null) return;
      if (stringContains(keyPath, '.') == false) {
        this.setValueForKey(keyPath, value); return;
      }

      var chain = keyPath.split('.');
      var firstKey = chain.shift();
      var shiftedKeyPath = chain.join('.');

      if(!this.hasOwnProperty(firstKey)) this[firstKey] = {};
      this[firstKey].setValueForKeyPath(shiftedKeyPath, value);
    }
  });

  Object.defineProperty(Object.prototype, "getValueForKey", {
    value: function(key) { return this[key]; }
  });

  Object.defineProperty(Object.prototype, "getValueForKeyPath", {
    value: function(keyPath) {
      if (keyPath == null) return;
      if (stringContains(keyPath, '.') == false) { return this.getValueForKey(keyPath); }

      var chain = keyPath.split('.');
      var firstKey = chain.shift();
      var shiftedKeyPath = chain.join('.');

      if(!this.hasOwnProperty(firstKey)) return undefined;
      return this[firstKey].getValueForKeyPath(shiftedKeyPath);
  }});
}

var getPropertyValidationResult = function(propertyExpression, value) {
  var type = propertyExpression.split(".")[0];
  var code = "var " + type + "= new property(type, value);";
  return eval(code + propertyExpression + ".evaluate()");
}
