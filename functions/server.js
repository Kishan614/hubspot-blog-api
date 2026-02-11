const express = require('express');
const axios = require('axios');
const serverless = require('serverless-http');

const app = express();

// Use a single route handler for the root path
app.get('/', async (req, res) => {
    fetchBlogs(req, res);
});

// Also handle the explicit slug just in case
app.get('/fetch-blogs', async (req, res) => {
    fetchBlogs(req, res);
});

async function fetchBlogs(req, res) {
    const allPosts = [];
    let after = null;
    const url = 'https://api.hubapi.com/cms/v3/blogs/posts';

    try {
        // Fetching 2 pages (200 posts) to ensure we stay under the 10s timeout
        let pageCount = 0;
        const maxPages = 2; 

        do {
            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                params: {
                    limit: 100,
                    after: after
                }
            });

            const data = response.data;
            allPosts.push(...data.results);
            after = data.paging?.next?.after;
            pageCount++;

        } while (after && pageCount < maxPages);

        res.json({
            success: true,
            total_fetched: allPosts.length,
            posts: allPosts
        });

    } catch (error) {
        res.status(500).json({ 
            error: 'HubSpot API Error',
            message: error.response?.data?.message || error.message 
        });
    }
}

module.exports.handler = serverless(app);