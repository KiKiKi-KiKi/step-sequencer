import './styles/app';
import { PolySynth, Sequence, Transport } from 'tone';
import $ from 'jquery';

const PAD_COLS = 8;
const PAD_ROWS = 5;
const SCORE_MAP = Array.from({ length: PAD_COLS }, (_) => ({ code: Array(PAD_ROWS).fill(null) }));

const DEFAULT_BPM = 120;
const BASE_BEATE = '16n';
const NOTES = ['E4', 'D4', 'G4', 'B4', 'C5'].reverse();

// Synthesizer
let syn;

// set up Sequence
let sequence;

function soundCode(time, { code }) {
  const note = code.filter(Boolean);
  if (note.length) {
    syn.triggerAttackRelease(note, BASE_BEATE);
  }
}

function setNoteToSequence({ x, y, note }) {
  const code = sequence.at(x).value.code;
  code[y] = note;
}

function setupSequence() {
  syn = new PolySynth(PAD_ROWS).toMaster();
  sequence = new Sequence(soundCode, SCORE_MAP, BASE_BEATE).start();
  // indefinitely loop
  sequence.loop = true;
}

function setBPM(bpm = DEFAULT_BPM) {
  Transport.bpm.value = bpm;
}

function playPadEventInit(onUpdatePlayer) {
  let count = 0;
  let time = 0;
  let first = true;
  Transport.scheduleRepeat((now) => {
    if (first) {
      time = now;
      first = false;
    }
    const elapsed = now - time;
    onUpdatePlayer(count, elapsed);
    count += 1;
    if (count >= PAD_COLS) {
      count = 0;
      time = now;
    }
  }, BASE_BEATE);

  return {
    reset() {
      count = 0;
      time = 0;
      first = true;
    }
  }
}

function updatePlayerInit() {
  const timer = document.getElementById('time');
  const padColumns = [...document.getElementById('stepSequencer').querySelectorAll('.column')];

  let prevIndex = 0;
  return {
    update(index, time) {
      timer.textContent = time.toFixed(2).replace('.', ':');
      padColumns[prevIndex].classList.remove('highlight');
      padColumns[index].classList.add('highlight');
      prevIndex = index;
    },
    reset() {
      padColumns[prevIndex].classList.remove('highlight');
      prevIndex = 0;
      timer.textContent = '0:00';
    }
  }
}

function padButtonsInit() {
  const $pad = $('#stepSequencer');
  $pad.find('.column').each((x, elm) => {
    $(elm).find('.row').each((y, pad) => {
      const $pad = $(pad).find('.checkbox');
      $.data($pad[0], 'pos', { x, y });
      $pad.on('change', (e) => {
        const checked = e.target.checked;
        const { x, y } = $.data(e.target, 'pos');
        const note = checked ? NOTES[y] : null;
        setNoteToSequence({ x, y, note });
      });
    });
  });
}

function bpmControllerInit() {
  const $bpmController = $('#bpm');
  const label = $('#bpmLabel')[0];
  label.textContent = DEFAULT_BPM;

  $bpmController.on('change.bpm', (e) => {
    const bpm = e.target.value;
    label.textContent = bpm;
    setBPM(bpm);
  });

  return {
    reset() {
      document.getElementById('bpm').value = DEFAULT_BPM;
      document.getElementById('bpmLabel').textContent = DEFAULT_BPM;
      setBPM(DEFAULT_BPM);
    }
  };
}

function playBtnInit({ reset }) {
  let onPlay = false;
  const label = ['STOP', 'PLAY'];
  const $playBtn = $('#playBtn');

  $playBtn.on('click.onPlay', () => {
    if (onPlay) {
      Transport.stop();
      reset();
    } else {
      Transport.start();
    }
    $playBtn[0].textContent = label[onPlay - 0];
    onPlay = !onPlay;
  });
}

function init() {
  const { update, reset: PlayerReset } = updatePlayerInit();
  const { reset: PlayCountReset } = playPadEventInit(update);
  const onReset = () => {
    PlayerReset();
    PlayCountReset();
  };
  setupSequence();

  padButtonsInit();
  bpmControllerInit();
  playBtnInit({ reset: onReset });
  onReset();
}
init();
