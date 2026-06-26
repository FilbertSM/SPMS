import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

// ==========================================
// 1. API HOOK IMPLEMENTATIONS (AXIOS)
// ==========================================
const uploadEngineeringManual = async (file, currentMachine, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    
    // It attaches the machine string (e.g. "FETTE") as the metadata tag
    formData.append('machine_type', currentMachine); 

    const response = await axios.post('http://127.0.0.1:8000/api/rag/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: onUploadProgress // This keeps your progress bar working!
    });
    
    return response.data;
};

const sendChatQuestion = async (trimmedQuery, currentMachine, targetLanguage) => {
  try {
    const response = await axios.post('http://127.0.0.1:8000/api/rag/chat', {
      question: trimmedQuery,
      machine_filter: currentMachine,
      target_language: targetLanguage
    }, {
      timeout: 120000, 
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error("Full Backend Error:", error);
    if (error.response) throw new Error(`Server Error: ${error.response.data.detail || error.message}`);
    else if (error.request) throw new Error("The AI is taking too long to process. Please try again.");
    else throw new Error(error.message);
  }
};

// ==========================================
// 2. MAIN DASHBOARD COMPONENT
// ==========================================
const SPMSChatDashboard = () => {
  // Chat States
  const [messages, setMessages] = useState([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  
  // Upload States
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [systemNotification, setSystemNotification] = useState({ text: '', type: '' });

  const [activeMachine, setActiveMachine] = useState('PMA');

  const chatBottomRef = useRef(null);

  const [selectedLanguage, setSelectedLanguage] = useState("English");

// Dynamic Equipment States
  const [machineList, setMachineList] = useState(['PMA Granulator', 'Fette Tablet Press', 'Wetmill']);
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customMachineName, setCustomMachineName] = useState('');
  


  // Auto-scroll chat window to the latest message
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isQuerying]);

  // Handle File Selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setSystemNotification({ text: '', type: '' });
    } else {
      setSelectedFile(null);
      setSystemNotification({ text: 'Invalid file format. Please select a .pdf file.', type: 'error' });
    }
  };

