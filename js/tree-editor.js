document.addEventListener('DOMContentLoaded', () => {
    const axiomInput = document.getElementById('axiom');
    const rulesInput = document.getElementById('rules');
    const angleInput = document.getElementById('angle');
    const angleValue = document.getElementById('angle-value');
    const iterationsInput = document.getElementById('iterations');
    const iterationsValue = document.getElementById('iterations-value');
    const numLeavesInput = document.getElementById('num-leaves');
    const numLeavesValue = document.getElementById('num-leaves-value');
    const leafSizeInput = document.getElementById('leaf-size');
    const leafSizeValue = document.getElementById('leaf-size-value');
    const leafShapeInput = document.getElementById('leaf-shape');
    const colorPaletteInput = document.getElementById('color-palette');
    const generateBtn = document.getElementById('generate-btn');
    const exportBtn = document.getElementById('export-btn');
    const canvas = document.getElementById('canvas');

    angleInput.addEventListener('input', () => {
        angleValue.textContent = angleInput.value;
    });

    iterationsInput.addEventListener('input', () => {
        iterationsValue.textContent = iterationsInput.value;
    });

    numLeavesInput.addEventListener('input', () => {
        numLeavesValue.textContent = numLeavesInput.value;
    });

    leafSizeInput.addEventListener('input', () => {
        leafSizeValue.textContent = leafSizeInput.value;
    });

    generateBtn.addEventListener('click', () => {
        const axiom = axiomInput.value;
        const rules = rulesInput.value;
        const angle = parseFloat(angleInput.value);
        const iterations = parseInt(iterationsInput.value);
        const numLeaves = parseInt(numLeavesInput.value);
        const leafSize = parseInt(leafSizeInput.value);
        const leafShape = leafShapeInput.value;
        const color = colorPaletteInput.value;

        generateTree(axiom, rules, angle, iterations, numLeaves, leafSize, leafShape, color);
    });

    exportBtn.addEventListener('click', () => {
        exportSVG();
    });

    function generateTree(axiom, rulesStr, angle, iterations, numLeaves, leafSize, leafShape, color) {
        canvas.innerHTML = ''; // Clear previous tree

        const rules = {};
        rulesStr.split('\n').forEach(rule => {
            const parts = rule.split('->');
            if (parts.length === 2) {
                rules[parts[0].trim()] = parts[1].trim();
            }
        });

        let currentString = axiom;
        for (let i = 0; i < iterations; i++) {
            let nextString = '';
            for (const char of currentString) {
                nextString += rules[char] || char;
            }
            currentString = nextString;
        }

        const svg = document.getElementById('canvas');
        const width = svg.clientWidth;
        const height = svg.clientHeight;
        let x = width / 2;
        let y = height;
        let currentAngle = -90;
        const stack = [];
        const length = 5;

        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

        for (const char of currentString) {
            switch (char) {
                case 'F':
                    const x2 = x + length * Math.cos(currentAngle * Math.PI / 180);
                    const y2 = y + length * Math.sin(currentAngle * Math.PI / 180);
                    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    line.setAttribute('x1', x);
                    line.setAttribute('y1', y);
                    line.setAttribute('x2', x2);
                    line.setAttribute('y2', y2);
                    line.setAttribute('stroke', 'black');
                    g.appendChild(line);
                    x = x2;
                    y = y2;
                    break;
                case '-':
                    currentAngle -= angle;
                    break;
                case '+':
                    currentAngle += angle;
                    break;
                case '[':
                    stack.push({ x, y, currentAngle });
                    break;
                case ']':
                    const pos = stack.pop();
                    x = pos.x;
                    y = pos.y;
                    currentAngle = pos.currentAngle;
                    break;
            }
        }

        // Add leaves
        for (let i = 0; i < numLeaves; i++) {
            const randomLine = g.children[Math.floor(Math.random() * g.children.length)];
            const x1 = parseFloat(randomLine.getAttribute('x1'));
            const y1 = parseFloat(randomLine.getAttribute('y1'));
            const x2 = parseFloat(randomLine.getAttribute('x2'));
            const y2 = parseFloat(randomLine.getAttribute('y2'));

            const leafX = x1 + Math.random() * (x2 - x1);
            const leafY = y1 + Math.random() * (y2 - y1);

            if (leafShape === 'circle') {
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', leafX);
                circle.setAttribute('cy', leafY);
                circle.setAttribute('r', leafSize);
                circle.setAttribute('fill', color);
                g.appendChild(circle);
            } else if (leafShape === 'square') {
                const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                rect.setAttribute('x', leafX - leafSize / 2);
                rect.setAttribute('y', leafY - leafSize / 2);
                rect.setAttribute('width', leafSize);
                rect.setAttribute('height', leafSize);
                rect.setAttribute('fill', color);
                g.appendChild(rect);
            }
        }
        svg.appendChild(g);
    }

    function exportSVG() {
        const svgData = new XMLSerializer().serializeToString(canvas);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);
        const downloadLink = document.createElement('a');
        downloadLink.href = svgUrl;
        downloadLink.download = 'tree.svg';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    }
});