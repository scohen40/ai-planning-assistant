// API Configuration
const API_BASE_URL = 'http://localhost:8000';

// DOM Elements
const contextInput = document.getElementById('contextInput');
const addContextCheckbox = document.getElementById('addContext');
const generateBtn = document.getElementById('generateBtn');
const outputArea = document.getElementById('outputArea');
const loadingSpinner = document.getElementById('loadingSpinner');
const planOutput = document.getElementById('planOutput');
const tasksList = document.getElementById('tasksList');
const savedTasks = document.getElementById('savedTasks');

// State
let currentPlan = null;
let allTasks = [];
let brainDumps = []; // Array of brain dump objects: {id, textarea, recordBtn, recognition, isRecording}
let currentTaskTree = null;
let currentStage = null; // 'initial' or 'refined'
let brainDumpCounter = 0;
let uploadedFiles = []; // Array of uploaded file objects: {id, name, content}

// Event Listeners
addContextCheckbox.addEventListener('change', (e) => {
    contextInput.style.display = e.target.checked ? 'block' : 'none';
});

generateBtn.addEventListener('click', generatePlan);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAPIHealth();
    loadSavedTasks();
    initializeBrainDumps();
    updateToDoListsDisplay();
    initializeFileUpload();
    initializeFileUpload();
    
    // Setup modal event listeners
    const closeModalBtn = document.querySelector('.close-modal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeToDoModal);
    }
    
    // Click outside modal to close
    window.addEventListener('click', (event) => {
        const todoModal = document.getElementById('todoModal');
        if (todoModal && event.target === todoModal) {
            closeToDoModal();
        }
        
        const viewModal = document.getElementById('viewTaskTreeModal');
        if (viewModal && event.target === viewModal) {
            closeViewTaskTreeModal();
        }
        
        const todoListViewModal = document.getElementById('viewTodoListModal');
        if (todoListViewModal && event.target === todoListViewModal) {
            closeTodoListViewModal();
        }
    });
    
    // Modal option buttons
    const manualSelectBtn = document.getElementById('manualSelectTodoBtn');
    if (manualSelectBtn) {
        manualSelectBtn.addEventListener('click', showManualSelection);
    }
    
    const aiGenerateBtn = document.getElementById('aiGenerateTodoBtn');
    if (aiGenerateBtn) {
        aiGenerateBtn.addEventListener('click', showAiGeneration);
    }
    
    // Create buttons
    const createManualBtn = document.getElementById('createManualTodoBtn');
    if (createManualBtn) {
        createManualBtn.addEventListener('click', createManualTodoList);
    }
    
    const generateAiBtn = document.getElementById('generateAiTodoBtn');
    if (generateAiBtn) {
        generateAiBtn.addEventListener('click', generateAiTodoList);
    }
});

// Functions
function initializeFileUpload() {
    const fileInput = document.getElementById('fileUpload');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileUpload);
    }
}

async function handleFileUpload(event) {
    const files = Array.from(event.target.files);
    const container = document.getElementById('uploadedFilesContainer');
    
    for (const file of files) {
        try {
            const text = await readFileAsText(file);
            
            const fileEntry = {
                id: Date.now() + Math.random(),
                name: file.name,
                content: text
            };
            
            uploadedFiles.push(fileEntry);
            
            // Display file in UI
            const fileDiv = document.createElement('div');
            fileDiv.className = 'uploaded-file-item';
            fileDiv.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 8px; margin: 5px 0; background: #f0f0f0; border-radius: 4px;';
            fileDiv.innerHTML = `
                <span>📄 ${file.name} (${(file.size / 1024).toFixed(1)} KB)</span>
                <button onclick="removeUploadedFile(${fileEntry.id})" style="background: #ff4444; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer;">✕</button>
            `;
            container.appendChild(fileDiv);
            
        } catch (error) {
            console.error('Error reading file:', error);
            alert(`Failed to read ${file.name}: ${error.message}`);
        }
    }
    
    // Reset file input
    event.target.value = '';
}

function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

function removeUploadedFile(fileId) {
    uploadedFiles = uploadedFiles.filter(f => f.id !== fileId);
    
    // Re-render uploaded files
    const container = document.getElementById('uploadedFilesContainer');
    container.innerHTML = '';
    
    uploadedFiles.forEach(file => {
        const fileDiv = document.createElement('div');
        fileDiv.className = 'uploaded-file-item';
        fileDiv.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 8px; margin: 5px 0; background: #f0f0f0; border-radius: 4px;';
        fileDiv.innerHTML = `
            <span>📄 ${file.name}</span>
            <button onclick="removeUploadedFile(${file.id})" style="background: #ff4444; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer;">✕</button>
        `;
        container.appendChild(fileDiv);
    });
}

function initializeBrainDumps() {
    const container = document.getElementById('brainDumpsContainer');
    if (!container) return;
    
    // Set up add button listener
    const addBtn = document.getElementById('addBrainDumpBtn');
    if (addBtn) {
        addBtn.addEventListener('click', addBrainDump);
    }
    
    // Add first brain dump
    addBrainDump();
}

function initializeFileUpload() {
    const fileInput = document.getElementById('fileUpload');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileUpload);
    }
}

async function handleFileUpload(event) {
    const files = Array.from(event.target.files);
    const container = document.getElementById('uploadedFilesContainer');
    
    for (const file of files) {
        try {
            const text = await readFileAsText(file);
            
            const fileEntry = {
                id: Date.now() + Math.random(),
                name: file.name,
                content: text
            };
            
            uploadedFiles.push(fileEntry);
            
            // Display file in UI
            const fileDiv = document.createElement('div');
            fileDiv.className = 'uploaded-file-item';
            fileDiv.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 8px; margin: 5px 0; background: #f0f0f0; border-radius: 4px;';
            fileDiv.innerHTML = `
                <span>📄 ${file.name} (${(file.size / 1024).toFixed(1)} KB)</span>
                <button onclick="removeUploadedFile(${fileEntry.id})" style="background: #ff4444; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer;">✕</button>
            `;
            container.appendChild(fileDiv);
            
        } catch (error) {
            console.error('Error reading file:', error);
            alert(`Failed to read ${file.name}: ${error.message}`);
        }
    }
    
    // Reset file input
    event.target.value = '';
}

function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

function removeUploadedFile(fileId) {
    uploadedFiles = uploadedFiles.filter(f => f.id !== fileId);
    
    // Re-render uploaded files
    const container = document.getElementById('uploadedFilesContainer');
    container.innerHTML = '';
    
    uploadedFiles.forEach(file => {
        const fileDiv = document.createElement('div');
        fileDiv.className = 'uploaded-file-item';
        fileDiv.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 8px; margin: 5px 0; background: #f0f0f0; border-radius: 4px;';
        fileDiv.innerHTML = `
            <span>📄 ${file.name}</span>
            <button onclick="removeUploadedFile(${file.id})" style="background: #ff4444; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer;">✕</button>
        `;
        container.appendChild(fileDiv);
    });
}

function addBrainDump() {
    const container = document.getElementById('brainDumpsContainer');
    if (!container) return;
    
    const id = brainDumpCounter++;
    const brainDumpDiv = document.createElement('div');
    brainDumpDiv.className = 'brain-dump-item';
    brainDumpDiv.id = `brain-dump-${id}`;
    brainDumpDiv.style.cssText = 'margin-bottom: 20px; border: 1px solid #ddd; border-radius: 8px; padding: 15px; background: #f9faf9;';
    
    const header = document.createElement('div');
    header.style.cssText = 'display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;';
    
    const title = document.createElement('h3');
    title.textContent = `Brain Dump ${brainDumps.length + 1}`;
    title.style.cssText = 'margin: 0; color: var(--primary-color); font-size: 1em;';
    
    const buttonsDiv = document.createElement('div');
    buttonsDiv.style.cssText = 'display: flex; gap: 10px;';
    
    const recordBtn = document.createElement('button');
    recordBtn.className = 'record-btn';
    recordBtn.title = 'Start recording';
    recordBtn.innerHTML = '<span class="record-icon" style="font-size: 18px;">🎤</span>';
    recordBtn.style.cssText = 'width: 40px; height: 40px; border-radius: 50%; border: 2px solid var(--primary-color); background: white; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.3s; padding: 0; flex-shrink: 0;';
    
    const uploadBtn = document.createElement('button');
    uploadBtn.className = 'upload-btn';
    uploadBtn.title = 'Upload handwritten image';
    uploadBtn.innerHTML = '<span class="upload-icon">📷</span>';
    uploadBtn.style.cssText = 'width: 40px; height: 40px; border-radius: 50%; border: 2px solid var(--primary-color); background: white; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.3s; font-size: 20px; padding: 0; flex-shrink: 0;';
    
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'secondary-btn';
    deleteBtn.textContent = '✕ Delete';
    deleteBtn.style.cssText = 'background: #ff4444; color: white; padding: 8px 15px; border: none; border-radius: 4px; cursor: pointer;';
    deleteBtn.style.display = brainDumps.length === 0 ? 'none' : 'block'; // Hide delete for first brain dump
    
    buttonsDiv.appendChild(recordBtn);
    buttonsDiv.appendChild(uploadBtn);
    buttonsDiv.appendChild(deleteBtn);
    buttonsDiv.appendChild(fileInput);
    
    header.appendChild(title);
    header.appendChild(buttonsDiv);
    
    const textarea = document.createElement('textarea');
    textarea.placeholder = 'Type,  speak, and upload a picture of your written brain dump here...';
    textarea.rows = 4;
    textarea.style.cssText = 'width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-family: inherit; resize: vertical; min-height: 100px; overflow-y: hidden;';
    
    // Auto-resize function
    const autoResize = () => {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    };
    
    // Add input event listener for auto-resize
    textarea.addEventListener('input', autoResize);
    
    // Initial resize
    setTimeout(autoResize, 0);
    
    brainDumpDiv.appendChild(header);
    brainDumpDiv.appendChild(textarea);
    
    // Insert before the add button
    const addBtn = document.getElementById('addBrainDumpBtn');
    container.insertBefore(brainDumpDiv, addBtn);
    
    // Initialize speech recognition for this brain dump
    const brainDump = {
        id,
        textarea,
        recordBtn,
        uploadBtn,
        fileInput,
        recognition: null,
        isRecording: false,
        autoResize
    };
    
    brainDumps.push(brainDump);
    
    // Event listeners
    recordBtn.addEventListener('click', () => toggleRecordingForBrainDump(brainDump));
    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => handleImageUpload(e, brainDump));
    deleteBtn.addEventListener('click', () => deleteBrainDump(id));
}

