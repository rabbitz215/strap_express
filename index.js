// import express from 'express';
// import fetch from 'node-fetch';
// import dotenv from 'dotenv';
// import cors from 'cors';
// import crypto from 'crypto';

// dotenv.config();

// const app = express();
// const port = process.env.PORT || 3030;
// const shopifyAccessToken = process.env.SHOPIFY_ACCESS_TOKEN;
// const shopifyShopName = process.env.SHOPIFY_SHOP_NAME;
// const hulkKey = process.env.HULK_KEY;
// const sharedSecret = process.env.SHARED_SECRET_KEY;

// app.use(cors());
// app.use(express.json());

// const generateApiKey = (timestamp) => {
//     return crypto
//         .createHmac('sha256', sharedSecret)
//         .update(timestamp)
//         .digest('hex');
// };

// const apiKeyMiddleware = (req, res, next) => {
//     const apiKey = req.headers['x-api-key'];
//     const timestamp = req.headers['x-timestamp'];
//     if (!apiKey || !timestamp) {
//         return res.status(403).json({ error: 'Forbidden' });
//     }

//     const expectedApiKey = generateApiKey(timestamp);
//     if (apiKey === expectedApiKey) {
//         next();
//     } else {
//         res.status(403).json({ error: 'Forbidden' });
//     }
// };

// app.use(apiKeyMiddleware);

// const fetchCollectionsWithProductCount = async () => {
//     const collectionsUrl = `https://${shopifyShopName}.myshopify.com/admin/api/2024-07/custom_collections.json`;
//     const productsUrl = `https://${shopifyShopName}.myshopify.com/admin/api/2024-07/products.json?collection_id=`;

//     // Fetch collections with limit
//     const collectionsResponse = await fetch(collectionsUrl, {
//         headers: { 'X-Shopify-Access-Token': shopifyAccessToken },
//     });

//     // Ensure the response is OK
//     if (!collectionsResponse.ok) {
//         const errorText = await collectionsResponse.text(); // Get detailed error
//         throw new Error(`Failed to fetch collections: ${errorText}`);
//     }

//     const collectionsData = await collectionsResponse.json();
//     const collections = collectionsData.custom_collections;

//     // Fetch product counts for each collection with the product limit
//     const collectionsWithCounts = await Promise.all(
//         collections.map(async (collection) => {
//             const productsResponse = await fetch(`${productsUrl}${collection.id}&limit=5`, {
//                 headers: { 'X-Shopify-Access-Token': shopifyAccessToken },
//             });

//             if (!productsResponse.ok) {
//                 const errorText = await productsResponse.text(); // Get detailed error
//                 throw new Error(`Failed to fetch products for collection ID ${collection.id}: ${errorText}`);
//             }

//             const productsData = await productsResponse.json();

//             // Fetch metafields for the collection
//             const metafieldsUrl = `https://${shopifyShopName}.myshopify.com/admin/api/2024-07/collections/${collection.id}/metafields.json`;
//             const metafieldsResponse = await fetch(metafieldsUrl, {
//                 headers: { 'X-Shopify-Access-Token': shopifyAccessToken },
//             });

//             let metafields = [];
//             if (metafieldsResponse.ok) {
//                 const metafieldsData = await metafieldsResponse.json();
//                 metafields = metafieldsData.metafields;
//             } else {
//                 console.warn(`Failed to fetch metafields for collection ID ${collection.id}`);
//             }

//             return {
//                 ...collection,
//                 product_count: productsData.products.length,
//                 metafields,
//             };
//         })
//     );

//     return collectionsWithCounts;
// };

// // Endpoint for fetching collections
// app.get('/api/collections', async (req, res) => {
//     try {
//         const collections = await fetchCollectionsWithProductCount();
//         res.json(collections);
//     } catch (error) {
//         console.error('Error fetching collections:', error);
//         res.status(500).json({ error: 'Failed to fetch collections', details: error.message });
//     }
// });

// // Endpoint for fetching all products
// app.get('/api/products', async (req, res) => {
//     const limit = parseInt(req.query.limit) || 10;
//     let pageInfo = req.query.page_info || null;

//     if (pageInfo === 'null') {
//         pageInfo = null;
//     }

//     try {
//         let productsUrl = `https://${shopifyShopName}.myshopify.com/admin/api/2024-07/products.json?limit=${limit}`;
//         if (pageInfo) {
//             productsUrl += `&page_info=${pageInfo}`;
//         }

//         const response = await fetch(productsUrl, {
//             headers: { 'X-Shopify-Access-Token': shopifyAccessToken },
//         });

//         if (!response.ok) {
//             const errorText = await response.text(); // Get detailed error
//             throw new Error(`Failed to fetch products: ${errorText}`);
//         }

