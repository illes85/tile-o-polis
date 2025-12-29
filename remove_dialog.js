const fs = require('fs');
const path = 'src/pages/Game.tsx';
const content = fs.readFileSync(path, 'utf8');
const lines = content.split(/\r?\n/);

// Target lines based on 1-based indexing from Read tool
// Start: 3055 -> Index 3054
// End: 3747 -> Index 3746

const startIdx = 3054;
const endIdx = 3746;

console.log('Total lines:', lines.length);
if (lines.length <= endIdx) {
    console.error('File is too short.');
    process.exit(1);
}

const startLine = lines[startIdx];
const endLine = lines[endIdx];

console.log('Line 3055 content:', JSON.stringify(startLine));
console.log('Line 3747 content:', JSON.stringify(endLine));

const isStartValid = startLine.includes('{false && selectedBuilding');
const isEndValid = endLine.trim() === ')}';

if (isStartValid && isEndValid) {
    console.log('Safety checks passed. Removing lines...');
    // Remove from startIdx to endIdx inclusive
    lines.splice(startIdx, endIdx - startIdx + 1);
    
    // Join with original line ending if possible, but \n is standard
    fs.writeFileSync(path, lines.join('\n'));
    console.log('File updated.');
} else {
    console.error('Safety check failed!');
    if (!isStartValid) console.error('Start line mismatch.');
    if (!isEndValid) console.error('End line mismatch.');
    
    // Search for the lines if they shifted
    console.log('Searching for correct lines...');
    let foundStart = -1;
    let foundEnd = -1;
    
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('{false && selectedBuilding && (')) {
            foundStart = i;
        }
        if (foundStart !== -1 && i > foundStart && lines[i].trim() === ')}' && lines[i+2] && lines[i+2].includes('selectedShopBuilding')) {
             // Heuristic: check if selectedShopBuilding follows shortly
             foundEnd = i;
             break;
        }
    }
    
    if (foundStart !== -1) {
        console.log(`Found start at index ${foundStart} (Line ${foundStart + 1})`);
        // Try to find end from there
        let nesting = 1;
        for (let i = foundStart + 1; i < lines.length; i++) {
             // This simple nesting check is hard with just lines.
             // Let's look for the specific end pattern
             if (lines[i].trim() === ')}' && lines[i+2] && lines[i+2].includes('selectedShopBuilding')) {
                 foundEnd = i;
                 break;
             }
        }
        
        if (foundEnd !== -1) {
             console.log(`Found end at index ${foundEnd} (Line ${foundEnd + 1})`);
             lines.splice(foundStart, foundEnd - foundStart + 1);
             fs.writeFileSync(path, lines.join('\n'));
             console.log('File updated with found indices.');
        } else {
             console.log('Could not find end line.');
        }
    } else {
        console.log('Could not find start line.');
    }
}