function toggleRecordingForBrainDump(brainDump) {
    if (!brainDump.recognition) {
        initializeSpeechRecognitionForBrainDump(brainDump);
        if (!brainDump.recognition) return;
    }
    
    if (brainDump.isRecording) {
        stopRecordingForBrainDump(brainDump);
    } else {
        startRecordingForBrainDump(brainDump);
    }
}

function initializeSpeechRecognitionForBrainDump(brainDump) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        console.warn('Speech recognition not supported in this browser');
        brainDump.recordBtn.disabled = true;
        brainDump.recordBtn.title = 'Speech recognition not supported';
        return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    let finalTranscript = '';
    
    recognition.onstart = () => {
        brainDump.isRecording = true;
        brainDump.recordBtn.classList.add('recording');
        brainDump.recordBtn.innerHTML = '<span class="record-icon" style="font-size: 18px; filter: grayscale(0) brightness(1);">🔴</span>';
        brainDump.recordBtn.title = 'Stop recording';
        finalTranscript = brainDump.textarea.value;
    };
    
    recognition.onresult = (event) => {
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            
            if (event.results[i].isFinal) {
                finalTranscript += (finalTranscript ? ' ' : '') + transcript;
            } else {
                interimTranscript += transcript;
            }
        }
        
        brainDump.textarea.value = finalTranscript + (interimTranscript ? ' ' + interimTranscript : '');
        
        // Trigger auto-resize
        brainDump.textarea.style.height = 'auto';
        brainDump.textarea.style.height = brainDump.textarea.scrollHeight + 'px';
    };
    
    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        stopRecordingForBrainDump(brainDump);
        
        if (event.error === 'not-allowed') {
            alert('Microphone access denied. Please allow microphone access to use voice recording.');
        }
    };
    
    recognition.onend = () => {
        if (brainDump.isRecording) {
            recognition.start();
        }
    };
    
    brainDump.recognition = recognition;
}

function startRecordingForBrainDump(brainDump) {
    try {
        brainDump.recognition.start();
    } catch (error) {
        console.error('Error starting recognition:', error);
    }
}

function stopRecordingForBrainDump(brainDump) {
    brainDump.isRecording = false;
    brainDump.recordBtn.classList.remove('recording');
    brainDump.recordBtn.innerHTML = '<span class="record-icon" style="font-size: 18px;">🎤</span>';
    brainDump.recordBtn.title = 'Start recording';
    
    if (brainDump.recognition) {
        brainDump.recognition.stop();
    }
}

function deleteBrainDump(id) {
    const index = brainDumps.findIndex(bd => bd.id === id);
    if (index === -1) return;
    
    // Stop recording if active
    if (brainDumps[index].isRecording) {
        stopRecordingForBrainDump(brainDumps[index]);
    }
    
    // Remove from DOM
    const element = document.getElementById(`brain-dump-${id}`);
    if (element) {
        element.remove();
    }
    
    // Remove from array
    brainDumps.splice(index, 1);
    
    // Update titles
    brainDumps.forEach((bd, i) => {
        const element = document.getElementById(`brain-dump-${bd.id}`);
        if (element) {
            const title = element.querySelector('h3');
            if (title) {
                title.textContent = `Brain Dump ${i + 1}`;
            }
        }
    });
}

async function handleImageUpload(event, brainDump) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Reset the file input so the same file can be uploaded again if needed
    event.target.value = '';
    
    // Show loading state
    const originalIcon = brainDump.uploadBtn.innerHTML;
    brainDump.uploadBtn.innerHTML = '<span class="upload-icon">⏳</span>';
    brainDump.uploadBtn.disabled = true;
    brainDump.uploadBtn.title = 'Extracting text...';
    
    try {
        // Create FormData to send the file
        const formData = new FormData();
        formData.append('file', file);
        
        // Send to backend API
        const response = await fetch(`${API_BASE_URL}/api/extract-text-from-image`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to extract text');
        }
        
        const data = await response.json();
        const extractedText = data.text.trim();
        
        if (extractedText) {
            // Append to existing text with a newline if there's already content
            const currentText = brainDump.textarea.value.trim();
            brainDump.textarea.value = currentText 
                ? `${currentText}\n\n${extractedText}` 
                : extractedText;
            
            // Trigger auto-resize
            brainDump.autoResize();
            
            showSuccess('Text extracted successfully!');
        } else {
            alert('No text found in the image. Please try another image.');
        }
        
    } catch (error) {
        console.error('Error processing image:', error);
        alert(`Failed to extract text from image: ${error.message}`);
    } finally {
        // Restore button state
        brainDump.uploadBtn.innerHTML = originalIcon;
        brainDump.uploadBtn.disabled = false;
        brainDump.uploadBtn.title = 'Upload handwritten image';
    }
}

async function checkAPIHealth() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (!response.ok) {
            showError('Backend API is not responding. Please make sure the server is running.');
        }
    } catch (error) {
        console.warn('Could not connect to backend:', error.message);
    }
}

async function generatePlan() {
    // Collect all brain dump texts
    const allTexts = brainDumps
        .map(bd => bd.textarea.value.trim())
        .filter(text => text.length > 0);
    
    // Add uploaded file contents
    const fileTexts = uploadedFiles.map(f => `[From file: ${f.name}]\n${f.content}`);
    allTexts.push(...fileTexts);
    
    if (allTexts.length === 0) {
        alert('Please enter at least one brain dump or upload a file');
        return;
    }
    
    // Warn if re-generating with existing task tree
    if (currentTaskTree) {
        if (!confirm('⚠️ Re-generating will update your task tree structure.\n\nIMPORTANT: While we preserve item names and IDs, any structural changes may affect to-do list associations and completion progress.\n\nContinue?')) {
            return;
        }
    }
    
    // Combine all brain dumps
    const prompt = allTexts.join('\n\n');

    generateBtn.disabled = true;
    loadingSpinner.style.display = 'block';
    loadingSpinner.querySelector('p').textContent = 'Creating your task tree...';
    outputArea.style.display = 'none';

    try {
        const requestData = {
            prompt: prompt,
            context: addContextCheckbox.checked ? contextInput.value : null,
            existing_task_tree: currentTaskTree // Include existing task tree if loaded
        };

        const response = await fetch(`${API_BASE_URL}/api/create-task-tree`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        currentTaskTree = data.task_tree;
        currentStage = data.stage;
        
        displayTaskTree(data);
        
    } catch (error) {
        showError(`Failed to generate task tree: ${error.message}`);
    } finally {
        generateBtn.disabled = false;
        loadingSpinner.style.display = 'none';
    }
}

async function refineTaskTree(mode = 'all') {
    if (!currentTaskTree) return;

    // Prepare task tree based on mode
    let taskTreeToRefine = JSON.parse(JSON.stringify(currentTaskTree)); // Deep clone
    
    if (mode === 'selected') {
        // Only include tasks and subtasks marked for breakdown
        taskTreeToRefine.categories = taskTreeToRefine.categories.map(category => ({
            ...category,
            projects: category.projects.map(project => ({
                ...project,
                tasks: project.tasks.map(task => {
                    // Check if task itself needs breakdown
                    const taskNeedsBreakdown = task.needsBreakdown === true;
                    
                    // Check if any subtasks need breakdown
                    const selectedSubtasks = task.subtasks ? 
                        task.subtasks.filter(st => st.needsBreakdown === true) : [];
                    
                    // Include task if it or any of its subtasks need breakdown
                    if (taskNeedsBreakdown || selectedSubtasks.length > 0) {
                        return {
                            ...task,
                            // If the task itself doesn't need breakdown but subtasks do,
                            // only include the selected subtasks
                            subtasks: taskNeedsBreakdown ? task.subtasks : selectedSubtasks
                        };
                    }
                    return null;
                }).filter(task => task !== null)
            })).filter(project => project.tasks.length > 0)
        })).filter(category => category.projects.length > 0);
        
        if (taskTreeToRefine.categories.length === 0) {
            alert('No tasks or subtasks selected for breakdown!');
            return;
        }
    }

    loadingSpinner.style.display = 'block';
    loadingSpinner.querySelector('p').textContent = mode === 'selected' 
        ? 'Breaking down selected items...' 
        : 'Breaking down all tasks...';
    outputArea.style.display = 'none';

    try {
        const response = await fetch(`${API_BASE_URL}/api/refine-task-tree`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ task_tree: mode === 'selected' ? taskTreeToRefine : currentTaskTree })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        
        if (mode === 'selected') {
            // Merge refined tasks back into the original tree
            mergeRefinedTasks(currentTaskTree, data.task_tree);
            currentStage = 'refined';
            displayTaskTree({
                task_tree: currentTaskTree,
                formatted_tree: formatTaskTreeForDisplay(currentTaskTree),
                stage: 'refined'
            });
        } else {
            currentTaskTree = data.task_tree;
            currentStage = data.stage;
            displayTaskTree(data);
        }
        
    } catch (error) {
        showError(`Failed to refine task tree: ${error.message}`);
    } finally {
        loadingSpinner.style.display = 'none';
    }
}

