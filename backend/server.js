const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const DATA_DIR = path.join(__dirname, 'data', 'graphs');

async function ensureDir() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
    } catch (err) {
        console.error('Could not create data dir', err);
    }
}
ensureDir();

async function getAllGraphs() {
    try {
        const files = await fs.readdir(DATA_DIR);
        const graphs = [];
        for (const file of files) {
            if (file.endsWith('.json')) {
                const content = await fs.readFile(path.join(DATA_DIR, file), 'utf8');
                graphs.push(JSON.parse(content));
            }
        }
        return graphs;
    } catch (e) {
        return [];
    }
}

app.get('/api/graphs', async (req, res) => {
    try {
        const graphs = await getAllGraphs();
        const summaries = graphs.map(g => ({ id: g.id, name: g.name, updatedAt: g.updatedAt }));
        res.json(summaries.sort((a, b) => b.updatedAt - a.updatedAt));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/graphs/:id', async (req, res) => {
    try {
        const file = path.join(DATA_DIR, req.params.id + '.json');
        const content = await fs.readFile(file, 'utf8');
        res.json(JSON.parse(content));
    } catch (error) {
        res.status(404).json({ error: 'Graph not found' });
    }
});

app.post('/api/graphs', async (req, res) => {
    try {
        const { id, name, globalEdges, globalNodes, globalEdgeProps } = req.body;
        if (!id) return res.status(400).json({ error: 'Missing ID' });
        
        const allGraphs = await getAllGraphs();
        const existingName = allGraphs.find(g => g.name.toLowerCase() === name.toLowerCase() && g.id !== id);
        
        if (existingName) {
            return res.status(400).json({ error: 'Graph with this name already exists.' });
        }
        
        const file = path.join(DATA_DIR, id + '.json');
        
        // Check if updating existing to preserve created time
        let existingData = null;
        try {
            const content = await fs.readFile(file, 'utf8');
            existingData = JSON.parse(content);
        } catch (e) {}

        const graphData = {
            id,
            name: name || 'Untitled Graph',
            updatedAt: Date.now(),
            createdAt: existingData?.createdAt || Date.now(),
            globalEdges: globalEdges || [],
            globalNodes: globalNodes || {},
            globalEdgeProps: globalEdgeProps || {}
        };
        
        await fs.writeFile(file, JSON.stringify(graphData, null, 2));
        res.json({ success: true, graph: graphData });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/graphs/:id', async (req, res) => {
    try {
        const file = path.join(DATA_DIR, req.params.id + '.json');
        await fs.unlink(file);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// GET all data for backup
app.get('/api/backup', async (req, res) => {
    try {
        const graphs = await getAllGraphs();
        res.json(graphs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST restore all data
app.post('/api/restore', async (req, res) => {
    try {
        const graphs = req.body;
        if (!Array.isArray(graphs)) {
            return res.status(400).json({ error: 'Expected array of graphs' });
        }
        
        // Wipe existing
        const files = await fs.readdir(DATA_DIR);
        for (const file of files) {
            if (file.endsWith('.json')) {
                await fs.unlink(path.join(DATA_DIR, file));
            }
        }
        
        // Write new
        for (const graph of graphs) {
            if (graph.id && graph.name) {
                const file = path.join(DATA_DIR, graph.id + '.json');
                await fs.writeFile(file, JSON.stringify(graph, null, 2));
            }
        }
        
        res.json({ success: true, count: graphs.length });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Serve static frontend files in production
const distPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(3001, () => {