//         const linkHeader = response.headers.get('link');
//         let nextPageInfo = null;
//         let prevPageInfo = null;

//         if (linkHeader) {
//             const nextLinkMatch = linkHeader.match(/<([^>]+)>; rel="next"/);
//             const prevLinkMatch = linkHeader.match(/<([^>]+)>; rel="previous"/);

//             if (nextLinkMatch) {
//                 const nextLink = nextLinkMatch[1];
//                 const urlParams = new URLSearchParams(nextLink.split('?')[1]);
//                 nextPageInfo = urlParams.get('page_info');
//             }

//             if (prevLinkMatch) {
//                 const prevLink = prevLinkMatch[1];
//                 const urlParams = new URLSearchParams(prevLink.split('?')[1]);
//                 prevPageInfo = urlParams.get('page_info');
//             }
//         }

//         const productsData = await response.json();
//         res.json({
//             products: productsData.products,
//             nextPageInfo: nextPageInfo || null,
//             prevPageInfo: prevPageInfo || null,
//         });
//     } catch (error) {
//         console.error('Error fetching products:', error);
//         res.status(500).json({ error: 'Failed to fetch products', details: error.message });
//     }
// });

// app.get('/api/products/:collectionId', async (req, res) => {
//     const { collectionId } = req.params;
//     const limit = parseInt(req.query.limit) || 10;
//     let pageInfo = req.query.page_info || null;

//     if (pageInfo === 'null') {
//         pageInfo = null;
//     }

//     try {
//         // 1. Fetch the collection's products
//         let url = `https://${shopifyShopName}.myshopify.com/admin/api/2024-07/collections/${collectionId}/products.json?limit=${limit}`;
//         if (pageInfo) {
//             url += `&page_info=${pageInfo}`;
//         }

//         // 2. Fetch the collection's products
//         const productsResponse = await fetch(url, {
//             method: 'GET',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'X-Shopify-Access-Token': shopifyAccessToken,
//             },
//         });

//         if (!productsResponse.ok) {
//             throw new Error('Failed to fetch products');
//         }

//         const productsData = await productsResponse.json();
//         const products = productsData.products;

//         const linkHeader = productsResponse.headers.get('link');
//         let nextPageInfo = null;
//         let prevPageInfo = null;

//         if (linkHeader) {
//             const nextLinkMatch = linkHeader.match(/<([^>]+)>; rel="next"/);
//             const prevLinkMatch = linkHeader.match(/<([^>]+)>; rel="previous"/);

//             if (nextLinkMatch) {
//                 const nextLink = nextLinkMatch[1];
//                 const urlParams = new URLSearchParams(nextLink.split('?')[1]);
//                 nextPageInfo = urlParams.get('page_info');
//             }

//             if (prevLinkMatch) {
//                 const prevLink = prevLinkMatch[1];
//                 const urlParams = new URLSearchParams(prevLink.split('?')[1]);
//                 prevPageInfo = urlParams.get('page_info');
//             }
//         }

//         // 2. Fetch the details for each product
//         const productsWithDetails = await Promise.all(
//             products.map(async (product) => {
//                 const productResponse = await fetch(`https://${shopifyShopName}.myshopify.com/admin/api/2024-07/products/${product.id}.json`, {
//                     method: 'GET',
//                     headers: {
//                         'Content-Type': 'application/json',
//                         'X-Shopify-Access-Token': shopifyAccessToken,
//                     },
//                 });

//                 if (!productResponse.ok) {
//                     throw new Error(`Failed to fetch details for product ${product.id}`);
//                 }

//                 const productData = await productResponse.json();
//                 return {
//                     ...product,
//                     price: productData.product.variants.length > 0
//                         ? productData.product.variants[0].price
//                         : productData.product.price,
//                     variants: productData.product.variants
//                 };
//             })
//         );

//         res.json({
//             products: productsWithDetails,
//             nextPageInfo: nextPageInfo || null,
//             prevPageInfo: prevPageInfo || null,
//         });
//     } catch (error) {
//         console.error('Error fetching products:', error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });

// app.get('/api/product_options/:productId', async (req, res) => {
//     const { productId } = req.params;

//     try {
//         const response = await fetch(`https://productoption.hulkapps.com/v1/products/?product_id=${productId}&shop_domain=${shopifyShopName}.myshopify.com`, {
//             method: 'GET',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Authorization': hulkKey
//             },
//         });

//         if (!response.ok) {
//             throw new Error('Failed to fetch product options');
//         }

//         const data = await response.json();
//         res.json(data);
//     } catch (error) {
//         console.error('Error fetching product options:', error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });

