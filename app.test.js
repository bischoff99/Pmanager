const { JSDOM } = require('jsdom');

global.IS_TEST = true; // prevent auto init
const ShippingManager = require('./app.js');

describe('HTML injection prevention', () => {
    let app;
    beforeEach(() => {
        // reset DOM for each test
        const dom = new JSDOM(`<!DOCTYPE html><div id="selected-products"></div><div id="customer-preview"></div><div id="results-section"></div>`);
        global.document = dom.window.document;
        global.window = dom.window;
        app = new ShippingManager();
    });

    test('updateSelectedProductsDisplay escapes HTML in product names', () => {
        app.state.selectedProducts = [{ id: '1', name: '<img src=x onerror=alert(1)>' }];
        app.updateSelectedProductsDisplay();
        const container = document.getElementById('selected-products');
        expect(container.textContent).toContain('<img src=x onerror=alert(1)>');
        expect(container.querySelector('img')).toBeNull();
    });

    test('displayCustomerPreview escapes HTML in customer fields', () => {
        const data = { name: '<script>alert(1)</script>', email: 'a@b.com', phone: '' };
        app.displayCustomerPreview(data);
        const preview = document.getElementById('customer-preview');
        expect(preview.textContent).toContain('<script>alert(1)</script>');
        expect(preview.querySelector('script')).toBeNull();
    });

    test('displayRates escapes HTML in rate fields', () => {
        const rates = [{ courier_name: '<img src=x>', service_name: '<script>alert(1)</script>', total_charge: '0.00' }];
        app.displayRates(rates);
        const results = document.getElementById('results-section');
        expect(results.textContent).toContain('<img src=x>');
        expect(results.textContent).toContain('<script>alert(1)</script>');
        expect(results.querySelector('img')).toBeNull();
        expect(results.querySelector('script')).toBeNull();
    });
});
