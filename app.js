// Shipping Manager Application
class ShippingManager {
    constructor() {
        this.state = {
            platform: null,
            apiKey: null,
            connected: false,
            selectedWarehouse: null,
            selectedProducts: [],
            customer: null,
            warehouses: [],
            products: [],
            destinationAddress: {},
            lastRequest: null,
            lastResponse: null
        };

        this.config = {
            easyship: {
                baseUrl: 'https://public-api.easyship.com/2024-09',
                testKey: 'prod_uKbJSEJF5n5YtgD8rxnCKJzYYe5gcRH6'
            },
            veeqo: {
                baseUrl: 'https://api.veeqo.com',
                testKey: 'test_veeqo_key_demo_12345'
            },
            corsProxies: [
                'https://api.allorigins.win/raw?url=',
                'https://cors-anywhere.herokuapp.com/',
                'https://proxy.cors.sh/',
                'https://api.codetabs.com/v1/proxy?quest='
            ]
        };

        this.proxyIndex = 0;
        this.init();
    }

    init() {
        // Ensure DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupEventListeners());
        } else {
            this.setupEventListeners();
        }
    }

    setupEventListeners() {
        try {
            // Platform selection
            this.getElement('easyship-btn').addEventListener('click', () => this.selectPlatform('easyship'));
            this.getElement('veeqo-btn').addEventListener('click', () => this.selectPlatform('veeqo'));

            // API Connection
            this.getElement('api-key').addEventListener('input', this.validateApiKey.bind(this));
            this.getElement('connect-btn').addEventListener('click', this.connectToAPI.bind(this));
            this.getElement('toggle-key-visibility').addEventListener('click', this.toggleKeyVisibility.bind(this));

            // Test keys
            this.getElement('use-test-easyship').addEventListener('click', () => this.useTestKey('easyship'));
            this.getElement('use-test-veeqo').addEventListener('click', () => this.useTestKey('veeqo'));

            // Warehouse
            this.getElement('load-warehouses-btn').addEventListener('click', this.loadWarehouses.bind(this));
            this.getElement('warehouse-select').addEventListener('change', this.selectWarehouse.bind(this));

            // Products
            this.getElement('load-products-btn').addEventListener('click', this.loadProducts.bind(this));

            // Customer tabs
            this.getElement('paste-customer-tab').addEventListener('click', () => this.switchCustomerTab('paste'));
            this.getElement('manual-customer-tab').addEventListener('click', () => this.switchCustomerTab('manual'));

            // Customer paste functionality
            this.getElement('customer-paste').addEventListener('input', this.validateCustomerPaste.bind(this));
            this.getElement('save-customer-btn').addEventListener('click', this.saveCustomer.bind(this));
            this.getElement('find-customer-btn').addEventListener('click', this.findCustomer.bind(this));

            // Manual customer
            this.getElement('save-manual-customer-btn').addEventListener('click', this.saveManualCustomer.bind(this));

            // Destination address
            const destFields = ['dest-address1', 'dest-city', 'dest-state', 'dest-postal', 'dest-country'];
            destFields.forEach(field => {
                this.getElement(field).addEventListener('input', this.validateDestination.bind(this));
            });

            // Actions
            this.getElement('get-rates-btn').addEventListener('click', this.getRates.bind(this));
            this.getElement('create-order-btn').addEventListener('click', this.createOrder.bind(this));

            // Modals and overlays
            this.getElement('debug-btn').addEventListener('click', this.showDebugModal.bind(this));
            this.getElement('close-debug').addEventListener('click', this.closeDebugModal.bind(this));
            this.getElement('close-error').addEventListener('click', this.closeError.bind(this));

            console.log('✓ Event listeners initialized successfully');
        } catch (error) {
            console.error('Error setting up event listeners:', error);
            this.showError('Failed to initialize application. Please refresh the page.');
        }
    }

    getElement(id) {
        const element = document.getElementById(id);
        if (!element) {
            throw new Error(`Element with id '${id}' not found`);
        }
        return element;
    }

    selectPlatform(platform) {
        this.state.platform = platform;
        
        // Update UI
        document.querySelectorAll('.platform-btn').forEach(btn => btn.classList.remove('active'));
        this.getElement(`${platform}-btn`).classList.add('active');
        
        // Enable connection step
        this.getElement('connection-step').classList.remove('disabled');
        
        console.log(`✓ Platform selected: ${platform}`);
        this.runUnitTest('platform_selection', this.state.platform === platform);
    }

    validateApiKey() {
        const apiKey = this.getElement('api-key').value.trim();
        const connectBtn = this.getElement('connect-btn');
        
        if (apiKey.length > 10) { // Basic validation
            connectBtn.disabled = false;
            connectBtn.classList.remove('btn--outline');
            connectBtn.classList.add('btn--primary');
        } else {
            connectBtn.disabled = true;
            connectBtn.classList.add('btn--outline');
            connectBtn.classList.remove('btn--primary');
        }
    }

    toggleKeyVisibility() {
        const keyInput = this.getElement('api-key');
        const toggleBtn = this.getElement('toggle-key-visibility');
        
        if (keyInput.type === 'password') {
            keyInput.type = 'text';
            toggleBtn.textContent = 'Hide Key';
        } else {
            keyInput.type = 'password';
            toggleBtn.textContent = 'Show Key';
        }
    }

    useTestKey(platform) {
        const keyInput = this.getElement('api-key');
        keyInput.value = this.config[platform].testKey;
        keyInput.type = 'text';
        this.getElement('toggle-key-visibility').textContent = 'Hide Key';
        this.selectPlatform(platform);
        this.validateApiKey();
    }

    async connectToAPI() {
        const apiKey = this.getElement('api-key').value.trim();
        this.state.apiKey = apiKey;
        
        this.showLoading(true);
        
        try {
            // Test connection with a simple API call
            const testEndpoint = this.state.platform === 'easyship' ? '/reference/couriers' : '/current_user';
            const response = await this.makeAPICall('GET', testEndpoint);
            
            if (response) {
                this.state.connected = true;
                this.updateConnectionStatus('connected', 'Connected successfully');
                this.getElement('warehouse-step').classList.remove('disabled');
                this.getElement('load-warehouses-btn').disabled = false;
                console.log('✓ API connection successful');
                this.runUnitTest('api_connection', this.state.connected === true);
            }
        } catch (error) {
            this.updateConnectionStatus('disconnected', 'Connection failed');
            this.showError(`Failed to connect to ${this.state.platform}: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    updateConnectionStatus(status, message) {
        const statusEl = this.getElement('connection-status');
        statusEl.className = `status ${status}`;
        statusEl.textContent = message;
    }

    async loadWarehouses() {
        if (!this.state.connected) return;
        
        this.showLoading(true);
        
        try {
            const endpoint = this.state.platform === 'easyship' ? '/reference/warehouses' : '/warehouses';
            const response = await this.makeAPICall('GET', endpoint);
            
            if (response) {
                const warehouses = this.state.platform === 'easyship' ? response.warehouses : response;
                this.state.warehouses = warehouses || [];
                this.populateWarehouses();
                console.log(`✓ Loaded ${this.state.warehouses.length} warehouses`);
                this.runUnitTest('warehouse_loading', this.state.warehouses.length > 0);
            }
        } catch (error) {
            this.showError(`Failed to load warehouses: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    populateWarehouses() {
        const select = this.getElement('warehouse-select');
        select.innerHTML = '<option value="">Select warehouse...</option>';
        
        this.state.warehouses.forEach(warehouse => {
            const option = document.createElement('option');
            option.value = warehouse.id || warehouse.warehouse_id;
            option.textContent = warehouse.name || warehouse.warehouse_name || `Warehouse ${option.value}`;
            select.appendChild(option);
        });
        
        select.disabled = false;
    }

    selectWarehouse() {
        const warehouseId = this.getElement('warehouse-select').value;
        if (warehouseId) {
            this.state.selectedWarehouse = this.state.warehouses.find(w => 
                (w.id || w.warehouse_id) == warehouseId
            );
            this.getElement('products-step').classList.remove('disabled');
            this.getElement('load-products-btn').disabled = false;
            console.log('✓ Warehouse selected:', this.state.selectedWarehouse);
            this.validateWorkflow();
        }
    }

    async loadProducts() {
        if (!this.state.selectedWarehouse) return;
        
        this.showLoading(true);
        
        try {
            const endpoint = this.state.platform === 'easyship' ? '/products' : '/products';
            const response = await this.makeAPICall('GET', endpoint);
            
            if (response) {
                const products = this.state.platform === 'easyship' ? response.products : response;
                this.state.products = products || [];
                this.displayProducts();
                this.getElement('customer-step').classList.remove('disabled');
                console.log(`✓ Loaded ${this.state.products.length} products`);
                this.runUnitTest('product_loading', this.state.products.length > 0);
                setTimeout(() => {
                    this.runUnitTest('product_dom_population', document.querySelectorAll('.product-item').length > 0);
                }, 0);
            }
        } catch (error) {
            this.showError(`Failed to load products: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    displayProducts() {
        const container = this.getElement('products-list');
        container.innerHTML = '';
        
        if (this.state.products.length === 0) {
            container.innerHTML = '<p>No products found. You can still proceed with the workflow.</p>';
            return;
        }
        
        this.state.products.slice(0, 20).forEach(product => { // Limit to 20 for performance
            const productEl = document.createElement('div');
            productEl.className = 'product-item';
            productEl.dataset.productId = product.id || product.product_id;
            
            productEl.innerHTML = `
                <div class="product-name">${product.name || product.title || 'Unnamed Product'}</div>
                <div class="product-sku">SKU: ${product.sku || product.sku_code || 'N/A'}</div>
                <div class="product-price">$${product.price || product.selling_price || '0.00'}</div>
            `;
            
            productEl.addEventListener('click', () => this.toggleProductSelection(product, productEl));
            container.appendChild(productEl);
        });
    }

    toggleProductSelection(product, element) {
        const productId = product.id || product.product_id;
        const index = this.state.selectedProducts.findIndex(p => (p.id || p.product_id) == productId);
        
        if (index > -1) {
            this.state.selectedProducts.splice(index, 1);
            element.classList.remove('selected');
        } else {
            this.state.selectedProducts.push(product);
            element.classList.add('selected');
        }
        
        this.updateSelectedProductsDisplay();
        this.validateWorkflow();
    }

    updateSelectedProductsDisplay() {
        const container = this.getElement('selected-products');
        
        if (this.state.selectedProducts.length === 0) {
            container.classList.add('hidden');
            return;
        }
        
        container.classList.remove('hidden');
        container.innerHTML = `
            <h4>Selected Products (${this.state.selectedProducts.length})</h4>
            <div class="selected-product-list">
                ${this.state.selectedProducts.map(product => `
                    <span class="selected-product-tag">
                        ${product.name || product.title || 'Product'}
                        <button class="remove-product" onclick="app.removeProduct('${product.id || product.product_id}')">×</button>
                    </span>
                `).join('')}
            </div>
        `;
    }

    removeProduct(productId) {
        this.state.selectedProducts = this.state.selectedProducts.filter(p => 
            (p.id || p.product_id) != productId
        );
        
        // Update UI
        const productEl = document.querySelector(`[data-product-id="${productId}"]`);
        if (productEl) productEl.classList.remove('selected');
        
        this.updateSelectedProductsDisplay();
        this.validateWorkflow();
    }

    switchCustomerTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.customer-tabs .btn').forEach(btn => btn.classList.remove('active'));
        this.getElement(`${tab}-customer-tab`).classList.add('active');
        
        // Show/hide sections
        this.getElement('paste-customer-section').classList.toggle('hidden', tab !== 'paste');
        this.getElement('manual-customer-section').classList.toggle('hidden', tab !== 'manual');
    }

    validateCustomerPaste() {
        const textarea = this.getElement('customer-paste');
        const lines = textarea.value.split('\n').filter(line => line.trim());
        const preview = this.getElement('customer-preview');
        const saveBtn = this.getElement('save-customer-btn');
        const findBtn = this.getElement('find-customer-btn');
        
        // Limit to 10 lines
        if (lines.length > 10) {
            const limitedLines = lines.slice(0, 10);
            textarea.value = limitedLines.join('\n');
            lines.length = 10;
        }
        
        if (lines.length >= 3) { // Minimum: name, email, phone
            const customerData = this.parseCustomerData(lines);
            this.displayCustomerPreview(customerData);
            preview.classList.remove('hidden');
            
            // Validate required fields
            const isValid = customerData.name && customerData.email;
            saveBtn.disabled = !isValid;
            findBtn.disabled = !isValid;
            
            this.runUnitTest('customer_paste_validation', isValid);
        } else {
            preview.classList.add('hidden');
            saveBtn.disabled = true;
            findBtn.disabled = true;
        }
    }

    parseCustomerData(lines) {
        const customerData = {
            name: lines[0]?.trim() || '',
            email: lines[1]?.trim() || '',
            phone: lines[2]?.trim() || '',
            address1: lines[3]?.trim() || '',
            address2: lines[4]?.trim() || '',
            city: lines[5]?.trim() || '',
            state: lines[6]?.trim() || '',
            postal_code: lines[7]?.trim() || '',
            country: lines[8]?.trim() || '',
            company: lines[9]?.trim() || ''
        };
        
        return customerData;
    }

    displayCustomerPreview(customerData) {
        const preview = this.getElement('customer-preview');
        const fields = [
            { label: 'Name', value: customerData.name, required: true },
            { label: 'Email', value: customerData.email, required: true },
            { label: 'Phone', value: customerData.phone },
            { label: 'Address 1', value: customerData.address1 },
            { label: 'Address 2', value: customerData.address2 },
            { label: 'City', value: customerData.city },
            { label: 'State', value: customerData.state },
            { label: 'Postal Code', value: customerData.postal_code },
            { label: 'Country', value: customerData.country },
            { label: 'Company', value: customerData.company }
        ];
        
        preview.innerHTML = `
            <h4>Customer Preview</h4>
            ${fields.map(field => 
                field.value ? `
                    <div class="customer-preview-item">
                        <span class="customer-preview-label">${field.label}${field.required ? ' *' : ''}:</span>
                        <span class="customer-preview-value">${field.value}</span>
                    </div>
                ` : ''
            ).join('')}
        `;
    }

    async saveCustomer() {
        const lines = this.getElement('customer-paste').value.split('\n').filter(line => line.trim());
        const customerData = this.parseCustomerData(lines);
        
        this.showLoading(true);
        
        try {
            let response;
            if (this.state.platform === 'veeqo') {
                // Veeqo requires {customer: {...}} wrapper
                const payload = { customer: customerData };
                response = await this.makeAPICall('POST', '/customers', payload);
            } else {
                response = await this.makeAPICall('POST', '/customers', customerData);
            }
            
            if (response) {
                this.state.customer = response.customer || response;
                this.showCustomerStatus('Customer saved successfully', 'success');
                this.getElement('destination-step').classList.remove('disabled');
                console.log('✓ Customer saved:', this.state.customer);
                this.runUnitTest('customer_save', this.state.customer !== null);
                this.validateWorkflow();
            }
        } catch (error) {
            this.showError(`Failed to save customer: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    async findCustomer() {
        const lines = this.getElement('customer-paste').value.split('\n').filter(line => line.trim());
        const customerData = this.parseCustomerData(lines);
        
        this.showLoading(true);
        
        try {
            const endpoint = `/customers?email=${encodeURIComponent(customerData.email)}`;
            const response = await this.makeAPICall('GET', endpoint);
            
            if (response && response.customers && response.customers.length > 0) {
                this.state.customer = response.customers[0];
                this.showCustomerStatus('Existing customer found', 'info');
                this.getElement('destination-step').classList.remove('disabled');
                console.log('✓ Customer found:', this.state.customer);
                this.validateWorkflow();
            } else {
                this.showCustomerStatus('Customer not found. Click Save to create new customer.', 'warning');
            }
        } catch (error) {
            this.showError(`Failed to find customer: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    async saveManualCustomer() {
        const customerData = {
            name: this.getElement('customer-name').value.trim(),
            email: this.getElement('customer-email').value.trim(),
            phone: this.getElement('customer-phone').value.trim(),
            company: this.getElement('customer-company').value.trim()
        };
        
        if (!customerData.name || !customerData.email) {
            this.showError('Name and email are required');
            return;
        }
        
        this.showLoading(true);
        
        try {
            let response;
            if (this.state.platform === 'veeqo') {
                const payload = { customer: customerData };
                response = await this.makeAPICall('POST', '/customers', payload);
            } else {
                response = await this.makeAPICall('POST', '/customers', customerData);
            }
            
            if (response) {
                this.state.customer = response.customer || response;
                this.showCustomerStatus('Customer saved successfully', 'success');
                this.getElement('destination-step').classList.remove('disabled');
                console.log('✓ Manual customer saved:', this.state.customer);
                this.validateWorkflow();
            }
        } catch (error) {
            this.showError(`Failed to save customer: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    showCustomerStatus(message, type = 'info') {
        const status = this.getElement('customer-status');
        status.className = `customer-status status--${type}`;
        status.textContent = message;
        status.classList.remove('hidden');
    }

    validateDestination() {
        const required = ['dest-address1', 'dest-city', 'dest-state', 'dest-postal', 'dest-country'];
        const values = required.map(id => this.getElement(id).value.trim());
        const allFilled = values.every(value => value.length > 0);
        
        if (allFilled) {
            this.state.destinationAddress = {
                line_1: values[0],
                city: values[1],
                state: values[2],
                postal_code: values[3],
                country_alpha2: values[4],
                line_2: this.getElement('dest-address2').value.trim()
            };
            
            this.getElement('actions-step').classList.remove('disabled');
            console.log('✓ Destination address completed');
            this.runUnitTest('destination_validation', true);
        } else {
            this.state.destinationAddress = {};
            this.getElement('actions-step').classList.add('disabled');
        }
        
        this.validateWorkflow();
    }

    validateWorkflow() {
        const hasWarehouse = this.state.selectedWarehouse !== null;
        const hasCustomer = this.state.customer !== null;
        const hasDestination = Object.keys(this.state.destinationAddress).length > 0;
        
        const ratesBtn = this.getElement('get-rates-btn');
        const orderBtn = this.getElement('create-order-btn');
        
        const canGetRates = hasWarehouse && hasDestination && this.state.platform === 'easyship';
        const canCreateOrder = hasWarehouse && hasCustomer && hasDestination;
        
        ratesBtn.disabled = !canGetRates;
        orderBtn.disabled = !canCreateOrder;
        
        console.log(`Workflow validation - Rates: ${canGetRates}, Order: ${canCreateOrder}`);
    }

    async getRates() {
        if (this.state.platform !== 'easyship') {
            this.showError('Rates are only available for Easyship platform');
            return;
        }
        
        this.showLoading(true);
        
        try {
            // Properly nested destination_address for Easyship
            const payload = {
                origin_address: {
                    line_1: this.state.selectedWarehouse.address || '123 Warehouse St',
                    city: this.state.selectedWarehouse.city || 'New York',
                    state: this.state.selectedWarehouse.state || 'NY',
                    postal_code: this.state.selectedWarehouse.postal_code || '10001',
                    country_alpha2: this.state.selectedWarehouse.country || 'US'
                },
                destination_address: this.state.destinationAddress,
                incoterms: 'DDU',
                insurance: {
                    is_insured: false
                },
                courier_selection: {
                    apply_shipping_rules: true
                },
                parcels: [{
                    total_actual_weight: 1.0,
                    box: {
                        length: 10,
                        width: 10,
                        height: 10
                    }
                }]
            };
            
            const response = await this.makeAPICall('POST', '/rates', payload);
            
            if (response && response.rates) {
                this.displayRates(response.rates);
                console.log(`✓ Retrieved ${response.rates.length} shipping rates`);
                this.runUnitTest('rates_retrieval', response.rates.length > 0);
            }
        } catch (error) {
            this.showError(`Failed to get rates: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    displayRates(rates) {
        const resultsSection = this.getElement('results-section');
        resultsSection.classList.remove('hidden');
        
        resultsSection.innerHTML = `
            <h4>Shipping Rates (${rates.length} found)</h4>
            ${rates.slice(0, 10).map(rate => `
                <div class="rate-item">
                    <div class="rate-info">
                        <div class="rate-courier">${rate.courier_name || 'Unknown Courier'}</div>
                        <div class="rate-service">${rate.service_name || 'Standard Service'}</div>
                    </div>
                    <div class="rate-price">$${rate.total_charge || '0.00'}</div>
                </div>
            `).join('')}
        `;
    }

    async createOrder() {
        this.showLoading(true);
        
        try {
            const payload = {
                customer_id: this.state.customer.id || this.state.customer.customer_id,
                delivery_method_id: 1,
                order_items: this.state.selectedProducts.map(product => ({
                    sellable_id: product.id || product.product_id,
                    quantity: 1
                })),
                deliver_to: this.state.destinationAddress
            };
            
            const response = await this.makeAPICall('POST', '/orders', payload);
            
            if (response) {
                this.displayOrderResult(response);
                console.log('✓ Order created successfully:', response);
                this.runUnitTest('order_creation', response.id || response.order_id);
            }
        } catch (error) {
            this.showError(`Failed to create order: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    displayOrderResult(order) {
        const resultsSection = this.getElement('results-section');
        resultsSection.classList.remove('hidden');
        
        resultsSection.innerHTML = `
            <h4>Order Created Successfully</h4>
            <div class="rate-item">
                <div class="rate-info">
                    <div class="rate-courier">Order ID: ${order.id || order.order_id}</div>
                    <div class="rate-service">Status: ${order.status || 'Created'}</div>
                </div>
                <div class="rate-price">Items: ${this.state.selectedProducts.length}</div>
            </div>
        `;
    }

    async makeAPICall(method, endpoint, payload = null) {
        let lastError = null;
        
        // Try direct call first
        try {
            return await this.directAPICall(method, endpoint, payload);
        } catch (error) {
            console.log('Direct call failed, trying proxies:', error.message);
            lastError = error;
        }
        
        // Try CORS proxies with fallback chain
        for (let i = 0; i < this.config.corsProxies.length; i++) {
            try {
                return await this.proxiedAPICall(method, endpoint, payload, i);
            } catch (error) {
                console.log(`Proxy ${i} failed:`, error.message);
                lastError = error;
                
                // Handle specific error codes
                if (error.message.includes('429') || error.message.includes('403')) {
                    console.log('Rate limited, continuing to next proxy...');
                    continue;
                }
            }
        }
        
        throw lastError || new Error('All API call methods failed');
    }

    async directAPICall(method, endpoint, payload) {
        const baseUrl = this.config[this.state.platform].baseUrl;
        const url = `${baseUrl}${endpoint}`;
        
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.state.apiKey}`
        };
        
        const options = {
            method,
            headers,
            ...(payload && { body: JSON.stringify(payload) })
        };
        
        this.state.lastRequest = { url, options: { ...options, body: payload } };
        const response = await fetch(url, options);
        const data = await response.json();
        this.state.lastResponse = { status: response.status, data };
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status} - ${data.message || 'Unknown error'}`);
        }
        
        return data;
    }

    async proxiedAPICall(method, endpoint, payload, proxyIndex) {
        const baseUrl = this.config[this.state.platform].baseUrl;
        const targetUrl = `${baseUrl}${endpoint}`;
        const proxyUrl = `${this.config.corsProxies[proxyIndex]}${encodeURIComponent(targetUrl)}`;
        
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.state.apiKey}`,
            'X-Requested-With': 'XMLHttpRequest'
        };
        
        const options = {
            method,
            headers,
            ...(payload && { body: JSON.stringify(payload) })
        };
        
        this.state.lastRequest = { url: proxyUrl, options: { ...options, body: payload } };
        const response = await fetch(proxyUrl, options);
        const data = await response.json();
        this.state.lastResponse = { status: response.status, data };
        
        if (!response.ok) {
            throw new Error(`Proxy Error: ${response.status} - ${data.message || 'Unknown error'}`);
        }
        
        return data;
    }

    showError(message) {
        const errorDisplay = this.getElement('error-display');
        const errorMessage = this.getElement('error-message');
        
        errorMessage.textContent = message;
        errorDisplay.classList.remove('hidden');
        
        console.error('Application Error:', message);
    }

    closeError() {
        this.getElement('error-display').classList.add('hidden');
    }

    showLoading(show) {
        const overlay = this.getElement('loading-overlay');
        if (show) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }

    showDebugModal() {
        const modal = this.getElement('debug-modal');
        const requestEl = this.getElement('debug-request');
        const responseEl = this.getElement('debug-response');
        const stateEl = this.getElement('debug-state');
        
        requestEl.textContent = JSON.stringify(this.state.lastRequest, null, 2) || 'No requests made yet';
        responseEl.textContent = JSON.stringify(this.state.lastResponse, null, 2) || 'No responses received yet';
        stateEl.textContent = JSON.stringify({
            platform: this.state.platform,
            connected: this.state.connected,
            hasWarehouse: !!this.state.selectedWarehouse,
            hasCustomer: !!this.state.customer,
            hasDestination: Object.keys(this.state.destinationAddress).length > 0,
            selectedProducts: this.state.selectedProducts.length
        }, null, 2);
        
        modal.classList.remove('hidden');
    }

    closeDebugModal() {
        this.getElement('debug-modal').classList.add('hidden');
    }

    runUnitTest(testName, condition) {
        const result = condition ? '✓ PASS' : '✗ FAIL';
        console.assert(condition, `Unit Test ${testName}: ${result}`);
        
        if (!condition) {
            console.error(`Unit test failed: ${testName}`);
        }
        
        return condition;
    }
}

// Initialize application when DOM is ready
let app;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        app = new ShippingManager();
    });
} else {
    app = new ShippingManager();
}

// Global function for removing products (called from dynamically generated HTML)
window.app = { removeProduct: (id) => app?.removeProduct(id) };