function mergeRefinedTasks(originalTree, refinedTree) {
    // Merge refined tasks back into original tree
    refinedTree.categories.forEach(refinedCat => {
        const origCat = originalTree.categories.find(c => c.name === refinedCat.name);
        if (!origCat) return;
        
        refinedCat.projects.forEach(refinedProj => {
            const origProj = origCat.projects.find(p => p.name === refinedProj.name);
            if (!origProj) return;
            
            refinedProj.tasks.forEach(refinedTask => {
                const taskIndex = origProj.tasks.findIndex(t => t.name === refinedTask.name);
                if (taskIndex !== -1) {
                    // Replace the task with refined version
                    origProj.tasks[taskIndex] = refinedTask;
                    delete origProj.tasks[taskIndex].needsBreakdown;
                }
            });
        });
    });
}

function formatTaskTreeForDisplay(taskTree) {
    // Simple formatting function
    let output = '';
    taskTree.categories.forEach(cat => {
        output += `📁 ${cat.name}\n`;
        cat.projects.forEach(proj => {
            output += `  📋 ${proj.name}\n`;
            proj.tasks.forEach(task => {
                output += `    ✓ ${task.name}\n`;
                if (task.subtasks) {
                    task.subtasks.forEach(sub => {
                        output += `      • ${sub.name}\n`;
                    });
                }
            });
        });
    });
    return output;
}

async function oldRefineTaskTree() {
    if (!currentTaskTree) return;

    const refineBtn = document.getElementById('refineBtn');
    refineBtn.disabled = true;
    loadingSpinner.style.display = 'block';
    loadingSpinner.querySelector('p').textContent = 'Breaking down tasks further...';
    outputArea.style.display = 'none';

    try {
        const response = await fetch(`${API_BASE_URL}/api/refine-task-tree`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ task_tree: currentTaskTree })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        currentTaskTree = data.task_tree;
        currentStage = data.stage;
        
        displayTaskTree(data);
        
    } catch (error) {
        showError(`Failed to refine task tree: ${error.message}`);
    } finally {
        loadingSpinner.style.display = 'none';
    }
}

// Interactive Editor Functions
function renderInteractiveEditor(taskTree) {
    console.log('renderInteractiveEditor called with:', taskTree);
    const container = document.getElementById('interactiveEditor');
    if (!container) {
        console.error('Interactive editor container not found');
        return;
    }
    
    console.log('Container found:', container);
    container.innerHTML = '';
    
    console.log('Rendering task tree:', taskTree);
    console.log('Categories:', taskTree?.categories);
    
    if (!taskTree || !taskTree.categories || taskTree.categories.length === 0) {
        console.log('No categories, showing empty state');
        container.innerHTML = '<p style="color: #666;">No categories yet.</p>';
        const addCategoryBtn = createButton('+ Add Category', () => {
            if (!currentTaskTree.categories) currentTaskTree.categories = [];
            currentTaskTree.categories.push({
                name: 'New Category',
                projects: []
            });
            renderInteractiveEditor(currentTaskTree);
            syncJsonFromInteractive();
        }, 'add-btn');
        container.appendChild(addCategoryBtn);
        return;
    }
    
    console.log('Creating categoriesDiv with', taskTree.categories.length, 'categories');
    const categoriesDiv = document.createElement('div');
    categoriesDiv.className = 'task-tree-editor';
    
    try {
        taskTree.categories.forEach((category, catIndex) => {
            console.log('Rendering category', catIndex, ':', category);
            const categoryElement = renderCategory(category, catIndex);
            console.log('Category element created:', categoryElement);
            categoriesDiv.appendChild(categoryElement);
        });
    } catch (error) {
        console.error('Error rendering categories:', error);
        container.innerHTML = '<p style="color: red;">Error rendering categories: ' + error.message + '</p>';
        return;
    }
    
    const addCategoryBtn = createButton('+ Add Category', () => {
        if (!currentTaskTree.categories) currentTaskTree.categories = [];
        currentTaskTree.categories.push({
            name: 'New Category',
            projects: []
        });
        renderInteractiveEditor(currentTaskTree);
        syncJsonFromInteractive();
    }, 'add-btn');
    
    console.log('Appending categoriesDiv to container');
    container.appendChild(categoriesDiv);
    container.appendChild(addCategoryBtn);
    console.log('Rendering complete');
}

function renderCategory(category, catIndex) {
    const div = document.createElement('div');
    div.className = 'category-item';
    div.style.cssText = 'border: 2px solid var(--primary-color); border-radius: 8px; padding: 15px; margin-bottom: 15px; background: #f9faf9;';
    
    const header = document.createElement('div');
    header.style.cssText = 'display: flex; align-items: center; gap: 10px; margin-bottom: 10px;';
    
    const icon = document.createElement('span');
    icon.textContent = '📁';
    icon.style.fontSize = '1.2em';
    
    const input = createEditableInput(category.name, (value) => {
        currentTaskTree.categories[catIndex].name = value;
        syncJsonFromInteractive();
    }, 'font-weight: bold; font-size: 1.1em;');
    
    const removeBtn = createButton('✕', () => {
        if (confirm(`Remove category "${category.name}"?`)) {
            currentTaskTree.categories.splice(catIndex, 1);
            renderInteractiveEditor(currentTaskTree);
            syncJsonFromInteractive();
        }
    }, 'remove-btn');
    
    header.appendChild(icon);
    header.appendChild(input);
    header.appendChild(removeBtn);
    div.appendChild(header);
    
    const projectsDiv = document.createElement('div');
    projectsDiv.style.marginLeft = '25px';
    
    if (category.projects && category.projects.length > 0) {
        category.projects.forEach((project, projIndex) => {
            projectsDiv.appendChild(renderProject(project, catIndex, projIndex));
        });
    }
    
    const addProjectBtn = createButton('+ Add Project', () => {
        if (!currentTaskTree.categories[catIndex].projects) {
            currentTaskTree.categories[catIndex].projects = [];
        }
        currentTaskTree.categories[catIndex].projects.push({
            name: 'New Project',
            tasks: []
        });
        renderInteractiveEditor(currentTaskTree);
        syncJsonFromInteractive();
    }, 'add-btn-small');
    
    projectsDiv.appendChild(addProjectBtn);
    div.appendChild(projectsDiv);
    
    return div;
}

function renderProject(project, catIndex, projIndex) {
    const div = document.createElement('div');
    div.className = 'project-item';
    div.style.cssText = 'border: 1px solid #ccc; border-radius: 6px; padding: 12px; margin-bottom: 10px; background: white;';
    
    const header = document.createElement('div');
    header.style.cssText = 'display: flex; align-items: center; gap: 10px; margin-bottom: 8px;';
    
    const icon = document.createElement('span');
    icon.textContent = '📋';
    
    const input = createEditableInput(project.name, (value) => {
        currentTaskTree.categories[catIndex].projects[projIndex].name = value;
        syncJsonFromInteractive();
    }, 'font-weight: 600;');
    
    const removeBtn = createButton('✕', () => {
        if (confirm(`Remove project "${project.name}"?`)) {
            currentTaskTree.categories[catIndex].projects.splice(projIndex, 1);
            renderInteractiveEditor(currentTaskTree);
            syncJsonFromInteractive();
        }
    }, 'remove-btn');
    
    header.appendChild(icon);
    header.appendChild(input);
    header.appendChild(removeBtn);
    div.appendChild(header);
    
    const tasksDiv = document.createElement('div');
    tasksDiv.style.marginLeft = '20px';
    
    if (project.tasks && project.tasks.length > 0) {
        project.tasks.forEach((task, taskIndex) => {
            tasksDiv.appendChild(renderTask(task, catIndex, projIndex, taskIndex));
        });
    }
    
    const addTaskBtn = createButton('+ Add Task', () => {
        if (!currentTaskTree.categories[catIndex].projects[projIndex].tasks) {
            currentTaskTree.categories[catIndex].projects[projIndex].tasks = [];
        }
        currentTaskTree.categories[catIndex].projects[projIndex].tasks.push({
            name: 'New Task',
            subtasks: []
        });
        renderInteractiveEditor(currentTaskTree);
        syncJsonFromInteractive();
    }, 'add-btn-small');
    
    tasksDiv.appendChild(addTaskBtn);
    div.appendChild(tasksDiv);
    
    return div;
}

