import { Level, Save } from "./types";

// In the event of outdated save data formats
const VERSION = 1;

import levels from './levels.json';

export function loadLevel() {
  const save = loadSave();
  let selectedLevel = null
  // Load a random level, but not the previous level, if possible
  const previousLevel = save.previousLevel ?? -1;
  const availableLevels = levels.filter((l: Level) => l.id !== previousLevel);
  if(availableLevels.length === 0) {
    // If no levels are available, just load a random one
    selectedLevel = levels[Math.floor(Math.random() * levels.length)];
  } else {
    selectedLevel = availableLevels[Math.floor(Math.random() * availableLevels.length)];
  }
  saveSave({
    pegsCleared: [],
    score: 0,
    version: VERSION,
    previousLevel: save.level,
    level: selectedLevel.id,
  })
  return selectedLevel;
}

export function loadSave(): Save {
  const save = localStorage.getItem('save');
  if (save) {
    const parsedSave = JSON.parse(save);
    if(parsedSave.version !== VERSION) {
      localStorage.removeItem('save');
    } else {
      return parsedSave;
    }
  }
  return {
    level: 1,
    previousLevel: null,
    score: 0,
    pegsCleared: [],
    version: VERSION,
  };
}

// Save save save save... save.
export function saveSave(save: Save) {
  localStorage.setItem('save', JSON.stringify(save));
}

const EDGE_BUFFER = 100; // Distance from edges to start slowing
const MIN_SPEED = .4; // Minimum speed near edges
const MAX_SPEED = 1; // Maximum speed at the center
const LEFT_EDGE = 150;
const RIGHT_EDGE = 800;

export function calcBucketSpeed(xPos: number): number {
  // Calculate normalized distance from the edges
  const distanceToEdge = Math.min(xPos - LEFT_EDGE, RIGHT_EDGE - xPos);
  const normalizedDistance = Math.max(0, Math.min(1, distanceToEdge / EDGE_BUFFER));
  return MIN_SPEED + (MAX_SPEED - MIN_SPEED) * normalizedDistance;
}
 
export function calculateOffsets(angle: number, hypotenuse: number): {offsetX: number, offsetY: number} {
  // Convert angle to radians
  const radians = angle * (Math.PI / 180);

  // Calculate offsets
  const offsetX = hypotenuse * Math.cos(radians);
  const offsetY = hypotenuse * Math.sin(radians);

  return { offsetX, offsetY }
}
