const { ShippingManager, parseCustomerData } = require('../app');

describe('parseCustomerData', () => {
  test('parses lines into customer object', () => {
    const lines = [
      'John Doe',
      'john@example.com',
      '1234567890',
      '123 Main St',
      '',
      'Metropolis',
      'NY',
      '12345',
      'US',
      'Acme Inc.'
    ];

    const result = parseCustomerData(lines);
    expect(result).toEqual({
      name: 'John Doe',
      email: 'john@example.com',
      phone: '1234567890',
      address1: '123 Main St',
      address2: '',
      city: 'Metropolis',
      state: 'NY',
      postal_code: '12345',
      country: 'US',
      company: 'Acme Inc.'
    });
  });
});

describe('validateWorkflow', () => {
  test('enables rates when warehouse and destination are set', () => {
    const ratesBtn = { disabled: true };
    const orderBtn = { disabled: true };
    const manager = {
      state: {
        selectedWarehouse: { id: 1 },
        customer: null,
        destinationAddress: { city: 'City' },
        platform: 'easyship'
      },
      getElement: jest.fn((id) => (id === 'get-rates-btn' ? ratesBtn : orderBtn))
    };

    ShippingManager.prototype.validateWorkflow.call(manager);
    expect(ratesBtn.disabled).toBe(false);
    expect(orderBtn.disabled).toBe(true);

    manager.state.customer = { id: 1 };
    ShippingManager.prototype.validateWorkflow.call(manager);
    expect(orderBtn.disabled).toBe(false);
  });
});

describe('makeAPICall error handling', () => {
  test('throws error when response is not ok', async () => {
    const manager = {
      state: { platform: 'easyship', apiKey: 'test' },
      config: { easyship: { baseUrl: 'https://example.com' }, corsProxies: [] },
      directAPICall: ShippingManager.prototype.directAPICall,
      proxiedAPICall: ShippingManager.prototype.proxiedAPICall
    };

    const originalFetch = global.fetch;
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Server error' })
      })
    );

    await expect(
      ShippingManager.prototype.makeAPICall.call(manager, 'GET', '/test')
    ).rejects.toThrow('API Error: 500 - Server error');

    global.fetch = originalFetch;
  });
});