function renderTask(task, catIndex, projIndex, taskIndex) {
    const div = document.createElement('div');
    div.className = 'task-item';
    div.style.cssText = 'border-left: 2px solid var(--primary-color); padding-left: 10px; margin-bottom: 8px;';
    
    const header = document.createElement('div');
    header.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-bottom: 5px;';
    
    // Checkbox for tasks with no subtasks (always show to allow iterative refinement)
    const hasNoSubtasks = !task.subtasks || task.subtasks.length === 0;
    if (hasNoSubtasks) {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'breakdown-checkbox';
        checkbox.checked = task.needsBreakdown || false;
        checkbox.title = 'Needs to be broken down';
        checkbox.style.cssText = 'width: 18px; height: 18px; cursor: pointer;';
        checkbox.dataset.catIndex = catIndex;
        checkbox.dataset.projIndex = projIndex;
        checkbox.dataset.taskIndex = taskIndex;
        checkbox.addEventListener('change', (e) => {
            currentTaskTree.categories[catIndex].projects[projIndex].tasks[taskIndex].needsBreakdown = e.target.checked;
            syncJsonFromInteractive();
        });
        header.appendChild(checkbox);
    }
    
    const icon = document.createElement('span');
    icon.textContent = '✓';
    icon.style.color = 'var(--primary-color)';
    
    const input = createEditableInput(task.name, (value) => {
        currentTaskTree.categories[catIndex].projects[projIndex].tasks[taskIndex].name = value;
        syncJsonFromInteractive();
    });
    
    const removeBtn = createButton('✕', () => {
        if (confirm(`Remove task "${task.name}"?`)) {
            currentTaskTree.categories[catIndex].projects[projIndex].tasks.splice(taskIndex, 1);
            renderInteractiveEditor(currentTaskTree);
            syncJsonFromInteractive();
        }
    }, 'remove-btn');
    
    header.appendChild(icon);
    header.appendChild(input);
    header.appendChild(removeBtn);
    div.appendChild(header);
    
    // Dependencies
    if (task.dependencies && task.dependencies.length > 0) {
        const depsDiv = document.createElement('div');
        depsDiv.style.cssText = 'margin-left: 20px; font-size: 0.9em; color: #666;';
        task.dependencies.forEach((dep, depIndex) => {
            const depItem = document.createElement('div');
            depItem.style.cssText = 'display: flex; align-items: center; gap: 5px; margin-bottom: 3px;';
            
            const depIcon = document.createElement('span');
            depIcon.textContent = '↳';
            
            const depInput = createEditableInput(dep, (value) => {
                currentTaskTree.categories[catIndex].projects[projIndex].tasks[taskIndex].dependencies[depIndex] = value;
                syncJsonFromInteractive();
            }, 'font-size: 0.9em;');
            
            const depRemoveBtn = createButton('✕', () => {
                currentTaskTree.categories[catIndex].projects[projIndex].tasks[taskIndex].dependencies.splice(depIndex, 1);
                renderInteractiveEditor(currentTaskTree);
                syncJsonFromInteractive();
            }, 'remove-btn-tiny');
            
            depItem.appendChild(depIcon);
            depItem.appendChild(depInput);
            depItem.appendChild(depRemoveBtn);
            depsDiv.appendChild(depItem);
        });
        div.appendChild(depsDiv);
    }
    
    // Subtasks
    const subtasksDiv = document.createElement('div');
    subtasksDiv.style.marginLeft = '20px';
    
    if (task.subtasks && task.subtasks.length > 0) {
        task.subtasks.forEach((subtask, subIndex) => {
            subtasksDiv.appendChild(renderSubtask(subtask, catIndex, projIndex, taskIndex, subIndex));
        });
    }
    
    const buttonsDiv = document.createElement('div');
    buttonsDiv.style.cssText = 'display: flex; gap: 8px; margin-top: 5px; margin-left: 20px;';
    
    const addSubtaskBtn = createButton('+ Subtask', () => {
        if (!currentTaskTree.categories[catIndex].projects[projIndex].tasks[taskIndex].subtasks) {
            currentTaskTree.categories[catIndex].projects[projIndex].tasks[taskIndex].subtasks = [];
        }
        currentTaskTree.categories[catIndex].projects[projIndex].tasks[taskIndex].subtasks.push({
            name: 'New Subtask'
        });
        renderInteractiveEditor(currentTaskTree);
        syncJsonFromInteractive();
    }, 'add-btn-tiny');
    
    const addDepBtn = createButton('+ Dependency', () => {
        if (!currentTaskTree.categories[catIndex].projects[projIndex].tasks[taskIndex].dependencies) {
            currentTaskTree.categories[catIndex].projects[projIndex].tasks[taskIndex].dependencies = [];
        }
        currentTaskTree.categories[catIndex].projects[projIndex].tasks[taskIndex].dependencies.push('New dependency');
        renderInteractiveEditor(currentTaskTree);
        syncJsonFromInteractive();
    }, 'add-btn-tiny');
    
    buttonsDiv.appendChild(addSubtaskBtn);
    buttonsDiv.appendChild(addDepBtn);
    
    div.appendChild(subtasksDiv);
    div.appendChild(buttonsDiv);
    
    return div;
}

function renderSubtask(subtask, catIndex, projIndex, taskIndex, subIndex) {
    const container = document.createElement('div');
    container.style.cssText = 'margin-bottom: 8px;';
    
    const div = document.createElement('div');
    div.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-bottom: 5px;';
    
    // Add checkbox for subtask breakdown
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'breakdown-checkbox';
    checkbox.checked = subtask.needsBreakdown || false;
    checkbox.title = 'Needs to be broken down';
    checkbox.style.cssText = 'width: 16px; height: 16px; cursor: pointer;';
    checkbox.dataset.catIndex = catIndex;
    checkbox.dataset.projIndex = projIndex;
    checkbox.dataset.taskIndex = taskIndex;
    checkbox.dataset.subIndex = subIndex;
    checkbox.dataset.isSubtask = 'true';
    checkbox.addEventListener('change', (e) => {
        currentTaskTree.categories[catIndex].projects[projIndex].tasks[taskIndex].subtasks[subIndex].needsBreakdown = e.target.checked;
        syncJsonFromInteractive();
    });
    
    const icon = document.createElement('span');
    icon.textContent = '•';
    icon.style.color = '#999';
    
    const input = createEditableInput(subtask.name, (value) => {
        currentTaskTree.categories[catIndex].projects[projIndex].tasks[taskIndex].subtasks[subIndex].name = value;
        syncJsonFromInteractive();
    }, 'font-size: 0.95em;');
    
    const removeBtn = createButton('✕', () => {
        currentTaskTree.categories[catIndex].projects[projIndex].tasks[taskIndex].subtasks.splice(subIndex, 1);
        renderInteractiveEditor(currentTaskTree);
        syncJsonFromInteractive();
    }, 'remove-btn-tiny');
    
    div.appendChild(checkbox);
    div.appendChild(icon);
    div.appendChild(input);
    div.appendChild(removeBtn);
    
    container.appendChild(div);
    
    // Dependencies for subtask
    if (subtask.dependencies && subtask.dependencies.length > 0) {
        const depsDiv = document.createElement('div');
        depsDiv.style.cssText = 'margin-left: 40px; margin-bottom: 5px;';
        
        subtask.dependencies.forEach((dep, depIndex) => {
            const depItem = document.createElement('div');
            depItem.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-bottom: 3px;';
            
            const depLabel = document.createElement('span');
            depLabel.textContent = '↳';
            depLabel.style.color = '#999';
            
            const depInput = createEditableInput(dep, (value) => {
                currentTaskTree.categories[catIndex].projects[projIndex].tasks[taskIndex].subtasks[subIndex].dependencies[depIndex] = value;
                syncJsonFromInteractive();
            }, 'font-size: 0.9em; font-style: italic;');
            
            const depRemoveBtn = createButton('✕', () => {
                currentTaskTree.categories[catIndex].projects[projIndex].tasks[taskIndex].subtasks[subIndex].dependencies.splice(depIndex, 1);
                renderInteractiveEditor(currentTaskTree);
                syncJsonFromInteractive();
            }, 'remove-btn-tiny');
            
            depItem.appendChild(depLabel);
            depItem.appendChild(depInput);
            depItem.appendChild(depRemoveBtn);
            depsDiv.appendChild(depItem);
        });
        
        container.appendChild(depsDiv);
    }
    
    // Add dependency button
    const addDepBtn = createButton('+ Dependency', () => {
        if (!currentTaskTree.categories[catIndex].projects[projIndex].tasks[taskIndex].subtasks[subIndex].dependencies) {
            currentTaskTree.categories[catIndex].projects[projIndex].tasks[taskIndex].subtasks[subIndex].dependencies = [];
        }
        currentTaskTree.categories[catIndex].projects[projIndex].tasks[taskIndex].subtasks[subIndex].dependencies.push('New dependency');
        renderInteractiveEditor(currentTaskTree);
        syncJsonFromInteractive();
    }, 'add-btn-tiny');
    
    addDepBtn.style.marginLeft = '40px';
    addDepBtn.style.marginBottom = '5px';
    container.appendChild(addDepBtn);
    
    return container;
}

function createEditableInput(value, onSave, extraStyle = '') {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = value;
    input.style.cssText = `flex: 1; border: 1px solid #ddd; border-radius: 4px; padding: 5px 8px; ${extraStyle}`;
    
    input.addEventListener('blur', () => {
        if (input.value.trim() !== value) {
            onSave(input.value.trim());
        }
    });
    
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            input.blur();
        }
    });
    
    return input;
}

function createButton(text, onClick, className = '') {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.className = className;
    btn.addEventListener('click', onClick);
    
    // Base styles
    let baseStyle = 'border: none; border-radius: 4px; cursor: pointer; transition: all 0.2s;';
    
    // Class-specific styles
    if (className === 'remove-btn') {
        btn.style.cssText = baseStyle + 'background: #ff4444; color: white; padding: 4px 10px; font-weight: bold;';
        btn.onmouseover = () => btn.style.background = '#cc0000';
        btn.onmouseout = () => btn.style.background = '#ff4444';
    } else if (className === 'remove-btn-tiny') {
        btn.style.cssText = baseStyle + 'background: #ff6666; color: white; padding: 2px 6px; font-size: 0.8em;';
        btn.onmouseover = () => btn.style.background = '#ff4444';
        btn.onmouseout = () => btn.style.background = '#ff6666';
    } else if (className === 'add-btn') {
        btn.style.cssText = baseStyle + 'background: var(--primary-color); color: white; padding: 8px 16px; margin-top: 10px;';
        btn.onmouseover = () => btn.style.background = '#6a9581';
        btn.onmouseout = () => btn.style.background = 'var(--primary-color)';
    } else if (className === 'add-btn-small') {
        btn.style.cssText = baseStyle + 'background: #a8c5b8; color: white; padding: 6px 12px; font-size: 0.9em; margin-top: 8px;';
        btn.onmouseover = () => btn.style.background = 'var(--primary-color)';
        btn.onmouseout = () => btn.style.background = '#a8c5b8';
    } else if (className === 'add-btn-tiny') {
        btn.style.cssText = baseStyle + 'background: #c5d9ce; color: #333; padding: 4px 8px; font-size: 0.85em;';
        btn.onmouseover = () => btn.style.background = '#a8c5b8';
        btn.onmouseout = () => btn.style.background = '#c5d9ce';
    }
    
    return btn;
}

function syncJsonFromInteractive() {
    const jsonEditor = document.getElementById('taskTreeEditor');
    if (jsonEditor) {
        jsonEditor.value = JSON.stringify(currentTaskTree, null, 2);
    }
}

