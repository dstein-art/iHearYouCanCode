let samples = [
  "/assets/superdirt/000_BD.wav",
  "/assets/superdirt/001_CB.wav",
  "/assets/superdirt/002_FX.wav",
  "/assets/superdirt/003_HH.wav",
  "/assets/superdirt/004_OH.wav",
  "/assets/superdirt/005_P1.wav",
  "/assets/superdirt/006_P2.wav",
];

const ROWS = 7;
const COLS = 16;
const BPM = 120;
const names = ['BD', 'CB', 'FX', 'HH', 'OH', 'P1', 'P2'];

let sounds = [];
let phrases = [];
let part;
let pad, playBtn;
let playing = false;
let curStep = 0;
let prevStep = -1;

function preload() {
  for (let url of samples) sounds.push(loadSound(url));
}

function setup() {
  createCanvas(630, 270);

  // One p5.Phrase per row — sequence is the row's toggle array
  for (let r = 0; r < ROWS; r++) {
    const sound = sounds[r];
    phrases.push(new p5.Phrase(
      names[r],
      (time) => { sound.play(time); },
      new Array(COLS).fill(0)
    ));
  }

  // Tracker phrase: [1..16] so every step fires; val-1 gives 0-indexed step
  const tracker = new p5.Phrase(
    '_step',
    (time, val) => { curStep = val - 1; },
    Array.from({ length: COLS }, (_, i) => i + 1)
  );

  // p5.Part default bLength=0.0625 → tatums=4, so setBPM(120) = 16th notes at 120 BPM
  part = new p5.Part();
  phrases.forEach(p => part.addPhrase(p));
  part.addPhrase(tracker);
  part.setBPM(BPM);

  playBtn = new IconButton({
    x: 10, y: 10,
    icon: 'play_arrow',
    toggle: true,
    onClick: (_, btn) => {
      userStartAudio();
      playing = btn.state;
      btn.icon = playing ? 'stop' : 'play_arrow';
      if (playing) {
        part.metro.metroTicks = 0; // reset to step 0
        part.loop(0);
      } else {
        part.stop();
        pad.highlightCol(prevStep, false);
        prevStep = -1;
      }
    },
  });

  pad = new GridPad({
    x: 60, y: 10,
    rows: ROWS,
    cols: COLS,
    mode: 'toggle',
    cellSize: 30,
    cellGap: 3,
    hGroup: 4,
    groupGap: 5,
    onChange: (vals) => {
      for (let r = 0; r < ROWS; r++) {
        part.replaceSequence(names[r], [...vals[r]]);
      }
    },
  });
}

function draw() {
  proControlBackground();

  fill(pad.theme.label);
  noStroke();
  textAlign(RIGHT, CENTER);
  textSize(11);
  for (let r = 0; r < ROWS; r++) {
    const cy = pad.y + 6 + r * (pad.cellSize + pad.cellGap) + pad.cellSize / 2;
    text(names[r], pad.x - 8, cy);
  }

  if (playing && curStep !== prevStep) {
    if (prevStep >= 0) pad.highlightCol(prevStep, false);
    pad.highlightCol(curStep, true);
    prevStep = curStep;
  }
}
