const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Enable CORS
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3002'],
    credentials: true
}));
app.use(express.json());

// Mock data for testing
const mockPropertyCodes = [
    {
        id: "HOTEL001",
        property_code: "HOTEL001",
        property_name: "ABC Hotel",
        nick_name: "ABC Hotel",
        owner_name: "Hotel Owner",
        address_name: "123 Main Street, City",
        gst_number: "GST123456789",
        pan_number: "ABCDE1234F",
        group_name: "Hotel Group",
        local_currency: "USD",
        currency_format: "en-US",
        symbol: "$",
        decimal_places: 2,
        date_format: "MM/DD/YYYY",
        round_off: "0.01",
        property_logo: "",
        applicable_from: "2024-01-01",
        ActiveStatus: 1
    },
    {
        id: "REST001",
        property_code: "REST001", 
        property_name: "Downtown Restaurant",
        nick_name: "Downtown Restaurant",
        owner_name: "Restaurant Owner",
        address_name: "456 Food Street, Downtown",
        gst_number: "GST987654321",
        pan_number: "FGHIJ5678K",
        group_name: "Restaurant Group",
        local_currency: "USD",
        currency_format: "en-US", 
        symbol: "$",
        decimal_places: 2,
        date_format: "MM/DD/YYYY",
        round_off: "0.01",
        property_logo: "",
        applicable_from: "2024-02-01",
        ActiveStatus: 1
    },
    {
        id: "CAFE001",
        property_code: "CAFE001",
        property_name: "City Cafe",
        nick_name: "City Cafe", 
        owner_name: "Cafe Owner",
        address_name: "789 Coffee Lane, City Center",
        gst_number: "GST456789123",
        pan_number: "KLMNO9012P",
        group_name: "Cafe Group",
        local_currency: "USD",
        currency_format: "en-US",
        symbol: "$", 
        decimal_places: 2,
        date_format: "MM/DD/YYYY",
        round_off: "0.01",
        property_logo: "",
        applicable_from: "2024-03-01", 
        ActiveStatus: 1
    }
];

// Mock API endpoints
app.get('/api/property-codes', (req, res) => {
    console.log('📡 GET /api/property-codes - Serving mock data');
    res.json({
        success: true,
        data: mockPropertyCodes,
        message: 'Mock property codes loaded successfully'
    });
});

app.post('/api/property-codes', (req, res) => {
    console.log('📡 POST /api/property-codes - Mock create:', req.body);
    const newProperty = {
        id: req.body.property_code,
        ...req.body,
        ActiveStatus: 1
    };
    mockPropertyCodes.push(newProperty);
    
    res.json({
        success: true,
        data: newProperty,
        message: 'Property code created successfully (mock)'
    });
});

app.put('/api/property-codes/:id', (req, res) => {
    console.log('📡 PUT /api/property-codes/:id - Mock update:', req.params.id, req.body);
    const index = mockPropertyCodes.findIndex(p => p.id === req.params.id);
    if (index !== -1) {
        mockPropertyCodes[index] = { ...mockPropertyCodes[index], ...req.body };
        res.json({
            success: true,
            data: mockPropertyCodes[index],
            message: 'Property code updated successfully (mock)'
        });
    } else {
        res.status(404).json({
            success: false,
            message: 'Property code not found'
        });
    }
});

app.delete('/api/property-codes/:id', (req, res) => {
    console.log('📡 DELETE /api/property-codes/:id - Mock delete:', req.params.id);
    const index = mockPropertyCodes.findIndex(p => p.id === req.params.id);
    if (index !== -1) {
        mockPropertyCodes[index].ActiveStatus = 0; // Soft delete
        res.json({
            success: true,
            message: 'Property code deleted successfully (mock)'
        });
    } else {
        res.status(404).json({
            success: false,
            message: 'Property code not found'
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Mock POS Backend Server running on http://localhost:${PORT}`);
    console.log('📡 Available endpoints:');
    console.log('   - GET    /api/property-codes');
    console.log('   - POST   /api/property-codes');
    console.log('   - PUT    /api/property-codes/:id');
    console.log('   - DELETE /api/property-codes/:id');
    console.log('💡 This is a mock server for testing PropertyCode database-first architecture');
});

module.exports = app;