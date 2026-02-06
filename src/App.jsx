import { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';
import { appWindow } from '@tauri-apps/api/window';

function App() {
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef(null);

  // Focus textarea when window gets focus
  useEffect(() => {
    const unlisten = appWindow.onFocusChanged(({ focused }) => {
      if (focused) {
        setTimeout(() => textareaRef.current?.focus(), 50);
      }
    });
    return () => {
      unlisten.then(f => f());
    };
  }, []);

  const handleKeyDown = async (e) => {
    // CMD+Enter to submit
    if (e.key === 'Enter' && e.metaKey) {
      e.preventDefault();
      if (!text.trim()) return;
      
      await handleSubmit();
    }
    // ESC to close/hide
    if (e.key === 'Escape') {
      e.preventDefault();
      await appWindow.hide();
    }
  };

  const handleSubmit = async () => {
    setIsSending(true);
    try {
      const isDelegate = text.toLowerCase().includes('дживс') || text.includes('#дд') || text.includes('#dd');
      
      const { error } = await supabase
        .from('items')
        .insert([
          { 
            content: text,
            status: 'inbox',
            type: 'note', // Default to note, system can retriage later
            user_id: '6ee6af...', // TODO: Auth or fetch dynamically
            metadata: {
               source: 'fleeets-companion',
               delegated: isDelegate
            }
          }
        ]);

      if (error) throw error;

      setText('');
      // Toast success?
      await appWindow.hide();
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Failed to save item');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen w-screen p-4 bg-transparent">
      <div className="w-full max-w-2xl bg-[#1c1c1c]/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Omni-Bar Input */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a thought, task, or ask Jeeves..."
            className="w-full bg-transparent text-white text-lg placeholder-white/30 p-6 min-h-[60px] max-h-[300px] resize-none focus:outline-none scrollbar-hide"
            rows={1}
            style={{ height: 'auto' }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
          />
          
          <div className="absolute bottom-4 right-4 flex gap-2 text-xs font-mono text-white/40 pointer-events-none">
            <span className="bg-white/10 px-1.5 py-0.5 rounded">⏎ Return</span>
            <span>to new line</span>
            <span className="bg-white/10 px-1.5 py-0.5 rounded ml-2">⌘ ⏎</span>
            <span>to save</span>
          </div>
        </div>

        {/* Footer / Context (Hidden unless active) */}
        {isSending && (
          <div className="h-1 w-full bg-blue-500/20">
            <div className="h-full bg-blue-500 animate-progress"></div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
