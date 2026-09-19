import { StateManager } from './stateManager.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SNAPSHOT_FILE = path.join(__dirname, 'data', 'game_state_snapshot.json');

const sm = new StateManager();
sm.resetAll();
console.log('✅ Tournament state and snapshot fully wiped and reset to clean Round 1 Lobby (0 teams).');
