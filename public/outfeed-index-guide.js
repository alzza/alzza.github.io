(function () {
  'use strict';
  const root = document.querySelector('[data-outfeed-guide]');
  if (!root) return;
  let current = 'idle';
  const inputs = Object.fromEntries([...root.querySelectorAll('[data-guide-input]')].map(el => [el.dataset.guideInput, el]));
  const steps = {
    idle: ['시작 대기', '시작 허가가 모두 맞았다고 가정한다. 다음 단계는 Index Step 진입을 보여 준다.', '실제 시작에는 Blank 감지 시간과 기존 허가가 필요하다.'],
    index: ['연속 전진 · State_Index_1', '진입 Action이 전진 출력을 로봇 이탈 허가 값으로 쓴다.', 'Slowdown이 감지될 때까지 이 Step에서 기다린다.'],
    delay: ['밸브 응답 대기 · State_Valve_Response', '앞 Step의 종료 Action은 전진 출력을 0으로 쓴다. 이 Step은 밸브 응답을 기다린다.', '확인한 Preset 30ms가 지나 DN이 켜지면 다음 Step으로 간다.'],
    bump: ['원점 찾기 · State_Bump_Valve', '진입 Action이 전진 출력을 로봇 이탈 허가 값으로 쓴다.', 'Home이 1이면 추가 이동으로 간다. Home이 0이고 Bump DN이 1이면 이 Step으로 되돌아온다.'],
    additional: ['추가 이동 · State_Additional_Move', 'Home 감지 후 추가 이동 Step에 들어왔다.', '이 Step의 DN이 켜져 Step을 벗어날 때 종료 Action이 전진 출력을 0으로 쓴다. Online Preset을 확인한다.'],
    stop: ['인덱스 완료 · Index_Stop', 'Index_Stop.X가 되면 DoAutomatic이 State_Wait 등 후속 동작을 진행한다.', '완료 후 다음 시작까지의 조건은 현장 신호와 함께 확인한다.']
  };
  function paint(message) {
    root.querySelector('[data-guide-title]').textContent = steps[current][0];
    root.querySelector('[data-guide-text]').textContent = steps[current][1];
    root.querySelector('[data-guide-condition]').textContent = message || steps[current][2];
    const motion = {
      idle:'시작 대기: 다음 Blank를 받을 빈 자리를 확인한다.',
      index:'연속 전진 단계: Slowdown 감지를 기다린다.',
      delay:'응답 대기 단계: 앞 Step 종료 Action이 전진 출력을 0으로 쓴다.',
      bump:'원점 찾기 단계: Home 신호와 Bump DN의 조건을 확인한다.',
      additional:'추가 이동 단계: Home 감지 후 Step DN을 기다린다.',
      stop:'인덱스 완료: 후속 동작으로 넘어간다.'
    };
    root.querySelector('[data-guide-motion]').textContent = motion[current];
    root.querySelector('.outfeed-machine').dataset.stage = current;
    root.querySelectorAll('[data-guide-node]').forEach(el => el.classList.toggle('is-active', el.dataset.guideNode === current));
  }
  root.querySelector('[data-guide-next]').addEventListener('click', () => {
    let message = '';
    if (current === 'idle') current = 'index';
    else if (current === 'index') {
      if (inputs.slowdown.checked) current = 'delay';
      else message = 'Slowdown이 0이므로 State_Index_1에서 기다린다.';
    } else if (current === 'delay') {
      if (inputs.delayDone.checked) current = 'bump';
      else message = '밸브 응답 대기 DN이 0이므로 이 Step에서 기다린다.';
    } else if (current === 'bump') {
      if (inputs.home.checked) current = 'additional';
      else if (inputs.bumpDone.checked) {
        inputs.bumpDone.checked = false;
        message = 'Home이 0이고 Bump DN이 1이어서 같은 Step으로 돌아왔다. 새 Step의 DN은 다시 0으로 표시한다.';
      } else message = 'Home과 Bump DN이 모두 0이므로 이 Step에서 기다린다.';
    } else if (current === 'additional') {
      if (inputs.additionalDone.checked) current = 'stop';
      else message = '추가 이동 DN이 0이므로 이 Step에서 기다린다.';
    } else message = '다시 보려면 처음부터를 누른다.';
    paint(message);
  });
  root.querySelector('[data-guide-reset]').addEventListener('click', () => {
    current = 'idle'; Object.values(inputs).forEach(el => { el.checked = false; }); paint();
  });
  paint();
})();
