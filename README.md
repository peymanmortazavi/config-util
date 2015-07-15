# config-util
Small, lightweight and extensible Node.js library to validate/evaluate files (focused on use for config objects).

## Installation

```bash
$ npm install config-util --save
```

## Features

  * Object validation.
  * Get and set values by key path.
  * Easy way to define templates for object validation.
  * Compile the evaluation result so you'd get plain config object.

## Quick Start

```JavaScript
var configUtil = require('config-util');
```

Now you create your template object.

```JavaScript
var template = {name: "string", formattedField: "string.regex(/Yes|No/)", age: "number.default(21)", emailInfo: {email: "string", username: "string.optional()", password: "string.optional()"}};

var evaluationResult = configUtil.evaluate(template, {name: "First Name"});
if(!evaluationResult.isValid) {
  console.log(JSON.stringify(evaluationResult.errors, null, 2));
} else {
  console.log(JSON.stringify(evaluationResult.compile(), null, 2));
}
```