// app.post('/api/hulk/cart', async (req, res) => {

//     try {
//         const response = await fetch(`https://productoption.hulkapps.com/v1/cart`, {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Authorization': hulkKey
//             },
//             body: JSON.stringify(req.body)
//         });

//         if (!response.ok) {
//             const errorResponse = await response.json();
//             const errorMessage = errorResponse.error || 'An error occurred while processing the request';
//             throw new Error(JSON.stringify(errorResponse));
//         }

//         const data = await response.json();
//         res.json(data);
//     } catch (error) {
//         console.error('Error sending cart:', error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });

// app.listen(port, () => {
//     console.log(`Server is running on port ${port}`);
// });


import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import crypto from 'crypto';
import Shopify from 'shopify-api-node';

dotenv.config();

const app = express();
const port = process.env.PORT || 3030;
const shopifyAccessToken = process.env.SHOPIFY_ACCESS_TOKEN;
const shopifyShopName = process.env.SHOPIFY_SHOP_NAME;
const hulkKey = process.env.HULK_KEY;
const sharedSecret = process.env.SHARED_SECRET_KEY;

const shopify = new Shopify({
    shopName: shopifyShopName,
    accessToken: shopifyAccessToken,
});

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

const fetchCollectionsWithProductCount = async () => {
    const collections = await shopify.customCollection.list({ limit: 250 });

    const collectionsWithCounts = await Promise.all(
        collections.map(async (collection) => {
            const products = await shopify.product.list({
                collection_id: collection.id,
                limit: 5,
            });

            let metafields = [];
            try {
                metafields = await shopify.metafield.list({
                    metafield: { owner_resource: 'collection', owner_id: collection.id },
                });
            } catch (err) {
                console.warn(`Failed to fetch metafields for collection ID ${collection.id}`);
            }

            return {
                ...collection,
                product_count: products.length,
                metafields,
            };
        })
    );

    return collectionsWithCounts;
};

// Endpoint for fetching collections
app.get('/api/collections', async (req, res) => {
    try {
        const collections = await fetchCollectionsWithProductCount();
        res.json(collections);
    } catch (error) {
        console.error('Error fetching collections:', error);
        res.status(500).json({ error: 'Failed to fetch collections', details: error.message });
    }
});

// Endpoint for fetching all products
app.get('/api/products', async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const pageInfo = req.query.page_info || undefined;

    try {
        const products = await shopify.product.list({ limit, page_info: pageInfo });

        const linkHeader = products.headers.link || '';
        let nextPageInfo = null;
        let prevPageInfo = null;

        const nextLinkMatch = linkHeader.match(/<([^>]+)>; rel="next"/);
        const prevLinkMatch = linkHeader.match(/<([^>]+)>; rel="previous"/);

        if (nextLinkMatch) {
            const urlParams = new URLSearchParams(nextLinkMatch[1].split('?')[1]);
            nextPageInfo = urlParams.get('page_info');
        }

        if (prevLinkMatch) {
            const urlParams = new URLSearchParams(prevLinkMatch[1].split('?')[1]);
            prevPageInfo = urlParams.get('page_info');
        }

        res.json({
            products,
            nextPageInfo: nextPageInfo || null,
            prevPageInfo: prevPageInfo || null,
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products', details: error.message });
    }
});

app.get('/api/products/:collectionId', async (req, res) => {
    const { collectionId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    const pageInfo = req.query.page_info || undefined;

    try {
        const products = await shopify.product.list({
            collection_id: collectionId,
            limit,
            page_info: pageInfo,
        });

        const linkHeader = products.headers.link || '';
        let nextPageInfo = null;
        let prevPageInfo = null;

        const nextLinkMatch = linkHeader.match(/<([^>]+)>; rel="next"/);
        const prevLinkMatch = linkHeader.match(/<([^>]+)>; rel="previous"/);

        if (nextLinkMatch) {
            const urlParams = new URLSearchParams(nextLinkMatch[1].split('?')[1]);
            nextPageInfo = urlParams.get('page_info');
        }

        if (prevLinkMatch) {
            const urlParams = new URLSearchParams(prevLinkMatch[1].split('?')[1]);
            prevPageInfo = urlParams.get('page_info');
        }

        const productsWithDetails = await Promise.all(
            products.map(async (product) => {
                const detailedProduct = await shopify.product.get(product.id);

                return {
                    ...product,
                    price: detailedProduct.variants[0]?.price || detailedProduct.price,
                    variants: detailedProduct.variants,
                };
            })
        );

        res.json({
            products: productsWithDetails,
            nextPageInfo: nextPageInfo || null,
            prevPageInfo: prevPageInfo || null,
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