// Handle Manual Upload
  const handleManualUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadProgress(0);
    setSystemNotification({ text: 'Initializing pipeline & structuring document chunks...', type: 'info' });

    try {
      // THE FIX: We added "activeMachine" right after "selectedFile"
      const data = await uploadEngineeringManual(selectedFile, activeMachine, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      });
      
      setSystemNotification({ text: `Success: ${data.message}`, type: 'success' });
      setSelectedFile(null);
    } catch (error) {
      setSystemNotification({ text: error.message, type: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle Chat Submission
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const trimmedQuery = inputQuery.trim();
    if (!trimmedQuery || isQuerying) return;

    const botResponse = await sendChatQuestion(trimmedQuery, activeMachine, selectedLanguage);

    // Append user query to thread immediately
    const userMessage = { sender: 'user', text: trimmedQuery, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setIsQuerying(true);

    try {
      // 2. Await the backend
      console.log("SENDING TO PYTHON:", selectedLanguage);
      const responseData = await sendChatQuestion(trimmedQuery, activeMachine, selectedLanguage);
      
      // THE FIX 1: Protect against undefined/null responses
      if (!responseData) {
        throw new Error("Backend returned an empty response.");
      }

      let safeText = "No response text found.";
      
      // THE FIX 2: Use optional chaining (?.) just in case it's a raw string and has no .answer property
      const targetData = responseData?.answer || responseData;

      // 3. Extract the safe text
      if (typeof targetData === 'string') {
        safeText = targetData;
      } else if (typeof targetData === 'object' && targetData !== null) {
        // Fallback just in case it returns an unexpected JSON structure
        safeText = JSON.stringify(targetData);
      }

      // 4. Append the bot's response to the chat
      const botMessage = { sender: 'bot', text: safeText, timestamp: new Date() };
      setMessages((prev) => [...prev, botMessage]);

    } catch (error) {
      console.error("Chat Error:", error);
      
      // Tell the user something went wrong instead of failing silently
      const errorMessage = { 
        sender: 'bot', 
        text: "⚠️ Network Error: Could not reach the AI. Please try again.", 
        timestamp: new Date() 
      };
      setMessages((prev) => [...prev, errorMessage]);

    } finally {
      // THE FIX 3: This ALWAYS runs, even if the try block crashes. 
      // It guarantees your UI will never freeze!
      setIsQuerying(false);
    }
  };

  return (
    <div className="flex flex-col h-screen font-sans bg-slate-100">
      
      {/* Top Header Bar */}
      <header className="py-4 px-5 bg-slate-800 text-white flex justify-between items-center shadow-md z-10">
        <h2 className="m-0 text-lg font-medium tracking-wide">🛠️ SPMS | Document Intelligence Control Panel</h2>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* ========================================== */}
        {/* Left Control Panel: Document Operations    */}
        {/* ========================================== */}
        <aside className="w-80 bg-white border-r border-slate-200 p-5 flex flex-col gap-5 overflow-y-auto">
          <div>
            <h3 className="m-0 mb-2.5 text-sm font-semibold text-slate-700">Knowledge Base Management</h3>
            <p className="text-xs text-slate-500 m-0 mb-4 leading-relaxed">Upload a technical machine manual or system guide to refresh the underlying Chroma vector index.</p>
            
            {/* --- SMART DYNAMIC MACHINE SELECTION DROPDOWN --- */}
            <div className="mb-6 bg-white p-4 rounded-lg border border-slate-100 shadow-sm">
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                Active Equipment Module
              </label>
              
              {!isAddingCustom ? (
                // 1. The Standard Dropdown
                <select
                  value={activeMachine}
                  onChange={(e) => {
                    if (e.target.value === "ADD_NEW") {
                      setIsAddingCustom(true);
                    } else {
                      setActiveMachine(e.target.value);
                    }
                  }}
                  className="w-full p-2 border border-slate-300 rounded-md bg-slate-50 text-slate-800 outline-none cursor-pointer text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                >
                  {machineList.map(machine => (
                    <option key={machine} value={machine}>{machine}</option>
                  ))}
                  <option disabled>──────────</option>
                  <option value="ADD_NEW" className="text-blue-600 font-semibold">+ Add New Equipment...</option>
                </select>
              ) : (
                // 2. The Custom Text Input Override
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Type machine name..."
                    value={customMachineName}
                    onChange={(e) => setCustomMachineName(e.target.value)}
                    className="flex-1 p-2 border border-slate-300 rounded-md bg-slate-50 text-slate-800 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    autoFocus
                  />
                  <button 
                    onClick={() => {
                      if (customMachineName.trim()) {
                        const newMachine = customMachineName.trim();
                        setMachineList(prev => [...prev, newMachine]);
                        setActiveMachine(newMachine);
                        setIsAddingCustom(false);
                        setCustomMachineName('');
                      }
                    }}
                    className="py-2 px-3 bg-emerald-500 text-white border-none rounded-md cursor-pointer font-bold text-xs hover:bg-emerald-600 transition-colors"
                  >
                    Save
                  </button>
                  <button 
                    onClick={() => {
                      setIsAddingCustom(false);
                      setCustomMachineName('');
                    }}
                    className="py-2 px-3 bg-slate-200 text-slate-600 border-none rounded-md cursor-pointer font-bold text-xs hover:bg-slate-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
              <p className="text-[11px] text-slate-400 mt-2 m-0 leading-normal">
                Uploads and searches will be strictly isolated to this module.
              </p>
            </div>
            {/* --- END SMART DROPDOWN --- */}

            <div className="border-2 border-dashed border-slate-300 rounded-md p-4 text-center bg-slate-50 hover:bg-slate-100 transition-colors">
              <input 
                type="file" 
                accept=".pdf" 
                id="file-upload" 
                onChange={handleFileChange} 
                disabled={isUploading}
                className="hidden" 
              />
              <label 
                htmlFor="file-upload" 
                className={`text-sm font-bold text-blue-600 select-none ${isUploading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
              >
                {selectedFile ? '🔄 Change PDF File' : '📁 Select Technical PDF'}
              </label>
              {selectedFile && <div className="text-xs mt-2 text-slate-600 break-all">{selectedFile.name}</div>}
            </div>

            <button
              onClick={handleManualUpload}
              disabled={!selectedFile || isUploading}
              className={`w-full mt-3 p-2.5 text-white border-none rounded font-bold text-sm shadow-sm transition-all ${
                !selectedFile || isUploading 
                  ? 'bg-slate-300 cursor-not-allowed' 
                  : 'bg-blue-600 cursor-pointer hover:bg-blue-700 active:scale-[0.99]'
              }`}
            >
              {isUploading ? 'Compiling Embeddings...' : 'Upload & Parse Manual'}
            </button>

            {isUploading && (
              <div className="mt-3">
                <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                  <span>Uploading File Stream</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full transition-all duration-200 ease-out" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Operation Status Notifications */}
          {systemNotification.text && (
            <div className={`p-3 rounded border text-xs leading-relaxed transition-all shadow-sm ${
              systemNotification.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                : systemNotification.type === 'error' 
                ? 'bg-rose-50 text-rose-800 border-rose-200' 
                : 'bg-blue-50 text-blue-800 border-blue-200'
            }`}>
              {systemNotification.text}
            </div>
          )}
        </aside>

        {/* ========================================== */}
        {/* Right Section: Conversational Chat Area    */}
        {/* ========================================== */}
        <main className="flex-1 flex flex-col bg-slate-50">
          
          {/* --- NEW CHAT HEADER (Language Toggle Moved Here) --- */}
          <div className="flex justify-between items-center py-3.5 px-6 bg-white border-b border-slate-200 shadow-sm z-0">
            <h2 className="m-0 text-sm font-semibold text-slate-800 tracking-wide">
              SPMS Assistant <span className="text-xs font-normal text-slate-400 ml-2">({activeMachine})</span>
            </h2>
            
            <button 
              onClick={() => setSelectedLanguage((prev) => prev === "English" ? "Bahasa Indonesia" : "English")}
              className="py-1 px-4 bg-blue-50 text-blue-700 border border-blue-200 rounded-full cursor-pointer font-bold text-xs tracking-wide transition-all hover:bg-blue-100 hover:border-blue-300 active:scale-[0.97]"
            >
              Language: {selectedLanguage === "English" ? "🇺🇸 EN" : "🇮🇩 ID"}
            </button>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-4">
            {messages.length === 0 && !isQuerying && (
              <div className="m-auto text-center text-slate-400 max-w-[400px] select-none">
                <div className="text-4xl mb-3.5">🤖</div>
                <h4 className="m-0 mb-1.5 text-sm font-semibold text-slate-500">Grounded RAG Interface Online</h4>
                <p className="text-xs m-0 leading-relaxed text-slate-400">Ask standard maintenance procedures, troubleshooting codes, or threshold calibrations indexed from your engineering manuals.</p>
              </div>
            )}

            {messages.map((msg, index) => (
              <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                
                {/* Bubble content */}
                <div style={{
                  maxWidth: '75%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  backgroundColor: msg.sender === 'user' ? '#2563eb' : msg.sender === 'system-error' ? '#fef2f2' : '#fff',
                  color: msg.sender === 'user' ? '#fff' : msg.sender === 'system-error' ? '#991b1b' : '#1e293b',
                  border: msg.sender === 'user' ? 'none' : `1px solid ${msg.sender === 'system-error' ? '#fca5a5' : '#e2e8f0'}`,
                  boxShadow: msg.sender === 'user' ? 'none' : '0 1px 2px rgba(0,0,0,0.05)',
                  whiteSpace: 'pre-wrap'
                }}>
                  {msg.text}
                </div>

                {/* Grounding Metadata / Token Receipts for AI Responses */}
                {msg.sender === 'ai' && msg.metadata && (
                  <div style={{
                    marginTop: '6px',
                    padding: '8px 12px',
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    fontSize: '11px',
                    color: '#475569',
                    fontFamily: 'monospace',
                    display: 'flex',
                    gap: '15px'
                  }}>
                    <span>📊 <b>Prompt:</b> {msg.metadata.input_tokens}t</span>
                    <span><b>Generation:</b> {msg.metadata.output_tokens}t</span>
                    <span><b>Total:</b> {msg.metadata.total_tokens}t</span>
                  </div>
                )}
              </div>
            ))}

            {/* AI Generation Loader State */}
            {isQuerying && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <div style={{
                  padding: '12px 16px',
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: '#64748b',
                  fontStyle: 'italic'
                }}>
                  Searching vector arrays and synthesizing responses...
                </div>
              </div>
            )}
            
            <div ref={chatBottomRef} />
          </div>

          {/* Lower Input Container Form */}
          <div style={{ padding: '15px 20px', backgroundColor: '#fff', borderTop: '1px solid #e2e8f0' }}>
            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ask an engineering or manual maintenance question..."
                disabled={isQuerying}
                style={{
                  flex: 1,
                  padding: '12px 15px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                  backgroundColor: isQuerying ? '#f8fafc' : '#fff'
                }}
              />
              <button
                type="submit"
                disabled={!inputQuery.trim() || isQuerying}
                style={{
                  padding: '0 20px',
                  backgroundColor: !inputQuery.trim() || isQuerying ? '#cbd5e1' : '#1e293b',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: !inputQuery.trim() || isQuerying ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}
              >
                Send
              </button>
            </form>
          </div>

        </main>
      </div>
    </div>
  );
};

export default SPMSChatDashboard;