function displayTaskTree(data) {
    // Update the output area title
    const outputTitle = document.querySelector('.output-area h2');
    outputTitle.textContent = 'Review and/or update your AI-Generated task tree. If any tasks need to be broken down, check their boxes and send them back to be broken into smaller pieces!';
    
    planOutput.innerHTML = '';
    
    // Interactive Editor Section
    const interactiveSection = document.createElement('div');
    interactiveSection.style.marginBottom = '30px';
    interactiveSection.innerHTML = `
        <h3>Interactive Editor</h3>
        <div id="interactiveEditor"></div>
    `;
    planOutput.appendChild(interactiveSection);
    
    renderInteractiveEditor(data.task_tree);
    
    // JSON Editor Section (collapsible)
    const jsonSection = document.createElement('div');
    jsonSection.style.marginTop = '20px';
    jsonSection.innerHTML = `
        <details>
            <summary style="cursor: pointer; font-weight: bold; margin-bottom: 10px;">Advanced: Edit JSON Directly</summary>
            <textarea id="taskTreeEditor" rows="15" style="width: 100%; font-family: monospace; font-size: 0.9em; margin-top: 10px;">
${JSON.stringify(data.task_tree, null, 2)}
            </textarea>
            <button id="applyJsonBtn" class="secondary-btn" style="margin-top: 10px;">Apply JSON Changes</button>
        </details>
    `;
    planOutput.appendChild(jsonSection);
    
    // Add event listener for JSON apply button
    setTimeout(() => {
        const applyJsonBtn = document.getElementById('applyJsonBtn');
        if (applyJsonBtn) {
            applyJsonBtn.addEventListener('click', () => {
                try {
                    const editedTree = JSON.parse(document.getElementById('taskTreeEditor').value);
                    currentTaskTree = editedTree;
                    renderInteractiveEditor(currentTaskTree);
                    showSuccess('JSON changes applied!');
                } catch (e) {
                    alert('Invalid JSON. Please check your edits.');
                }
            });
        }
    }, 0);
    
    tasksList.innerHTML = '';
    const actionsDiv = document.querySelector('.actions');
    
    // Check if there's a saved task tree
    const hasSavedTree = localStorage.getItem('savedTaskTree') !== null;
    
    // Always show the breakdown options (both initial and refined stages)
    // This allows iterative refinement
    actionsDiv.innerHTML = `
        <div style="margin-bottom: 15px;">
            <label style="font-weight: bold; color: var(--primary-color); display: flex; align-items: center; gap: 8px;">
                <input type="checkbox" id="needsBreakdownLabel" style="width: 18px; height: 18px;">
                Check all of the boxes for tasks that need to be broken down
            </label>
            <small style="color: #666; margin-left: 26px;">Check tasks that need more detail</small>
        </div>
        <div style="display: flex; flex-direction: column; gap: 10px;">
            <button id="saveTasksBtn" class="primary-btn" style="width: 100%;">
                ${currentStage === 'refined' ? '✓ Save My Task Tree' : 'Tasks are broken down enough, save my Task Tree!'}
            </button>
            <button id="breakdownAllBtn" class="secondary-btn" style="width: 100%;">
                Break down all of the tasks
            </button>
            <button id="breakdownSelectedBtn" class="secondary-btn" style="width: 100%;">
                Break down the selected tasks
            </button>
            ${!hasSavedTree ? `<button id="newPlanBtn" class="secondary-btn" style="width: 100%;">
                Start Over
            </button>` : ''}
        </div>
    `;
    
    // Select/Deselect all checkbox
    document.getElementById('needsBreakdownLabel').addEventListener('change', (e) => {
        const checkboxes = document.querySelectorAll('.breakdown-checkbox');
        checkboxes.forEach(cb => {
            cb.checked = e.target.checked;
            const catIndex = cb.dataset.catIndex;
            const projIndex = cb.dataset.projIndex;
            const taskIndex = cb.dataset.taskIndex;
            currentTaskTree.categories[catIndex].projects[projIndex].tasks[taskIndex].needsBreakdown = e.target.checked;
        });
        syncJsonFromInteractive();
    });
    
    document.getElementById('saveTasksBtn').addEventListener('click', async () => {
        syncJsonFromInteractive();
        await saveTaskTree();
    });
    
    document.getElementById('breakdownAllBtn').addEventListener('click', () => {
        if (!confirm('⚠️ Breaking down tasks will modify your task tree structure.\n\nIMPORTANT: This may affect to-do list associations and completion progress.\n\nContinue?')) {
            return;
        }
        syncJsonFromInteractive();
        refineTaskTree('all');
    });
    
    document.getElementById('breakdownSelectedBtn').addEventListener('click', () => {
        syncJsonFromInteractive();
        const selectedCount = document.querySelectorAll('.breakdown-checkbox:checked').length;
        if (selectedCount === 0) {
            alert('Please select at least one task to break down by checking the boxes.');
            return;
        }
        if (!confirm('⚠️ Breaking down tasks will modify your task tree structure.\n\nIMPORTANT: This may affect to-do list associations and completion progress.\n\nContinue?')) {
            return;
        }
        refineTaskTree('selected');
    });
    
    const newPlanBtn = document.getElementById('newPlanBtn');
    if (newPlanBtn) {
        newPlanBtn.addEventListener('click', resetForm);
    }

    outputArea.style.display = 'block';
}

async function saveTask(task) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ task: task })
        });

        if (!response.ok) {
            throw new Error('Failed to save task');
        }

        allTasks.push(task);
        updateSavedTasksDisplay();
        showSuccess('Task saved!');
        
    } catch (error) {
        showError(`Failed to save task: ${error.message}`);
    }
}

async function loadSavedTasks() {
    try {
        // Load single saved tree from localStorage
        const savedTreeJson = localStorage.getItem('savedTaskTree');
        if (savedTreeJson) {
            const savedTree = JSON.parse(savedTreeJson);
            allTasks = [savedTree];
            
            // Set currentTaskTree so new brain dumps will be merged with it
            currentTaskTree = savedTree.task_tree;
            
            // Update button text to indicate re-generation
            generateBtn.textContent = 'Re-Generate My Task Tree with new Brain Dumps';
        } else {
            allTasks = [];
            currentTaskTree = null;
            generateBtn.textContent = 'Generate Task Tree';
        }
        updateSavedTasksDisplay();
    } catch (error) {
        console.error('Failed to load tasks:', error);
        allTasks = [];
        currentTaskTree = null;
        generateBtn.textContent = 'Generate Task Tree';
        updateSavedTasksDisplay();
    }
}

async function saveTaskTree() {
    if (!currentTaskTree) {
        alert('No task tree to save!');
        return;
    }

    try {
        loadingSpinner.style.display = 'block';
        
        // Create task tree entry (only one saved at a time)
        const taskTreeEntry = {
            id: 1,
            task_tree: currentTaskTree,
            timestamp: new Date().toISOString(),
            created_at: new Date().toLocaleString()
        };
        
        // Save to localStorage (replaces any existing saved tree)
        localStorage.setItem('savedTaskTree', JSON.stringify(taskTreeEntry));
        
        alert('Task tree saved successfully!');
        await loadSavedTasks();
        
        // Update the UI to reflect the saved state (hide "Start Over" button)
        const actionsDiv = document.querySelector('.actions');
        const newPlanBtn = document.getElementById('newPlanBtn');
        if (newPlanBtn) {
            newPlanBtn.remove();
        }
    } catch (error) {
        console.error('Error saving task tree:', error);
        alert('Failed to save task tree. Please try again.');
    } finally {
        loadingSpinner.style.display = 'none';
    }
}

function updateSavedTasksDisplay() {
    if (allTasks.length === 0) {
        savedTasks.innerHTML = '<p class="empty-state">No saved task trees yet. Generate and save a plan to get started!</p>';
        return;
    }

    const container = document.createElement('div');
    container.className = 'saved-tasks-list';
    
    allTasks.forEach((savedTree) => {
        const card = document.createElement('div');
        card.className = 'saved-task-card';
        
        const header = document.createElement('div');
        header.className = 'saved-task-header';
        
        const title = document.createElement('h4');
        const categoryCount = savedTree.task_tree?.categories?.length || 0;
        title.textContent = `Task Tree (${categoryCount} ${categoryCount === 1 ? 'category' : 'categories'})`;
        
        const timestamp = document.createElement('span');
        timestamp.className = 'saved-task-timestamp';
        timestamp.textContent = savedTree.created_at || new Date(savedTree.timestamp).toLocaleString();
        
        header.appendChild(title);
        header.appendChild(timestamp);
        
        const actions = document.createElement('div');
        actions.className = 'saved-task-actions';
        
        const viewBtn = document.createElement('button');
        viewBtn.className = 'secondary-btn';
        viewBtn.textContent = '👁️ View';
        viewBtn.onclick = () => viewTaskTreeModal(savedTree);
        
        const todoBtn = document.createElement('button');
        todoBtn.className = 'secondary-btn';
        todoBtn.textContent = '📝 Generate To-Do List';
        todoBtn.onclick = () => openToDoModalFromSaved(savedTree);
        
        const exportBtn = document.createElement('button');
        exportBtn.className = 'secondary-btn';
        exportBtn.textContent = 'Export';
        exportBtn.onclick = () => exportSavedTaskTree(savedTree);
        
        const loadBtn = document.createElement('button');
        loadBtn.className = 'secondary-btn';
        loadBtn.textContent = 'Load to Editor';
        loadBtn.onclick = () => loadTaskTree(savedTree);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'Delete';
        deleteBtn.onclick = () => deleteTaskTree(savedTree.id);
        
        actions.appendChild(viewBtn);
        actions.appendChild(todoBtn);
        actions.appendChild(exportBtn);
        actions.appendChild(loadBtn);
        actions.appendChild(deleteBtn);
        
        card.appendChild(header);
        card.appendChild(actions);
        container.appendChild(card);
    });
    
    savedTasks.innerHTML = '';
    savedTasks.appendChild(container);
}

