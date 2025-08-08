const palettes = {
    grass: ['#5DBB63', '#4FAA56', '#3E994A', '#2D883E', '#1C7732'],
    water: ['#3B82F6', '#2563EB', '#1D4ED8', '#1E40AF', '#1E3A8A'],
    sand: ['#FBBF24', '#F59E0B', '#D97706', '#B45309', '#92400E'],
    stone: ['#9CA3AF', '#6B7280', '#4B5563', '#374151', '#1F2937'],
    wood: ['#A16207', '#854D0E', '#713F12', '#522E06', '#422006']
};

const palettePicker = document.getElementById('palette-picker');
const generateTextureButton = document.getElementById('generate-texture');
const pencilColorsContainer = document.getElementById('pencil-colors');
const pencilSizeSlider = document.getElementById('pencil-size');
const editorCanvas = document.getElementById('editor-canvas');
const previewCanvas = document.getElementById('preview-canvas');
const downloadButton = document.getElementById('download-button');

const editorCtx = editorCanvas.getContext('2d');
const previewCtx = previewCanvas.getContext('2d');

let selectedColor = palettes.grass[0];
let pencilSize = pencilSizeSlider.value;
let isDrawing = false;

function init() {
    populatePalettes();
    updatePencilColors();
    addEventListeners();
    generateInitialTexture();
}

function populatePalettes() {
    for (const paletteName in palettes) {
        const option = document.createElement('option');
        option.value = paletteName;
        option.textContent = paletteName.charAt(0).toUpperCase() + paletteName.slice(1);
        palettePicker.appendChild(option);
    }
}

function updatePencilColors() {
    const currentPalette = palettePicker.value;
    pencilColorsContainer.innerHTML = '';
    palettes[currentPalette].forEach(color => {
        const colorBox = document.createElement('div');
        colorBox.classList.add('color-box');
        colorBox.style.backgroundColor = color;
        colorBox.dataset.color = color;
        if (color === selectedColor) {
            colorBox.classList.add('selected');
        }
        pencilColorsContainer.appendChild(colorBox);
    });
}

function generateInitialTexture() {
    const currentPalette = palettePicker.value;
    const colors = palettes[currentPalette];
    for (let y = 0; y < editorCanvas.height; y++) {
        for (let x = 0; x < editorCanvas.width; x++) {
            const color = colors[Math.floor(Math.random() * colors.length)];
            editorCtx.fillStyle = color;
            editorCtx.fillRect(x, y, 1, 1);
        }
    }
    updatePreview();
}

function updatePreview() {
    previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    const pattern = previewCtx.createPattern(editorCanvas, 'repeat');
    previewCtx.fillStyle = pattern;
    previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
}

function draw(e) {
    if (!isDrawing) return;
    const rect = editorCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    editorCtx.fillStyle = selectedColor;
    editorCtx.beginPath();
    editorCtx.arc(x, y, pencilSize, 0, Math.PI * 2);
    editorCtx.fill();
    updatePreview();
}

function addEventListeners() {
    palettePicker.addEventListener('change', () => {
        selectedColor = palettes[palettePicker.value][0];
        updatePencilColors();
        generateInitialTexture();
    });

    generateTextureButton.addEventListener('click', generateInitialTexture);

    pencilColorsContainer.addEventListener('click', e => {
        if (e.target.classList.contains('color-box')) {
            selectedColor = e.target.dataset.color;
            document.querySelector('.color-box.selected').classList.remove('selected');
            e.target.classList.add('selected');
        }
    });

    pencilSizeSlider.addEventListener('change', e => {
        pencilSize = e.target.value;
    });

    editorCanvas.addEventListener('mousedown', (e) => {
        isDrawing = true;
        draw(e);
    });
    editorCanvas.addEventListener('mousemove', draw);
    editorCanvas.addEventListener('mouseup', () => isDrawing = false);
    editorCanvas.addEventListener('mouseout', () => isDrawing = false);

    downloadButton.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = 'texture.png';
        link.href = editorCanvas.toDataURL();
        link.click();
    });
}

init();
