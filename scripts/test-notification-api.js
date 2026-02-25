const y = require('yoti');
const n = new y.NotificationConfigBuilder();
const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(n)).filter(m => m !== 'constructor');
console.log('NotificationConfigBuilder methods:', methods);
