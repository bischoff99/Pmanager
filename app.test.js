const test = require('node:test');
const assert = require('node:assert/strict');

const elements = {
  'debug-modal': { classList: { remove: () => {}, add: () => {} } },
  'debug-request': { textContent: '' },
  'debug-response': { textContent: '' },
  'debug-state': { textContent: '' }
};

global.document = {
  readyState: 'loading',
  addEventListener: () => {},
  getElementById: (id) => {
    if (!elements[id]) {
      throw new Error(`Element with id '${id}' not found`);
    }
    return elements[id];
  }
};

global.window = {};

const ShippingManager = require('./app.js');

test('showDebugModal provides fallback text when no request/response', () => {
  const manager = new ShippingManager();
  manager.showDebugModal();
  assert.strictEqual(elements['debug-request'].textContent, 'No requests made yet');
  assert.strictEqual(elements['debug-response'].textContent, 'No responses received yet');
});