function loadTaskTree(savedTree) {
    console.log('Loading task tree:', savedTree);
    console.log('Task tree data:', savedTree.task_tree);
    
    // Handle both direct task tree and wrapped structure
    let taskTree = savedTree.task_tree;
    
    // If task_tree has a task_tree property, unwrap it
    if (taskTree && taskTree.task_tree) {
        taskTree = taskTree.task_tree;
    }
    
    console.log('Final task tree:', taskTree);
    console.log('Categories:', taskTree?.categories);
    
    if (!taskTree || !taskTree.categories) {
        alert('Error: Invalid task tree structure');
        console.error('Invalid task tree structure:', taskTree);
        return;
    }
    
    currentTaskTree = taskTree;
    currentStage = 'loaded';
    
    // Update generate button text
    generateBtn.textContent = 'Re-Generate My Task Tree with new Brain Dumps';
    
    // Use displayTaskTree to properly set up the UI
    displayTaskTree({ task_tree: taskTree });
    
    // Scroll to output
    outputArea.scrollIntoView({ behavior: 'smooth' });
}

async function deleteTaskTree(treeId) {
    if (!confirm('⚠️ WARNING: This action is not reversible!\n\nAre you sure you want to delete your saved task tree?\n\nThis will also delete ALL associated to-do lists.\n\nPlease consider exporting your task tree for safe keeping before deleting it.')) {
        return;
    }

    try {
        loadingSpinner.style.display = 'block';
        
        // Remove saved tree from localStorage
        localStorage.removeItem('savedTaskTree');
        
        await loadSavedTasks();
        
        // Refresh the page to clear all state
        window.location.reload();
    } catch (error) {
        console.error('Error deleting task tree:', error);
        alert('Failed to delete task tree. Please try again.');
    } finally {
        loadingSpinner.style.display = 'none';
    }
}

function resetForm() {
    contextInput.value = '';
    addContextCheckbox.checked = false;
    contextInput.style.display = 'none';
    outputArea.style.display = 'none';
    currentPlan = null;
    currentTaskTree = null;
    generateBtn.textContent = 'Generate Task Tree';
    currentStage = null;
    
    // Clear all brain dumps
    brainDumps.forEach(bd => {
        if (bd.isRecording) {
            stopRecordingForBrainDump(bd);
        }
    });
    
    const container = document.getElementById('brainDumpsContainer');
    if (container) {
        container.innerHTML = '<button id=\"addBrainDumpBtn\" class=\"secondary-btn\" style=\"margin-top: 10px;\">+ Add Another Brain Dump</button>';
        
        const addBtn = document.getElementById('addBrainDumpBtn');
        addBtn.addEventListener('click', addBrainDump);
    }
    
    brainDumps = [];
    brainDumpCounter = 0;
    
    // Clear uploaded files
    uploadedFiles = [];
    const uploadedFilesContainer = document.getElementById('uploadedFilesContainer');
    if (uploadedFilesContainer) {
        uploadedFilesContainer.innerHTML = '';
    }
    
    // Re-add first brain dump
    addBrainDump();
}

function exportTaskTree() {
    if (!currentTaskTree) return;

    const exportText = `AI Planning Assistant - Task Tree
${'='.repeat(50)}

${document.querySelector('#planOutput pre').textContent}

JSON Format:
${JSON.stringify(currentTaskTree, null, 2)}

Generated: ${new Date().toLocaleString()}
`;

    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `task-tree-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showSuccess('Task tree exported successfully!');
}

function exportSavedTaskTree(savedTree) {
    const taskTree = savedTree.task_tree;
    
    // Format task tree as readable text
    let formattedText = '';
    taskTree.categories?.forEach((category, catIndex) => {
        formattedText += `📁 ${category.name}\n`;
        category.projects?.forEach((project, projIndex) => {
            formattedText += `  📋 ${project.name}\n`;
            if (project.dependencies && project.dependencies.length > 0) {
                formattedText += `     Dependencies: ${project.dependencies.join(', ')}\n`;
            }
            project.tasks?.forEach((task, taskIndex) => {
                formattedText += `    ✓ ${task.name}\n`;
                if (task.dependencies && task.dependencies.length > 0) {
                    formattedText += `       Dependencies: ${task.dependencies.join(', ')}\n`;
                }
                task.subtasks?.forEach((subtask) => {
                    formattedText += `      • ${subtask.name}\n`;
                    if (subtask.dependencies && subtask.dependencies.length > 0) {
                        formattedText += `         Dependencies: ${subtask.dependencies.join(', ')}\n`;
                    }
                });
            });
        });
        formattedText += '\n';
    });

    const exportText = `AI Planning Assistant - Task Tree
${'='.repeat(50)}

${formattedText}

JSON Format:
${JSON.stringify(taskTree, null, 2)}

Saved: ${savedTree.created_at || new Date(savedTree.timestamp).toLocaleString()}
Exported: ${new Date().toLocaleString()}
`;

    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `task-tree-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showSuccess('Task tree exported successfully!');
}

function viewTaskTreeModal(savedTree) {
    const modal = document.getElementById('viewTaskTreeModal');
    const content = document.getElementById('viewTaskTreeContent');
    
    // Extract task tree
    let taskTree = savedTree.task_tree;
    if (taskTree && taskTree.task_tree) {
        taskTree = taskTree.task_tree;
    }
    
    if (!taskTree || !taskTree.categories) {
        alert('Invalid task tree structure');
        return;
    }
    
    // Load completion state
    const completionKey = `taskTreeCompletion_${savedTree.id}`;
    const completionJson = localStorage.getItem(completionKey);
    const completionState = completionJson ? JSON.parse(completionJson) : {};
    
    // Build HTML for task tree
    let html = '';
    
    taskTree.categories.forEach((category, catIndex) => {
        const catId = category.id || `${catIndex}`;
        const catChecked = completionState[catId] ? 'checked' : '';
        
        html += `<div style="margin-bottom: 20px;">`;
        html += `<h3 style="color: var(--primary-color); margin-bottom: 10px;">`;
        html += `<input type="checkbox" ${catChecked} onchange="saveTaskCompletion('${completionKey}', '${catId}', this.checked)" style="margin-right: 8px; cursor: pointer;">`;
        html += `${category.emoji || ''} ${category.name}</h3>`;
        
        if (category.projects && category.projects.length > 0) {
            category.projects.forEach((project, projIndex) => {
                const projId = project.id || `${catIndex}.${projIndex}`;
                const projChecked = completionState[projId] ? 'checked' : '';
                
                html += `<div style="margin-left: 20px; margin-bottom: 15px;">`;
                html += `<h4 style="color: var(--secondary-color); margin-bottom: 8px;">`;
                html += `<input type="checkbox" ${projChecked} onchange="saveTaskCompletion('${completionKey}', '${projId}', this.checked)" style="margin-right: 8px; cursor: pointer;">`;
                html += `${project.emoji || ''} ${project.name}</h4>`;
                
                // Project dependencies
                if (project.dependencies && project.dependencies.length > 0) {
                    html += `<div style="margin-left: 20px; font-size: 0.9em; color: #888; font-style: italic; margin-bottom: 5px;">`;
                    html += `Dependencies: ${project.dependencies.join(', ')}`;
                    html += `</div>`;
                }
                
                if (project.tasks && project.tasks.length > 0) {
                    html += `<ul style="margin-left: 20px; list-style: none; padding-left: 0;">`;
                    project.tasks.forEach((task, taskIndex) => {
                        const taskId = task.id || `${catIndex}.${projIndex}.${taskIndex}`;
                        const taskChecked = completionState[taskId] ? 'checked' : '';
                        
                        html += `<li style="margin-bottom: 10px;">`;
                        html += `<div><strong>`;
                        html += `<input type="checkbox" ${taskChecked} onchange="saveTaskCompletion('${completionKey}', '${taskId}', this.checked)" style="margin-right: 8px; cursor: pointer;">`;
                        html += `${task.emoji || ''} ${task.name}</strong></div>`;
                        
                        // Task dependencies
                        if (task.dependencies && task.dependencies.length > 0) {
                            html += `<div style="margin-left: 20px; font-size: 0.85em; color: #888; font-style: italic; margin-top: 3px;">`;
                            html += `Dependencies: ${task.dependencies.join(', ')}`;
                            html += `</div>`;
                        }
                        
                        if (task.subtasks && task.subtasks.length > 0) {
                            html += `<ul style="margin-left: 20px; margin-top: 5px; list-style: none; padding-left: 0;">`;
                            task.subtasks.forEach((subtask, subIndex) => {
                                const subId = subtask.id || `${catIndex}.${projIndex}.${taskIndex}.${subIndex}`;
                                const subChecked = completionState[subId] ? 'checked' : '';
                                
                                html += `<li style="margin-bottom: 5px; color: #666;">`;
                                html += `<input type="checkbox" ${subChecked} onchange="saveTaskCompletion('${completionKey}', '${subId}', this.checked)" style="margin-right: 8px; cursor: pointer;">`;
                                html += `${subtask.emoji || ''} ${subtask.name}`;
                                
                                // Subtask dependencies
                                if (subtask.dependencies && subtask.dependencies.length > 0) {
                                    html += `<div style="margin-left: 15px; font-size: 0.85em; color: #888; font-style: italic; margin-top: 2px;">`;
                                    html += `Dependencies: ${subtask.dependencies.join(', ')}`;
                                    html += `</div>`;
                                }
                                
                                html += `</li>`;
                            });
                            html += `</ul>`;
                        }
                        html += `</li>`;
                    });
                    html += `</ul>`;
                }
                html += `</div>`;
            });
        }
        html += `</div>`;
    });
    
    content.innerHTML = html;
    modal.style.display = 'block';
}

