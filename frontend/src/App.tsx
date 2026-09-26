import { ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Sidebar } from './components/Sidebar';
import { Canvas } from './components/Canvas';
import { useStore } from './store/useStore';
import { Moon, Sun } from 'lucide-react';
import { useEffect } from 'react';

function App() {
    const { isDark, setTheme, parseRawText, getRawText } = useStore();

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
        // Init with default text
        parseRawText(getRawText());
    }, []);

    return (
        <div className="flex w-screen h-screen overflow-hidden text-textMain bg-bg transition-colors">
            <Sidebar />
            <ReactFlowProvider>
                <Canvas />
            </ReactFlowProvider>
            
            <button 
                onClick={() => setTheme(!isDark)}
                className="absolute top-4 right-4 z-50 p-2 rounded-full bg-panel border border-border shadow hover:bg-bg transition-colors"
                title="Toggle Theme"
            >
                {isDark ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} className="text-slate-600" />}
            </button>
        </div>
    );
}

export default App;
