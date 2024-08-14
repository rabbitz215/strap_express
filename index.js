import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import cors from 'cors';
import crypto from 'crypto';

dotenv.config();

const app = express();
const port = process.env.PORT || 3030;
const shopifyAccessToken = process.env.SHOPIFY_ACCESS_TOKEN;
const shopifyShopName = process.env.SHOPIFY_SHOP_NAME;
const hulkKey = process.env.HULK_KEY;
const sharedSecret = process.env.SHARED_SECRET_KEY;

app.use(cors());
app.use(express.json());

const generateApiKey = (timestamp) => {
    return crypto
        .createHmac('sha256', sharedSecret)
        .update(timestamp)
        .digest('hex');
};

const apiKeyMiddleware = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    const timestamp = req.headers['x-timestamp'];
    if (!apiKey || !timestamp) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    const expectedApiKey = generateApiKey(timestamp);
    if (apiKey === expectedApiKey) {
        next();
    } else {
        res.status(403).json({ error: 'Forbidden' });
    }
};

app.use(apiKeyMiddleware);

app.get('/api/products/:collectionId', async (req, res) => {
    const { collectionId } = req.params;

    try {
        const response = await fetch(`https://${shopifyShopName}.myshopify.com/admin/api/2024-07/collections/${collectionId}/products.json`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': shopifyAccessToken,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch products');
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/product_options/:productId', async (req, res) => {
    const { productId } = req.params;

    try {
        const response = await fetch(`https://productoption.hulkapps.com/v1/products/?product_id=${productId}&shop_domain=${shopifyShopName}.myshopify.com`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': hulkKey
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch product options');
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching product options:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/hulk/cart', async (req, res) => {

    try {
        const response = await fetch(`https://productoption.hulkapps.com/v1/cart`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': hulkKey
            },
            body: JSON.stringify(req.body)
        });

        if (!response.ok) {
            const errorResponse = await response.json();
            const errorMessage = errorResponse.error || 'An error occurred while processing the request';
            throw new Error(JSON.stringify(errorResponse));
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error sending cart:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
