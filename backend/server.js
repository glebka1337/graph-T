const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const DATA_DIR = path.join(__dirname, 'data', 'graphs');

// Ensure data directory exists
async function ensureDir() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
    } catch (err) {
        console.error('Could not create data dir', err);
    }
}
ensureDir();

// GET all graphs
app.get('/api/graphs', async (req, res) => {
    try {
        const files = await fs.readdir(DATA_DIR);
        const graphs = [];
        for (const file of files) {
            if (file.endsWith('.json')) {
                const content = await fs.readFile(path.join(DATA_DIR, file), 'utf8');
                const data = JSON.parse(content);
                graphs.push({
                    id: data.id,
                    name: data.name,
                    updatedAt: data.updatedAt
                });
            }
        }
        res.json(graphs.sort((a, b) => b.updatedAt - a.updatedAt));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET single graph
app.get('/api/graphs/:id', async (req, res) => {
    try {
        const file = path.join(DATA_DIR, req.params.id + '.json');
        const content = await fs.readFile(file, 'utf8');
        res.json(JSON.parse(content));
    } catch (error) {
        res.status(404).json({ error: 'Graph not found' });
    }
});

// POST save graph
app.post('/api/graphs', async (req, res) => {
    try {
        const { id, name, globalEdges, globalNodes, globalEdgeProps } = req.body;
        if (!id) return res.status(400).json({ error: 'Missing ID' });
        
        const graphData = {
            id,
            name: name || 'Untitled Graph',
            updatedAt: Date.now(),
            globalEdges,
            globalNodes,
            globalEdgeProps
        };
        
        const file = path.join(DATA_DIR, id + '.json');
        await fs.writeFile(file, JSON.stringify(graphData, null, 2));
        res.json({ success: true, id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE graph
app.delete('/api/graphs/:id', async (req, res) => {
    try {
        const file = path.join(DATA_DIR, req.params.id + '.json');
        await fs.unlink(file);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(3001, () => {
    console.log('Backend running on port 3001');
});