function saveTaskCompletion(completionKey, itemId, isChecked) {
    const completionJson = localStorage.getItem(completionKey);
    const completionState = completionJson ? JSON.parse(completionJson) : {};
    
    // Update this item
    if (isChecked) {
        completionState[itemId] = true;
    } else {
        delete completionState[itemId];
    }
    
    // Find and update all children by building ID hierarchy from the task tree
    const savedTreeJson = localStorage.getItem('savedTaskTree');
    if (savedTreeJson) {
        const savedTree = JSON.parse(savedTreeJson);
        let taskTree = savedTree.task_tree;
        if (taskTree && taskTree.task_tree) {
            taskTree = taskTree.task_tree;
        }
        
        // Get all descendant IDs
        const descendants = getDescendantIds(taskTree, itemId);
        
        // Update checkboxes visually and in state
        const content = document.getElementById('viewTaskTreeContent');
        if (content) {
            const allCheckboxes = content.querySelectorAll('input[type="checkbox"]');
            allCheckboxes.forEach(checkbox => {
                const onchangeAttr = checkbox.getAttribute('onchange');
                if (!onchangeAttr) return;
                
                const match = onchangeAttr.match(/'([^']+)',\s*this\.checked/);
                if (!match) return;
                
                const checkboxId = match[1];
                
                if (descendants.includes(checkboxId)) {
                    checkbox.checked = isChecked;
                    if (isChecked) {
                        completionState[checkboxId] = true;
                    } else {
                        delete completionState[checkboxId];
                    }
                }
            });
        }
    }
    
    localStorage.setItem(completionKey, JSON.stringify(completionState));
}

function getDescendantIds(taskTree, parentId) {
    const descendants = [];
    
    if (!taskTree || !taskTree.categories) return descendants;
    
    taskTree.categories.forEach(category => {
        if (category.id === parentId) {
            // Collect all IDs under this category
            category.projects?.forEach(project => {
                descendants.push(project.id);
                project.tasks?.forEach(task => {
                    descendants.push(task.id);
                    task.subtasks?.forEach(subtask => {
                        descendants.push(subtask.id);
                    });
                });
            });
        } else {
            category.projects?.forEach(project => {
                if (project.id === parentId) {
                    // Collect all IDs under this project
                    project.tasks?.forEach(task => {
                        descendants.push(task.id);
                        task.subtasks?.forEach(subtask => {
                            descendants.push(subtask.id);
                        });
                    });
                } else {
                    project.tasks?.forEach(task => {
                        if (task.id === parentId) {
                            // Collect all IDs under this task
                            task.subtasks?.forEach(subtask => {
                                descendants.push(subtask.id);
                            });
                        }
                    });
                }
            });
        }
    });
    
    return descendants;
}

function closeViewTaskTreeModal() {
    const modal = document.getElementById('viewTaskTreeModal');
    modal.style.display = 'none';
}

function showError(message) {
    alert(`Error: ${message}`);
    console.error(message);
}

function showSuccess(message) {
    const originalText = generateBtn.textContent;
    generateBtn.textContent = message;
    generateBtn.style.backgroundColor = 'var(--success-color)';
    
    setTimeout(() => {
        generateBtn.textContent = originalText;
        generateBtn.style.backgroundColor = '';
    }, 2000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
// To-Do List Modal Functions
function openToDoModal() {
    const modal = document.getElementById('todoModal');
    modal.style.display = 'block';
    
    // Reset modal to initial state
    document.getElementById('manualSelectionContainer').style.display = 'none';
    document.getElementById('aiGenerationContainer').style.display = 'none';
}

function openToDoModalFromSaved(savedTree) {
    // Set the current task tree if not already set
    if (!currentTaskTree) {
        let taskTree = savedTree.task_tree;
        if (taskTree && taskTree.task_tree) {
            taskTree = taskTree.task_tree;
        }
        currentTaskTree = taskTree;
    }
    
    // Open the modal
    openToDoModal();
}

function closeToDoModal() {
    const modal = document.getElementById('todoModal');
    modal.style.display = 'none';
    
    // Clear inputs
    document.getElementById('todoListName').value = '';
    document.getElementById('aiTodoListName').value = '';
    document.getElementById('aiTodoPrompt').value = '';
    
    // Uncheck all tasks
    const checkboxes = document.querySelectorAll('.task-selection-item input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);
}

function showManualSelection() {
    document.getElementById('manualSelectionContainer').style.display = 'block';
    document.getElementById('aiGenerationContainer').style.display = 'none';
    
    // Populate task list from current task tree
    populateTaskSelection();
}

function showAiGeneration() {
    document.getElementById('aiGenerationContainer').style.display = 'block';
    document.getElementById('manualSelectionContainer').style.display = 'none';
}

function populateTaskSelection() {
    const taskList = document.getElementById('taskSelectionList');
    taskList.innerHTML = '';
    
    if (!currentTaskTree || !currentTaskTree.categories) {
        taskList.innerHTML = '<p>No tasks available. Please generate a task tree first.</p>';
        return;
    }
    
    // Build hierarchical list
    currentTaskTree.categories.forEach((category, catIndex) => {
        const catItem = document.createElement('div');
        catItem.className = 'task-selection-item';
        catItem.style.marginLeft = '0px';
        catItem.innerHTML = `
            <label class="task-selection-label">
                <input type="checkbox" data-path="${catIndex}">
                <strong>${category.emoji || ''} ${category.name}</strong>
            </label>
        `;
        taskList.appendChild(catItem);
        
        if (category.projects) {
            category.projects.forEach((project, projIndex) => {
                const projItem = document.createElement('div');
                projItem.className = 'task-selection-item';
                projItem.style.marginLeft = '20px';
                projItem.innerHTML = `
                    <label class="task-selection-label">
                        <input type="checkbox" data-path="${catIndex}.${projIndex}">
                        ${project.emoji || ''} ${project.name}
                    </label>
                `;
                taskList.appendChild(projItem);
                
                if (project.tasks) {
                    project.tasks.forEach((task, taskIndex) => {
                        const taskItem = document.createElement('div');
                        taskItem.className = 'task-selection-item';
                        taskItem.style.marginLeft = '40px';
                        
                        let taskHtml = `
                            <label class="task-selection-label">
                                <input type="checkbox" data-path="${catIndex}.${projIndex}.${taskIndex}">
                                ${task.emoji || ''} ${task.name}
                            </label>
                        `;
                        
                        // Show dependencies as text (not checkboxes)
                        if (task.dependencies && task.dependencies.length > 0) {
                            taskHtml += '<div style="margin-left: 20px; font-size: 0.85em; color: #888; margin-top: 2px;">';
                            taskHtml += `Dependencies: ${task.dependencies.join(', ')}`;
                            taskHtml += '</div>';
                        }
                        
                        taskItem.innerHTML = taskHtml;
                        taskList.appendChild(taskItem);
                        
                        if (task.subtasks) {
                            task.subtasks.forEach((subtask, subIndex) => {
                                const subItem = document.createElement('div');
                                subItem.className = 'task-selection-item';
                                subItem.style.marginLeft = '60px';
                                
                                let subtaskHtml = `
                                    <label class="task-selection-label">
                                        <input type="checkbox" data-path="${catIndex}.${projIndex}.${taskIndex}.${subIndex}">
                                        ${subtask.emoji || ''} ${subtask.name}
                                    </label>
                                `;
                                
                                // Show subtask dependencies as text
                                if (subtask.dependencies && subtask.dependencies.length > 0) {
                                    subtaskHtml += '<div style="margin-left: 20px; font-size: 0.85em; color: #888; margin-top: 2px;">';
                                    subtaskHtml += `Dependencies: ${subtask.dependencies.join(', ')}`;
                                    subtaskHtml += '</div>';
                                }
                                
                                subItem.innerHTML = subtaskHtml;
                                taskList.appendChild(subItem);
                            });
                        }
                    });
                }
            });
        }
    });
    
    // Add cascading checkbox behavior
    const allCheckboxes = taskList.querySelectorAll('input[type="checkbox"]');
    allCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const path = e.target.dataset.path;
            const isChecked = e.target.checked;
            
            // Check/uncheck all children
            allCheckboxes.forEach(cb => {
                const cbPath = cb.dataset.path;
                // If cbPath starts with path and is longer (meaning it's a child)
                if (cbPath.startsWith(path + '.')) {
                    cb.checked = isChecked;
                }
            });
        });
    });
}

function createManualTodoList() {
    const listName = document.getElementById('todoListName').value.trim();
    if (!listName) {
        alert('Please enter a name for your to-do list');
        return;
    }
    
    const checkboxes = document.querySelectorAll('.task-selection-item input[type="checkbox"]:checked');
    if (checkboxes.length === 0) {
        alert('Please select at least one item');
        return;
    }
    
    // Build hierarchical structure
    const selectedItems = [];
    checkboxes.forEach(cb => {
        const path = cb.dataset.path;
        const parts = path.split('.');
        
        let item = {};
        
        if (parts.length === 1) {
            // Category
            const catIndex = parseInt(parts[0]);
            const category = currentTaskTree.categories[catIndex];
            item = {
                type: 'category',
                emoji: category.emoji || '',
                name: category.name,
                level: 0,
                path: path,
                id: category.id
            };
        } else if (parts.length === 2) {
            // Project
            const [catIndex, projIndex] = parts.map(p => parseInt(p));
            const project = currentTaskTree.categories[catIndex].projects[projIndex];
            item = {
                type: 'project',
                emoji: project.emoji || '',
                name: project.name,
                level: 1,
                parent: currentTaskTree.categories[catIndex].name,
                path: path,
                id: project.id
            };
        } else if (parts.length === 3) {
            // Task
            const [catIndex, projIndex, taskIndex] = parts.map(p => parseInt(p));
            const task = currentTaskTree.categories[catIndex].projects[projIndex].tasks[taskIndex];
            item = {
                type: 'task',
                emoji: task.emoji || '',
                name: task.name,
                level: 2,
                parent: currentTaskTree.categories[catIndex].projects[projIndex].name,
                path: path,
                id: task.id
            };
        } else if (parts.length === 4) {
            // Subtask
            const [catIndex, projIndex, taskIndex, subIndex] = parts.map(p => parseInt(p));
            const subtask = currentTaskTree.categories[catIndex].projects[projIndex].tasks[taskIndex].subtasks[subIndex];
            item = {
                type: 'subtask',
                emoji: subtask.emoji || '',
                name: subtask.name,
                level: 3,
                parent: currentTaskTree.categories[catIndex].projects[projIndex].tasks[taskIndex].name,
                path: path,
                id: subtask.id
            };
        }
        
        selectedItems.push(item);
    });
    
    saveTodoList({
        name: listName,
        items: selectedItems,
        createdAt: new Date().toISOString(),
        type: 'manual'
    });
    
    closeToDoModal();
    showSuccess('To-Do List created!');
}

