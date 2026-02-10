const express = require('express');
const axios = require('axios');
const serverless = require('serverless-http');

const app = express();
const router = express.Router();

// Define the route on the router
router.get('/fetch-blogs', async (req, res) => {
    const allPosts = [];
    let after = null;
    const url = 'https://api.hubapi.com/cms/v3/blogs/posts';

    try {
        // NOTE: Netlify Free tier has a 10s timeout. 
        // We will fetch up to 5 pages (500 posts) to avoid timing out.
        let pageCount = 0;
        const maxPages = 5; 

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
            count_in_this_request: allPosts.length,
            posts: allPosts,
            next_page: after || "End of results"
        });

    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
        res.status(500).json({ 
            error: 'Failed to fetch blogs',
            details: error.response?.data?.message || error.message 
        });
    }
});

// Point the app to use the router under the base path
app.use('/.netlify/functions/server', router);

// Export the app wrapped in the serverless-http handler
module.exports.handler = serverless(app);