import './styles/app';
import { PolySynth, Sequence, Transport } from 'tone';
import $ from 'jquery';

const SEQUENCER_DOM_ID = 'stepSequencer';
const SEQUENCER_STEP_CLASS = 'column';

const PAD_COLS = 8;
const PAD_ROWS = 5;

const DEFAULT_BPM = 120;
const BASE_BEAT = '16n';
const NOTES = ['E4', 'D4', 'G4', 'B4', 'C5'].reverse();

const STATE = {
  PAD_COLS,
  PAD_ROWS,
  BEAT: BASE_BEAT,
  BPM: DEFAULT_BPM,
  NOTES,
  ON_PLAY: false,
};

const getPAD = () => ({ cols: STATE.PAD_COLS, rows: STATE.PAD_ROWS });
const getBeat = () => STATE.BEAT;
const getBPM = () => STATE.BPM;
const getNotes = () => STATE.NOTES;
const getNoteByIndex = (index) => STATE.NOTES[index];
const getOnPlay = () => STATE.ON_PLAY;

const setStateBPM = (bpm) => {
  STATE.BPM = bpm;
};

const setStateOnPlay = (isPlay) => {
  STATE.ON_PLAY = isPlay;
};

const toggleOnPlay = () => {
  setStateOnPlay(!STATE.ON_PLAY);
};

// Synthesizer
let syn;

// set up Sequence
let sequence;

function soundCode(time, { code }) {
  const note = code.filter(Boolean);
  if (note.length) {
    syn.triggerAttackRelease(note, getBeat());
  }
}

function setNoteToSequence({ x, y, note }) {
  const code = sequence.at(x).value.code;
  code[y] = note;
}

function setupSequence() {
  const { cols, rows } = getPAD();
  const scoreMap = Array.from({ length: cols }, (_) => ({
    code: Array(rows).fill(null),
  }));
  syn = new PolySynth(rows).toMaster();
  sequence = new Sequence(soundCode, scoreMap, getBeat()).start();
  // indefinitely loop
  sequence.loop = true;
}

function setBPM(bpm = DEFAULT_BPM) {
  Transport.bpm.value = bpm;
  setStateBPM(bpm);
}

function playPadEventInit(onUpdatePlayer) {
  const { cols } = getPAD();
  const beat = getBeat();
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
    if (count >= cols) {
      count = 0;
      time = now;
    }
  }, beat);

  return {
    reset() {
      count = 0;
      time = 0;
      first = true;
    },
  };
}

const PAT_TEMPLATE = `<label class="row">
<input class="checkbox" type="checkbox">
<span class="button"></span>
</label>`;

function createStepSequencer() {
  const { cols, rows } = getPAD();
  const $container = document.getElementById(SEQUENCER_DOM_ID);
  const $fragment = document.createDocumentFragment();

  Array.from({ length: cols }, (_) => {
    const $row = document.createElement('div');
    $row.className = SEQUENCER_STEP_CLASS;
    $row.innerHTML = Array(rows)
      .fill(null)
      .reduce((html, _) => {
        return (html += PAT_TEMPLATE);
      }, '');
    $fragment.appendChild($row);
  });

  $container.appendChild($fragment);
}

function updatePlayerInit() {
  const timer = document.getElementById('time');
  const padColumns = [
    ...document
      .getElementById(SEQUENCER_DOM_ID)
      .querySelectorAll(`.${SEQUENCER_STEP_CLASS}`),
  ];

  let prevIndex = 0;
  return {
    update(index, time) {
      timer.textContent = time.toFixed(2).replace('.', ':');
      padColumns[prevIndex].classList.remove('highlight');
      padColumns[index].classList.add('highlight');
      prevIndex = index;
    },
    reset() {
      padColumns.map((col) => {
        col.classList.remove('highlight');
      });
      prevIndex = 0;
      timer.textContent = '0:00';
    },
  };
}

function padButtonsInit() {
  const $sequencer = $(`#${SEQUENCER_DOM_ID}`);

  $sequencer.find(`.${SEQUENCER_STEP_CLASS}`).each((x, elm) => {
    $(elm)
      .find('.row')
      .each((y, pad) => {
        const $pad = $(pad).find('.checkbox');
        $.data($pad[0], 'pos', { x, y });
        $pad.on('change.togglePad', (e) => {
          const checked = e.target.checked;
          const { x, y } = $.data(e.target, 'pos');
          const note = checked ? getNoteByIndex(y) : null;
          setNoteToSequence({ x, y, note });
        });
      });
  });
}

function resetPadButtons() {
  const $sequencer = $(`#${SEQUENCER_DOM_ID}`);

  $sequencer.find(`.${SEQUENCER_STEP_CLASS}`).each((x, elm) => {
    $(elm)
      .find('.row')
      .each((y, pad) => {
        const $pad = $(pad).find('.checkbox');
        // $pad.off('change.togglePad');
        $pad.prop('checked', false);
        setNoteToSequence({ x, y, note: null });
      });
  });
}

function bpmControllerInit() {
  const $bpmController = $('#bpm');
  const label = $('#bpmLabel')[0];
  label.textContent = DEFAULT_BPM;

  const setLabel = (bpm) => {
    label.textContent = bpm;
  };

  $bpmController.on('change.bpm', (e) => {
    const bpm = e.currentTarget.value;
    setLabel(bpm);
    setBPM(bpm);
  });

  $bpmController.on('input.bpm', (e) => {
    setLabel(e.currentTarget.value);
  });

  return {
    reset() {
      document.getElementById('bpm').value = DEFAULT_BPM;
      document.getElementById('bpmLabel').textContent = DEFAULT_BPM;
      setBPM(DEFAULT_BPM);
    },
  };
}

function playBtnInit({ reset }) {
  const label = ['STOP', 'PLAY'];
  const $playBtn = $('#playBtn');

  $playBtn.on('click.onPlay', () => {
    const onPlay = getOnPlay();
    if (onPlay) {
      Transport.stop();
      reset();
    } else {
      Transport.start();
    }
    $playBtn[0].textContent = label[onPlay - 0];
    toggleOnPlay();
  });
}

function resetBtnInit({ reset }) {
  const $resetBtn = $('#resetBtn');

  $resetBtn.on('click.onRest', () => {
    Transport.stop();
    setStateOnPlay(false);
    $('#playBtn')[0].textContent = 'START';
    reset();
  });
}

function init() {
  createStepSequencer();

  const { update, reset: PlayerReset } = updatePlayerInit();
  const { reset: PlayCountReset } = playPadEventInit(update);
  setupSequence();
  padButtonsInit();
  const { reset: bpmReset } = bpmControllerInit();

  const onReset = () => {
    PlayerReset();
    PlayCountReset();
  };

  const onDestroy = () => {
    bpmReset();
    PlayerReset();
    PlayCountReset();
    resetPadButtons();
  };

  playBtnInit({ reset: onReset });
  resetBtnInit({ reset: onDestroy });
  onReset();
}
init();