async function generateAiTodoList() {
    const listName = document.getElementById('aiTodoListName').value.trim();
    const customPrompt = document.getElementById('aiTodoPrompt').value.trim();
    
    if (!listName) {
        alert('Please enter a name for your to-do list');
        return;
    }
    
    if (!currentTaskTree) {
        alert('No task tree available. Please generate a task tree first.');
        return;
    }
    
    // Warn user about AI-generated list limitations
    if (!confirm('⚠️ Note: AI-generated to-do lists will NOT be connected to your main task tree.\n\nThis means checking off items in the AI list won\'t update your main tree, and vice versa.\n\nFor connected lists, use "Manually Select Items" instead.\n\nContinue with AI generation?')) {
        return;
    }
    
    try {
        loadingSpinner.style.display = 'block';
        
        const response = await fetch(`${API_BASE_URL}/api/generate-todo`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                task_tree: currentTaskTree,
                custom_prompt: customPrompt
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        saveTodoList({
            name: listName,
            items: data.todo_items,
            createdAt: new Date().toISOString(),
            type: 'ai',
            prompt: customPrompt
        });
        
        closeToDoModal();
        showSuccess('AI To-Do List generated!');
        
    } catch (error) {
        showError(`Failed to generate AI to-do list: ${error.message}`);
    } finally {
        loadingSpinner.style.display = 'none';
    }
}

function saveTodoList(todoList) {
    // Load existing to-do lists
    const savedListsJson = localStorage.getItem('savedToDoLists');
    let savedLists = savedListsJson ? JSON.parse(savedListsJson) : [];
    
    // Add new list
    todoList.id = Date.now();
    savedLists.push(todoList);
    
    // Save to localStorage
    localStorage.setItem('savedToDoLists', JSON.stringify(savedLists));
    
    // Update display
    updateToDoListsDisplay();
}

function updateToDoListsDisplay() {
    const container = document.getElementById('savedToDoLists');
    const savedListsJson = localStorage.getItem('savedToDoLists');
    const savedLists = savedListsJson ? JSON.parse(savedListsJson) : [];
    
    if (savedLists.length === 0) {
        container.innerHTML = '<p style="color: #666; font-style: italic;">No to-do lists yet</p>';
        return;
    }
    
    container.innerHTML = savedLists.map(list => `
        <div class="todo-list-card">
            <h4>${escapeHtml(list.name)}</h4>
            <p style="color: #666; font-size: 12px;">
                ${new Date(list.createdAt).toLocaleDateString()} • ${list.items.length} items • ${list.type}
            </p>
            <div class="task-card-actions">
                <button class="action-btn" onclick="viewTodoList(${list.id})">👁️ View</button>
                <button class="action-btn" onclick="exportTodoList(${list.id})">💾 Export</button>
                <button class="action-btn" onclick="deleteTodoList(${list.id})">🗑️ Delete</button>
            </div>
        </div>
    `).join('');
}

function viewTodoList(listId) {
    const savedListsJson = localStorage.getItem('savedToDoLists');
    const savedLists = savedListsJson ? JSON.parse(savedListsJson) : [];
    const list = savedLists.find(l => l.id === listId);
    
    if (!list) {
        alert('To-Do List not found');
        return;
    }
    
    console.log('Viewing list:', list);
    console.log('List items:', list.items);
    console.log('Items length:', list.items.length);
    
    const modal = document.getElementById('viewTodoListModal');
    const titleEl = document.getElementById('todoListViewTitle');
    const metaEl = document.getElementById('todoListViewMeta');
    const content = document.getElementById('todoListViewContent');
    
    titleEl.textContent = list.name;
    metaEl.textContent = `Created: ${new Date(list.createdAt).toLocaleString()} • Type: ${list.type}${list.prompt ? ' • Custom prompt: ' + list.prompt : ''}`;
    
    // Get main task tree completion state (assumes tree ID is 1)
    const completionKey = 'taskTreeCompletion_1';
    const completionJson = localStorage.getItem(completionKey);
    const completionState = completionJson ? JSON.parse(completionJson) : {};
    
    let html = '<div style="font-size: 15px;">';
    list.items.forEach((item, idx) => {
        if (typeof item === 'string') {
            // AI-generated format - parse for hierarchy
            let indent = 0;
            let displayText = item;
            let isBold = false;
            
            // Detect hierarchy based on keywords
            if (item.match(/^Group \d+:/i)) {
                indent = 0;
                isBold = true;
            } else if (item.match(/^Subtask:/i)) {
                indent = 20;
                displayText = item.replace(/^Subtask:\s*/i, '• ');
            } else if (item.match(/^Task:/i)) {
                indent = 20;
                displayText = item.replace(/^Task:\s*/i, '✓ ');
            }
            
            html += `<div style="margin-bottom: 8px; margin-left: ${indent}px;">`;
            html += `<label style="display: flex; align-items: flex-start; cursor: pointer;">`;
            html += `<input type="checkbox" style="margin-right: 10px; margin-top: 3px; cursor: pointer;">`;
            html += `<span${isBold ? ' style="font-weight: bold;"' : ''}>${displayText}</span>`;
            html += `</label></div>`;
        } else {
            // New hierarchical format with ID
            const indent = 20 * item.level;
            const itemId = item.id || item.path; // Fallback to path if no ID
            const isChecked = itemId && completionState[itemId] ? 'checked' : '';
            
            html += `<div style="margin-bottom: 8px; margin-left: ${indent}px;">`;
            html += `<label style="display: flex; align-items: flex-start; cursor: pointer;">`;
            
            if (itemId) {
                html += `<input type="checkbox" ${isChecked} onchange="saveTodoItemCompletion('${completionKey}', '${itemId}', this.checked)" style="margin-right: 10px; margin-top: 3px; cursor: pointer;">`;
            } else {
                html += `<input type="checkbox" disabled style="margin-right: 10px; margin-top: 3px;">`;
            }
            
            html += `<span>${item.emoji} ${item.name}</span>`;
            html += `</label></div>`;
        }
    });
    html += '</div>';
    
    content.innerHTML = html;
    modal.style.display = 'block';
}

function saveTodoItemCompletion(completionKey, itemId, isChecked) {
    const completionJson = localStorage.getItem(completionKey);
    const completionState = completionJson ? JSON.parse(completionJson) : {};
    
    // Update this item
    if (isChecked) {
        completionState[itemId] = true;
    } else {
        delete completionState[itemId];
    }
    
    // Find and update all children by building ID hierarchy from the task tree
    const savedTreeJson = localStorage.getItem('savedTaskTree');
    if (savedTreeJson) {
        const savedTree = JSON.parse(savedTreeJson);
        let taskTree = savedTree.task_tree;
        if (taskTree && taskTree.task_tree) {
            taskTree = taskTree.task_tree;
        }
        
        // Get all descendant IDs
        const descendants = getDescendantIds(taskTree, itemId);
        
        // Update checkboxes in the to-do list view
        const content = document.getElementById('todoListViewContent');
        if (content) {
            const allCheckboxes = content.querySelectorAll('input[type="checkbox"]');
            allCheckboxes.forEach(checkbox => {
                const onchangeAttr = checkbox.getAttribute('onchange');
                if (!onchangeAttr) return;
                
                const match = onchangeAttr.match(/'([^']+)',\s*this\.checked/);
                if (!match) return;
                
                const checkboxId = match[1];
                
                if (descendants.includes(checkboxId)) {
                    checkbox.checked = isChecked;
                    if (isChecked) {
                        completionState[checkboxId] = true;
                    } else {
                        delete completionState[checkboxId];
                    }
                }
            });
        }
    }
    
    localStorage.setItem(completionKey, JSON.stringify(completionState));
}

function closeTodoListViewModal() {
    const modal = document.getElementById('viewTodoListModal');
    modal.style.display = 'none';
}

function exportTodoList(listId) {
    const savedListsJson = localStorage.getItem('savedToDoLists');
    const savedLists = savedListsJson ? JSON.parse(savedListsJson) : [];
    const list = savedLists.find(l => l.id === listId);
    
    if (!list) {
        alert('To-Do List not found');
        return;
    }
    
    let content = `${list.name}\n`;
    content += `Created: ${new Date(list.createdAt).toLocaleString()}\n`;
    content += `Type: ${list.type}\n`;
    if (list.prompt) {
        content += `Prompt: ${list.prompt}\n`;
    }
    content += `\n`;
    list.items.forEach((item, idx) => {
        if (typeof item === 'string') {
            // Old format (AI-generated or legacy)
            content += `☐ ${item}\n`;
        } else {
            // New hierarchical format
            const indent = '  '.repeat(item.level);
            content += `${indent}☐ ${item.emoji} ${item.name}\n`;
        }
    });
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `todo-${list.name.replace(/\s+/g, '-')}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showSuccess('To-Do List exported!');
}

function deleteTodoList(listId) {
    if (!confirm('Are you sure you want to delete this to-do list?')) {
        return;
    }
    
    const savedListsJson = localStorage.getItem('savedToDoLists');
    let savedLists = savedListsJson ? JSON.parse(savedListsJson) : [];
    savedLists = savedLists.filter(l => l.id !== listId);
    
    localStorage.setItem('savedToDoLists', JSON.stringify(savedLists));
    updateToDoListsDisplay();
    showSuccess('To-Do List deleted');
}