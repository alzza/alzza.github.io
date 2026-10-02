---
title: "CSM SM#1·SM#2 Finger No Copper 단순 ON/OFF 우회 현장 적용서 Rev.2"
date: "2026-10-02"
excerpt: "원본 기준으로 SM별 센서 우회 ON/OFF를 추가한다. 태그와 InTouch 설정, 변경 전후 LD·SFC, 공식 문법 근거와 복구 절차를 정리했다."
kicker: 현장 적용서
tags: ["PLC", "CSM", "SM", "InTouch"]
---

Rev.2 · 2026-10-02 · 공식 문법 대조 및 게시판

Rev.1의 제어 로직은 유지하고, 공식 문법 근거와 입력 창 구분, S:FS 초기화 범위를 보완했다. 기존 Retry 전용 노트와 별개인 단순 ON/OFF 방식이다.

## 1. 이번 방식의 동작

원본 프로그램에 처음 추가하는 독립적인 적용서다. 이전 Retry 전용안이나 60초안의 태그·Routine을 설치했다고 가정하지 않는다. 현재 장비에 다른 우회안이 실제 적용돼 있다면 이 문서를 겹쳐 입력하지 말고 먼저 현장 프로그램을 원본과 대조한다.

장비별 ON을 누르면 Finger 두 개의 No Copper 판단을 0으로 만든다. 원본 로직에서 0은 전기동이 감지된 쪽으로 해석된다. OFF이면 실제 센서값을 사용한다. 정상 자동, Retry, Single Cycle에서 해당 판단을 읽는 모든 경로에 적용된다. 수동 위치 조작은 원래의 위치 명령을 따르며 이 버튼이 동작을 시작하지 않는다.

<div class="note-identifier-table" tabindex="0" role="region" aria-label="적용 정보 표, 좁은 화면에서는 좌우로 스크롤">
<table><thead><tr><th>상황</th><th>센서 판단</th><th>선택 유지</th></tr></thead><tbody><tr><td>OFF</td><td>실제 No Copper 값을 사용한다.</td><td>OFF를 유지한다.</td></tr><tr><td>ON</td><td>두 Finger의 No Copper 판단을 0으로 만든다.</td><td>OFF를 누를 때까지 유지한다.</td></tr><tr><td>Gate 진입·Drop·탈취 완료</td><td>ON이면 계속 우회한다.</td><td>자동 복귀하지 않는다.</td></tr><tr><td>다음 제품·다음 Retry</td><td>ON이면 계속 우회한다.</td><td>실패 여부를 조건으로 쓰지 않는다.</td></tr><tr><td>Run 전환 또는 Program Inhibit 해제 후 첫 실행</td><td>OFF로 초기화한다.</td><td>다시 ON을 눌러야 한다.</td></tr><tr><td>HMI 통신 두절</td><td>마지막 PLC 선택이 남는다.</td><td>표시등은 통신 품질 불량을 별도로 표시한다.</td></tr></tbody></table>
</div>

Finger Down/Up, Flexbar, Carriage, Gate의 실제 위치 입력과 원본 타이머는 그대로 사용한다. 물리 입력 Alias에는 값을 쓰거나 Force하지 않는다. 센서 우회는 전기동이 실제로 탈취됐다는 증명이 아니다. 실제 전기동이 남아 있어도 완료 판단이 가능하므로, 담당자가 위험과 기계 간섭을 확인한 정지·시험 조건에서만 적용을 검증한다. 운전 중 ON/OFF를 바꾸면 진행 중인 판단도 바뀐다.

## 2. 변경량과 실행 순서

장비당 BOOL 태그 5개, 새 Ladder Routine 1개(5 Rung), MainRoutine 호출 1 Rung을 추가한다. 기존 BasicControl 2 Rung과 SFC Transition 2곳은 교체한다. SM#1과 SM#2는 각각 독립적으로 적용한다.

MainRoutine 맨 앞에서 HMI 선택을 내부 비트에 복사하고 두 센서 판단값을 계산한다. 이후 자동·수동·SFC 및 BasicControl이 그 값을 읽는다. OFF 상태에서는 같은 입력에 대한 논리식이 원본과 같다. 다만 실제 I/O가 스캔 중 바뀌는 시각까지 원본과 완전히 같지는 않다. 원래 BasicControl이 뒤에서 계산하므로 SFC가 완료 비트를 읽는 데 다음 실행까지 걸릴 수 있다.

## 3. 원본 센서 주소

<div class="note-identifier-table" tabindex="0" role="region" aria-label="적용 정보 표, 좁은 화면에서는 좌우로 스크롤">
<table><thead><tr><th>장비</th><th>Program</th><th>Finger 1 / Finger 2 Alias</th></tr></thead><tbody><tr><td>SM#1</td><td><code>Stripping_Machine_1</code></td><td><code>N4:1:I.5</code> / <code>N4:1:I.6</code></td></tr><tr><td>SM#2</td><td><code>Stripping_Machine_2</code></td><td><code>N6:1:I.5</code> / <code>N6:1:I.6</code></td></tr></tbody></table>
</div>

아래 Rung 번호는 검토한 원본의 번호다. 실제 입력 전 번호와 함께 기재된 로직을 대조한다. SFC에는 Rung 번호가 없으므로 Routine·Transition·앞뒤 Step 이름으로 찾는다.


## 4. SM#1 적용

대상은 `Stripping_Machine_1`이다. 아래 항목을 순서대로 적용한다.

### A. Local Tags를 먼저 만든다

`Stripping_Machine_1 → Parameters and Local Tags`에서 다음 BOOL 5개를 만든다. 모두 Base Tag, 초기값 0이다.

<div class="note-identifier-table" tabindex="0" role="region" aria-label="적용 정보 표, 좁은 화면에서는 좌우로 스크롤">
<table><thead><tr><th>태그</th><th>External Access</th><th>역할</th></tr></thead><tbody><tr><td><code>ui_i_sm1_finger_bypass</code></td><td>Read/Write</td><td>HMI가 ON=1, OFF=0을 쓰는 선택값이다.</td></tr><tr><td><code>f_sm1_finger_bypass</code></td><td>None</td><td>PLC가 이번 실행에 적용하는 우회 선택값이다.</td></tr><tr><td><code>f_sm1_finger1_no_copper_used</code></td><td>None</td><td>Finger 1 No Copper 판단값이다.</td></tr><tr><td><code>f_sm1_finger2_no_copper_used</code></td><td>None</td><td>Finger 2 No Copper 판단값이다.</td></tr><tr><td><code>ui_o_sm1_finger_bypass</code></td><td>Read Only</td><td>PLC가 적용한 우회 상태를 HMI에 알린다.</td></tr></tbody></table>
</div>

### B. 새 Ladder Routine을 만든다

`Stripping_Machine_1 → Routines → New Routine`에서 `SM1_FingerSimpleBypass`을 만들고 Type을 Ladder Diagram으로 선택한다. 새 Routine의 Rung 0~4에 아래 다섯 렁을 한 줄씩 입력한다. S:FS 초기화 → 선택 복사 → 센서 두 개 계산 → 표시 순서다.

```text
XIC(S:FS)OTU(ui_i_sm1_finger_bypass);
XIC(ui_i_sm1_finger_bypass)OTE(f_sm1_finger_bypass);
XIC(i_finger_1_no_copper)XIO(f_sm1_finger_bypass)OTE(f_sm1_finger1_no_copper_used);
XIC(i_finger_2_no_copper)XIO(f_sm1_finger_bypass)OTE(f_sm1_finger2_no_copper_used);
XIC(f_sm1_finger_bypass)OTE(ui_o_sm1_finger_bypass);
```


<figure class="ld-rung" data-rung="0" data-rll="XIC(S:FS)OTU(ui_i_sm1_finger_bypass);">
<div class="rung-meta"><span class="rung-meta-number">SM#1 / Stripping_Machine_1 / SM1_FingerSimpleBypass 추가 Rung 0</span><span class="rung-meta-description">Program 첫 실행에서 HMI 우회 선택을 OFF로 초기화한다.</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-sm12-finger-simple-onoff/ld_00.svg" alt="SM#1 / Stripping_Machine_1 / SM1_FingerSimpleBypass 추가 Rung 0" width="1040">
</figure>


<figure class="ld-rung" data-rung="1" data-rll="XIC(ui_i_sm1_finger_bypass)OTE(f_sm1_finger_bypass);">
<div class="rung-meta"><span class="rung-meta-number">SM#1 / Stripping_Machine_1 / SM1_FingerSimpleBypass 추가 Rung 1</span><span class="rung-meta-description">HMI ON/OFF 선택을 PLC 내부 우회 비트에 복사한다.</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-sm12-finger-simple-onoff/ld_01.svg" alt="SM#1 / Stripping_Machine_1 / SM1_FingerSimpleBypass 추가 Rung 1" width="1040">
</figure>


<figure class="ld-rung" data-rung="2" data-rll="XIC(i_finger_1_no_copper)XIO(f_sm1_finger_bypass)OTE(f_sm1_finger1_no_copper_used);">
<div class="rung-meta"><span class="rung-meta-number">SM#1 / Stripping_Machine_1 / SM1_FingerSimpleBypass 추가 Rung 2</span><span class="rung-meta-description">우회 OFF이면 실제 No Copper 입력을 사용하고 ON이면 판단값을 0으로 만든다.</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-sm12-finger-simple-onoff/ld_02.svg" alt="SM#1 / Stripping_Machine_1 / SM1_FingerSimpleBypass 추가 Rung 2" width="1040">
</figure>


<figure class="ld-rung" data-rung="3" data-rll="XIC(i_finger_2_no_copper)XIO(f_sm1_finger_bypass)OTE(f_sm1_finger2_no_copper_used);">
<div class="rung-meta"><span class="rung-meta-number">SM#1 / Stripping_Machine_1 / SM1_FingerSimpleBypass 추가 Rung 3</span><span class="rung-meta-description">우회 OFF이면 실제 No Copper 입력을 사용하고 ON이면 판단값을 0으로 만든다.</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-sm12-finger-simple-onoff/ld_03.svg" alt="SM#1 / Stripping_Machine_1 / SM1_FingerSimpleBypass 추가 Rung 3" width="1040">
</figure>


<figure class="ld-rung" data-rung="4" data-rll="XIC(f_sm1_finger_bypass)OTE(ui_o_sm1_finger_bypass);">
<div class="rung-meta"><span class="rung-meta-number">SM#1 / Stripping_Machine_1 / SM1_FingerSimpleBypass 추가 Rung 4</span><span class="rung-meta-description">PLC가 적용한 우회 상태를 HMI 표시 태그에 복사한다.</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-sm12-finger-simple-onoff/ld_04.svg" alt="SM#1 / Stripping_Machine_1 / SM1_FingerSimpleBypass 추가 Rung 4" width="1040">
</figure>


### C. MainRoutine의 가장 앞에 호출한다

`Stripping_Machine_1 → MainRoutine` 원본 Rung 0은 자동 또는 Single Cycle에서 `DoAutomatic`과 제품 추적을 실행한다. 그 **직전에 새 Rung 0을 추가**한다. 뒤에 붙이면 자동 SFC가 이전 판단값을 먼저 읽으므로 지정한 위치를 지킨다.

변경 전 원본 Rung 0:

```text
[XIC(z_mode_automatic) ,XIC(single_cycle) ][ONS(reset_ons) SFR(DoAutomatic,0) ,[JSR(DoAutomatic,0) ,XIO(single_cycle) JSR(prod_tracking,0) ] ];
```

변경 후 새 Rung 0:

```text
JSR(SM1_FingerSimpleBypass,0);
```

변경 후 Rung 1은 아래 원본을 그대로 유지한다:

```text
[XIC(z_mode_automatic) ,XIC(single_cycle) ][ONS(reset_ons) SFR(DoAutomatic,0) ,[JSR(DoAutomatic,0) ,XIO(single_cycle) JSR(prod_tracking,0) ] ];
```

<figure class="ld-rung" data-rung="0" data-rll="JSR(SM1_FingerSimpleBypass,0);">
<div class="rung-meta"><span class="rung-meta-number">SM#1 / Stripping_Machine_1 / MainRoutine 추가 Rung 0: 센서 판단을 먼저 계산한다</span><span class="rung-meta-description">자동 SFC보다 먼저 새 Routine을 실행해 이번 스캔의 센서 판단값을 계산한다.</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-sm12-finger-simple-onoff/ld_05.svg" alt="SM#1 / Stripping_Machine_1 / MainRoutine 추가 Rung 0: 센서 판단을 먼저 계산한다" width="1040">
</figure>


### D. BasicControl의 기존 완료 판단을 교체한다

해당 Finger가 내려가고 전기동이 감지된 것으로 판단할 때 `f_finger*_separated`를 켜는 렁이다. 기존 렁을 교체하며 같은 완료 태그에 OTE를 추가하지 않는다.


#### Finger 1: `Stripping_Machine_1 / BasicControl` 원본 Rung 52

변경 전:

```text
XIC(i_finger_1_down)XIO(i_finger_1_no_copper)OTE(f_finger1_separated);
```

<figure class="ld-rung" data-rung="52" data-rll="XIC(i_finger_1_down)XIO(i_finger_1_no_copper)OTE(f_finger1_separated);">
<div class="rung-meta"><span class="rung-meta-number">SM#1 / Stripping_Machine_1 / BasicControl Rung 52 변경 전: 실제 센서로 완료 판단</span><span class="rung-meta-description">Finger Down이 참이고 실제 No Copper 입력이 0이면 완료 비트를 켠다.</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-sm12-finger-simple-onoff/ld_06.svg" alt="SM#1 / Stripping_Machine_1 / BasicControl Rung 52 변경 전: 실제 센서로 완료 판단" width="1040">
</figure>

변경 후:

```text
XIC(i_finger_1_down)XIO(f_sm1_finger1_no_copper_used)OTE(f_finger1_separated);
```

<figure class="ld-rung" data-rung="52" data-rll="XIC(i_finger_1_down)XIO(f_sm1_finger1_no_copper_used)OTE(f_finger1_separated);">
<div class="rung-meta"><span class="rung-meta-number">SM#1 / Stripping_Machine_1 / BasicControl Rung 52 변경 후: 선택된 센서 판단으로 완료 판단</span><span class="rung-meta-description">Finger Down이 참이고 선택된 No Copper 판단값이 0이면 완료 비트를 켠다.</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-sm12-finger-simple-onoff/ld_07.svg" alt="SM#1 / Stripping_Machine_1 / BasicControl Rung 52 변경 후: 선택된 센서 판단으로 완료 판단" width="1040">
</figure>


#### Finger 2: `Stripping_Machine_1 / BasicControl` 원본 Rung 53

변경 전:

```text
XIC(i_finger_2_down)XIO(i_finger_2_no_copper)OTE(f_finger2_separated);
```

<figure class="ld-rung" data-rung="53" data-rll="XIC(i_finger_2_down)XIO(i_finger_2_no_copper)OTE(f_finger2_separated);">
<div class="rung-meta"><span class="rung-meta-number">SM#1 / Stripping_Machine_1 / BasicControl Rung 53 변경 전: 실제 센서로 완료 판단</span><span class="rung-meta-description">Finger Down이 참이고 실제 No Copper 입력이 0이면 완료 비트를 켠다.</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-sm12-finger-simple-onoff/ld_08.svg" alt="SM#1 / Stripping_Machine_1 / BasicControl Rung 53 변경 전: 실제 센서로 완료 판단" width="1040">
</figure>

변경 후:

```text
XIC(i_finger_2_down)XIO(f_sm1_finger2_no_copper_used)OTE(f_finger2_separated);
```

<figure class="ld-rung" data-rung="53" data-rll="XIC(i_finger_2_down)XIO(f_sm1_finger2_no_copper_used)OTE(f_finger2_separated);">
<div class="rung-meta"><span class="rung-meta-number">SM#1 / Stripping_Machine_1 / BasicControl Rung 53 변경 후: 선택된 센서 판단으로 완료 판단</span><span class="rung-meta-description">Finger Down이 참이고 선택된 No Copper 판단값이 0이면 완료 비트를 켠다.</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-sm12-finger-simple-onoff/ld_09.svg" alt="SM#1 / Stripping_Machine_1 / BasicControl Rung 53 변경 후: 선택된 센서 판단으로 완료 판단" width="1040">
</figure>


### E. SFC Transition 두 곳을 교체한다

SFC를 열고 아래 Transition의 Condition 편집 창에서 조건 전체를 바꾼다. 이 식은 Ladder Neutral Text가 아니라 SFC의 BOOL 조건식이다. Step, Action, 화살표 연결과 `.DN`은 삭제하지 않는다.


#### `Stripping_Machine_1 / Finger1Separate / Tran_099`

`State_Lower_Finger1_001`(Finger 하강) 다음, `State_raise_finger1_001`(Finger 올림) 직전의 Transition이다. 센서가 No Copper라고 판단되거나 하강 Step 시간이 만료되면 올림·해머 재시도로 간다. 우회 ON이면 센서 때문에 들어가는 경로만 거짓이 되고 시간 만료 경로는 남는다.

변경 전:

```text
(i_finger_1_down and i_finger_1_no_copper) or State_Lower_Finger1_001.DN
```

변경 전 SFC 확대도: State_Lower_Finger1_001에서 State_raise_finger1_001으로 가는 조건이다. Action과 나머지 경로는 생략했다.

<div class="sfc-snippet" data-transition-id="15" data-transition-y="260" data-next-y="340">
<div class="sfc-step">State_Lower_Finger1_001</div>
<div class="sfc-transition"><b>Tran_099</b></div>
<code>(i_finger_1_down and i_finger_1_no_copper) or State_Lower_Finger1_001.DN</code>
<div class="sfc-step">State_raise_finger1_001</div>
</div>

변경 후:

```text
(i_finger_1_down and f_sm1_finger1_no_copper_used) or State_Lower_Finger1_001.DN
```

변경 후 SFC 확대도: State_Lower_Finger1_001에서 State_raise_finger1_001으로 가는 조건이다. Action과 나머지 경로는 생략했다.

<div class="sfc-snippet" data-transition-id="15" data-transition-y="260" data-next-y="340">
<div class="sfc-step">State_Lower_Finger1_001</div>
<div class="sfc-transition"><b>Tran_099</b></div>
<code>(i_finger_1_down and f_sm1_finger1_no_copper_used) or State_Lower_Finger1_001.DN</code>
<div class="sfc-step">State_raise_finger1_001</div>
</div>


#### `Stripping_Machine_1 / Finger2Separate / Tran_103`

`State_Lower_Finger_001`(Finger 하강) 다음, `State_raise_finger_001`(Finger 올림) 직전의 Transition이다. 센서가 No Copper라고 판단되거나 하강 Step 시간이 만료되면 올림·해머 재시도로 간다. 우회 ON이면 센서 때문에 들어가는 경로만 거짓이 되고 시간 만료 경로는 남는다.

변경 전:

```text
(i_finger_2_down and i_finger_2_no_copper) or State_Lower_Finger_001.DN
```

변경 전 SFC 확대도: State_Lower_Finger_001에서 State_raise_finger_001으로 가는 조건이다. Action과 나머지 경로는 생략했다.

<div class="sfc-snippet" data-transition-id="15" data-transition-y="280" data-next-y="400">
<div class="sfc-step">State_Lower_Finger_001</div>
<div class="sfc-transition"><b>Tran_103</b></div>
<code>(i_finger_2_down and i_finger_2_no_copper) or State_Lower_Finger_001.DN</code>
<div class="sfc-step">State_raise_finger_001</div>
</div>

변경 후:

```text
(i_finger_2_down and f_sm1_finger2_no_copper_used) or State_Lower_Finger_001.DN
```

변경 후 SFC 확대도: State_Lower_Finger_001에서 State_raise_finger_001으로 가는 조건이다. Action과 나머지 경로는 생략했다.

<div class="sfc-snippet" data-transition-id="15" data-transition-y="280" data-next-y="400">
<div class="sfc-step">State_Lower_Finger_001</div>
<div class="sfc-transition"><b>Tran_103</b></div>
<code>(i_finger_2_down and f_sm1_finger2_no_copper_used) or State_Lower_Finger_001.DN</code>
<div class="sfc-step">State_raise_finger_001</div>
</div>


## 5. SM#2 적용

대상은 `Stripping_Machine_2`이다. 아래 항목을 순서대로 적용한다.

### A. Local Tags를 먼저 만든다

`Stripping_Machine_2 → Parameters and Local Tags`에서 다음 BOOL 5개를 만든다. 모두 Base Tag, 초기값 0이다.

<div class="note-identifier-table" tabindex="0" role="region" aria-label="적용 정보 표, 좁은 화면에서는 좌우로 스크롤">
<table><thead><tr><th>태그</th><th>External Access</th><th>역할</th></tr></thead><tbody><tr><td><code>ui_i_sm2_finger_bypass</code></td><td>Read/Write</td><td>HMI가 ON=1, OFF=0을 쓰는 선택값이다.</td></tr><tr><td><code>f_sm2_finger_bypass</code></td><td>None</td><td>PLC가 이번 실행에 적용하는 우회 선택값이다.</td></tr><tr><td><code>f_sm2_finger1_no_copper_used</code></td><td>None</td><td>Finger 1 No Copper 판단값이다.</td></tr><tr><td><code>f_sm2_finger2_no_copper_used</code></td><td>None</td><td>Finger 2 No Copper 판단값이다.</td></tr><tr><td><code>ui_o_sm2_finger_bypass</code></td><td>Read Only</td><td>PLC가 적용한 우회 상태를 HMI에 알린다.</td></tr></tbody></table>
</div>

### B. 새 Ladder Routine을 만든다

`Stripping_Machine_2 → Routines → New Routine`에서 `SM2_FingerSimpleBypass`을 만들고 Type을 Ladder Diagram으로 선택한다. 새 Routine의 Rung 0~4에 아래 다섯 렁을 한 줄씩 입력한다. S:FS 초기화 → 선택 복사 → 센서 두 개 계산 → 표시 순서다.

```text
XIC(S:FS)OTU(ui_i_sm2_finger_bypass);
XIC(ui_i_sm2_finger_bypass)OTE(f_sm2_finger_bypass);
XIC(i_finger_1_no_copper)XIO(f_sm2_finger_bypass)OTE(f_sm2_finger1_no_copper_used);
XIC(i_finger_2_no_copper)XIO(f_sm2_finger_bypass)OTE(f_sm2_finger2_no_copper_used);
XIC(f_sm2_finger_bypass)OTE(ui_o_sm2_finger_bypass);
```


<figure class="ld-rung" data-rung="0" data-rll="XIC(S:FS)OTU(ui_i_sm2_finger_bypass);">
<div class="rung-meta"><span class="rung-meta-number">SM#2 / Stripping_Machine_2 / SM2_FingerSimpleBypass 추가 Rung 0</span><span class="rung-meta-description">Program 첫 실행에서 HMI 우회 선택을 OFF로 초기화한다.</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-sm12-finger-simple-onoff/ld_10.svg" alt="SM#2 / Stripping_Machine_2 / SM2_FingerSimpleBypass 추가 Rung 0" width="1040">
</figure>


<figure class="ld-rung" data-rung="1" data-rll="XIC(ui_i_sm2_finger_bypass)OTE(f_sm2_finger_bypass);">
<div class="rung-meta"><span class="rung-meta-number">SM#2 / Stripping_Machine_2 / SM2_FingerSimpleBypass 추가 Rung 1</span><span class="rung-meta-description">HMI ON/OFF 선택을 PLC 내부 우회 비트에 복사한다.</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-sm12-finger-simple-onoff/ld_11.svg" alt="SM#2 / Stripping_Machine_2 / SM2_FingerSimpleBypass 추가 Rung 1" width="1040">
</figure>


<figure class="ld-rung" data-rung="2" data-rll="XIC(i_finger_1_no_copper)XIO(f_sm2_finger_bypass)OTE(f_sm2_finger1_no_copper_used);">
<div class="rung-meta"><span class="rung-meta-number">SM#2 / Stripping_Machine_2 / SM2_FingerSimpleBypass 추가 Rung 2</span><span class="rung-meta-description">우회 OFF이면 실제 No Copper 입력을 사용하고 ON이면 판단값을 0으로 만든다.</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-sm12-finger-simple-onoff/ld_12.svg" alt="SM#2 / Stripping_Machine_2 / SM2_FingerSimpleBypass 추가 Rung 2" width="1040">
</figure>


<figure class="ld-rung" data-rung="3" data-rll="XIC(i_finger_2_no_copper)XIO(f_sm2_finger_bypass)OTE(f_sm2_finger2_no_copper_used);">
<div class="rung-meta"><span class="rung-meta-number">SM#2 / Stripping_Machine_2 / SM2_FingerSimpleBypass 추가 Rung 3</span><span class="rung-meta-description">우회 OFF이면 실제 No Copper 입력을 사용하고 ON이면 판단값을 0으로 만든다.</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-sm12-finger-simple-onoff/ld_13.svg" alt="SM#2 / Stripping_Machine_2 / SM2_FingerSimpleBypass 추가 Rung 3" width="1040">
</figure>


<figure class="ld-rung" data-rung="4" data-rll="XIC(f_sm2_finger_bypass)OTE(ui_o_sm2_finger_bypass);">
<div class="rung-meta"><span class="rung-meta-number">SM#2 / Stripping_Machine_2 / SM2_FingerSimpleBypass 추가 Rung 4</span><span class="rung-meta-description">PLC가 적용한 우회 상태를 HMI 표시 태그에 복사한다.</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-sm12-finger-simple-onoff/ld_14.svg" alt="SM#2 / Stripping_Machine_2 / SM2_FingerSimpleBypass 추가 Rung 4" width="1040">
</figure>


### C. MainRoutine의 가장 앞에 호출한다

`Stripping_Machine_2 → MainRoutine` 원본 Rung 0은 자동 또는 Single Cycle에서 `DoAutomatic`과 제품 추적을 실행한다. 그 **직전에 새 Rung 0을 추가**한다. 뒤에 붙이면 자동 SFC가 이전 판단값을 먼저 읽으므로 지정한 위치를 지킨다.

변경 전 원본 Rung 0:

```text
[XIC(z_mode_automatic) ,XIC(single_cycle) ]XIO(ui_i_test)[ONS(reset_ons) SFR(DoAutomatic,0) ,[JSR(DoAutomatic,0) ,XIO(single_cycle) JSR(prod_tracking,0) ] ];
```

변경 후 새 Rung 0:

```text
JSR(SM2_FingerSimpleBypass,0);
```

변경 후 Rung 1은 아래 원본을 그대로 유지한다:

```text
[XIC(z_mode_automatic) ,XIC(single_cycle) ]XIO(ui_i_test)[ONS(reset_ons) SFR(DoAutomatic,0) ,[JSR(DoAutomatic,0) ,XIO(single_cycle) JSR(prod_tracking,0) ] ];
```

<figure class="ld-rung" data-rung="0" data-rll="JSR(SM2_FingerSimpleBypass,0);">
<div class="rung-meta"><span class="rung-meta-number">SM#2 / Stripping_Machine_2 / MainRoutine 추가 Rung 0: 센서 판단을 먼저 계산한다</span><span class="rung-meta-description">자동 SFC보다 먼저 새 Routine을 실행해 이번 스캔의 센서 판단값을 계산한다.</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-sm12-finger-simple-onoff/ld_15.svg" alt="SM#2 / Stripping_Machine_2 / MainRoutine 추가 Rung 0: 센서 판단을 먼저 계산한다" width="1040">
</figure>


### D. BasicControl의 기존 완료 판단을 교체한다

해당 Finger가 내려가고 전기동이 감지된 것으로 판단할 때 `f_finger*_separated`를 켜는 렁이다. 기존 렁을 교체하며 같은 완료 태그에 OTE를 추가하지 않는다.


#### Finger 1: `Stripping_Machine_2 / BasicControl` 원본 Rung 51

변경 전:

```text
XIC(i_finger_1_down)XIO(i_finger_1_no_copper)OTE(f_finger1_separated);
```

<figure class="ld-rung" data-rung="51" data-rll="XIC(i_finger_1_down)XIO(i_finger_1_no_copper)OTE(f_finger1_separated);">
<div class="rung-meta"><span class="rung-meta-number">SM#2 / Stripping_Machine_2 / BasicControl Rung 51 변경 전: 실제 센서로 완료 판단</span><span class="rung-meta-description">Finger Down이 참이고 실제 No Copper 입력이 0이면 완료 비트를 켠다.</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-sm12-finger-simple-onoff/ld_16.svg" alt="SM#2 / Stripping_Machine_2 / BasicControl Rung 51 변경 전: 실제 센서로 완료 판단" width="1040">
</figure>

변경 후:

```text
XIC(i_finger_1_down)XIO(f_sm2_finger1_no_copper_used)OTE(f_finger1_separated);
```

<figure class="ld-rung" data-rung="51" data-rll="XIC(i_finger_1_down)XIO(f_sm2_finger1_no_copper_used)OTE(f_finger1_separated);">
<div class="rung-meta"><span class="rung-meta-number">SM#2 / Stripping_Machine_2 / BasicControl Rung 51 변경 후: 선택된 센서 판단으로 완료 판단</span><span class="rung-meta-description">Finger Down이 참이고 선택된 No Copper 판단값이 0이면 완료 비트를 켠다.</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-sm12-finger-simple-onoff/ld_17.svg" alt="SM#2 / Stripping_Machine_2 / BasicControl Rung 51 변경 후: 선택된 센서 판단으로 완료 판단" width="1040">
</figure>


#### Finger 2: `Stripping_Machine_2 / BasicControl` 원본 Rung 52

변경 전:

```text
XIC(i_finger_2_down)XIO(i_finger_2_no_copper)OTE(f_finger2_separated);
```

<figure class="ld-rung" data-rung="52" data-rll="XIC(i_finger_2_down)XIO(i_finger_2_no_copper)OTE(f_finger2_separated);">
<div class="rung-meta"><span class="rung-meta-number">SM#2 / Stripping_Machine_2 / BasicControl Rung 52 변경 전: 실제 센서로 완료 판단</span><span class="rung-meta-description">Finger Down이 참이고 실제 No Copper 입력이 0이면 완료 비트를 켠다.</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-sm12-finger-simple-onoff/ld_18.svg" alt="SM#2 / Stripping_Machine_2 / BasicControl Rung 52 변경 전: 실제 센서로 완료 판단" width="1040">
</figure>

변경 후:

```text
XIC(i_finger_2_down)XIO(f_sm2_finger2_no_copper_used)OTE(f_finger2_separated);
```

<figure class="ld-rung" data-rung="52" data-rll="XIC(i_finger_2_down)XIO(f_sm2_finger2_no_copper_used)OTE(f_finger2_separated);">
<div class="rung-meta"><span class="rung-meta-number">SM#2 / Stripping_Machine_2 / BasicControl Rung 52 변경 후: 선택된 센서 판단으로 완료 판단</span><span class="rung-meta-description">Finger Down이 참이고 선택된 No Copper 판단값이 0이면 완료 비트를 켠다.</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-sm12-finger-simple-onoff/ld_19.svg" alt="SM#2 / Stripping_Machine_2 / BasicControl Rung 52 변경 후: 선택된 센서 판단으로 완료 판단" width="1040">
</figure>


### E. SFC Transition 두 곳을 교체한다

SFC를 열고 아래 Transition의 Condition 편집 창에서 조건 전체를 바꾼다. 이 식은 Ladder Neutral Text가 아니라 SFC의 BOOL 조건식이다. Step, Action, 화살표 연결과 `.DN`은 삭제하지 않는다.


#### `Stripping_Machine_2 / Finger1Separate / Tran_155`

`State_Lower_Finger1_003`(Finger 하강) 다음, `State_raise_finger1_003`(Finger 올림) 직전의 Transition이다. 센서가 No Copper라고 판단되거나 하강 Step 시간이 만료되면 올림·해머 재시도로 간다. 우회 ON이면 센서 때문에 들어가는 경로만 거짓이 되고 시간 만료 경로는 남는다.

변경 전:

```text
(i_finger_1_down and i_finger_1_no_copper) or State_Lower_Finger1_003.DN
```

변경 전 SFC 확대도: State_Lower_Finger1_003에서 State_raise_finger1_003으로 가는 조건이다. Action과 나머지 경로는 생략했다.

<div class="sfc-snippet" data-transition-id="16" data-transition-y="260" data-next-y="400">
<div class="sfc-step">State_Lower_Finger1_003</div>
<div class="sfc-transition"><b>Tran_155</b></div>
<code>(i_finger_1_down and i_finger_1_no_copper) or State_Lower_Finger1_003.DN</code>
<div class="sfc-step">State_raise_finger1_003</div>
</div>

변경 후:

```text
(i_finger_1_down and f_sm2_finger1_no_copper_used) or State_Lower_Finger1_003.DN
```

변경 후 SFC 확대도: State_Lower_Finger1_003에서 State_raise_finger1_003으로 가는 조건이다. Action과 나머지 경로는 생략했다.

<div class="sfc-snippet" data-transition-id="16" data-transition-y="260" data-next-y="400">
<div class="sfc-step">State_Lower_Finger1_003</div>
<div class="sfc-transition"><b>Tran_155</b></div>
<code>(i_finger_1_down and f_sm2_finger1_no_copper_used) or State_Lower_Finger1_003.DN</code>
<div class="sfc-step">State_raise_finger1_003</div>
</div>


#### `Stripping_Machine_2 / Finger2Separate / Tran_160`

`State_Lower_Finger_003`(Finger 하강) 다음, `State_raise_finger_003`(Finger 올림) 직전의 Transition이다. 센서가 No Copper라고 판단되거나 하강 Step 시간이 만료되면 올림·해머 재시도로 간다. 우회 ON이면 센서 때문에 들어가는 경로만 거짓이 되고 시간 만료 경로는 남는다.

변경 전:

```text
(i_finger_2_down and i_finger_2_no_copper) or State_Lower_Finger_003.DN
```

변경 전 SFC 확대도: State_Lower_Finger_003에서 State_raise_finger_003으로 가는 조건이다. Action과 나머지 경로는 생략했다.

<div class="sfc-snippet" data-transition-id="17" data-transition-y="280" data-next-y="400">
<div class="sfc-step">State_Lower_Finger_003</div>
<div class="sfc-transition"><b>Tran_160</b></div>
<code>(i_finger_2_down and i_finger_2_no_copper) or State_Lower_Finger_003.DN</code>
<div class="sfc-step">State_raise_finger_003</div>
</div>

변경 후:

```text
(i_finger_2_down and f_sm2_finger2_no_copper_used) or State_Lower_Finger_003.DN
```

변경 후 SFC 확대도: State_Lower_Finger_003에서 State_raise_finger_003으로 가는 조건이다. Action과 나머지 경로는 생략했다.

<div class="sfc-snippet" data-transition-id="17" data-transition-y="280" data-next-y="400">
<div class="sfc-step">State_Lower_Finger_003</div>
<div class="sfc-transition"><b>Tran_160</b></div>
<code>(i_finger_2_down and f_sm2_finger2_no_copper_used) or State_Lower_Finger_003.DN</code>
<div class="sfc-step">State_raise_finger_003</div>
</div>


## 6. InTouch 버튼과 표시등

장비마다 ON 버튼과 OFF 버튼을 한 쌍으로 둔다. 두 버튼은 같은 PLC 선택 태그에 각각 1과 0을 한 번 쓴다. 누르고 있는 동안만 1인 Pushbutton 방식으로 만들면 안 된다. HMI 시작·화면 열기·통신 재접속 시 저장된 ON을 자동으로 다시 쓰는 스크립트도 넣지 않는다.

<div class="note-identifier-table" tabindex="0" role="region" aria-label="적용 정보 표, 좁은 화면에서는 좌우로 스크롤">
<table><thead><tr><th>InTouch 태그 이름</th><th>종류</th><th>PLC 연결 Item 예시</th></tr></thead><tbody><tr><td><code>ui_i_sm1_finger_bypass</code></td><td>I/O Discrete, 읽기/쓰기</td><td><code>Program:Stripping_Machine_1.ui_i_sm1_finger_bypass</code></td></tr><tr><td><code>ui_o_sm1_finger_bypass</code></td><td>I/O Discrete, 표시 전용</td><td><code>Program:Stripping_Machine_1.ui_o_sm1_finger_bypass</code></td></tr><tr><td><code>ui_i_sm2_finger_bypass</code></td><td>I/O Discrete, 읽기/쓰기</td><td><code>Program:Stripping_Machine_2.ui_i_sm2_finger_bypass</code></td></tr><tr><td><code>ui_o_sm2_finger_bypass</code></td><td>I/O Discrete, 표시 전용</td><td><code>Program:Stripping_Machine_2.ui_o_sm2_finger_bypass</code></td></tr></tbody></table>
</div>

Access Name은 기존 CATHODE 1 연결을 사용한다. 위 Item은 Logix Program Scope의 표준 표기 예시이며 현재 사용 중인 OI/DA 서버의 기존 Local Tag 연결 형식과 맞춘다. HMI의 Memory Discrete로 만들지 않는다.

버튼의 클릭 동작에 다음 대입을 각각 연결한다. 기존 프로젝트가 Discrete Set/Reset 애니메이션을 쓰면 같은 방식으로 구성해도 된다.

```text
SM#1 ON:  ui_i_sm1_finger_bypass = 1;
SM#1 OFF: ui_i_sm1_finger_bypass = 0;
SM#2 ON:  ui_i_sm2_finger_bypass = 1;
SM#2 OFF: ui_i_sm2_finger_bypass = 0;
```

실제 QuickScript 편집 창에는 `SM#1 ON:` 같은 설명을 제외하고 대입문 한 줄만 입력한다.

표시등은 입력 선택값이 아니라 `ui_o_sm*_finger_bypass`를 읽는다. 1이면 주황색 “Finger 센서 우회 중”, 0이면 “Finger 센서 사용”을 표시한다. 이는 우회 선택이 PLC에 적용됐다는 표시이며 실제 탈취 성공 표시가 아니다. 통신 불량 때는 마지막 표시를 정상 상태로 오해하지 않도록 기존 품질 표시를 적용한다.

## 7. SFC 동작을 오해하지 않기

ON이 모든 Step을 강제로 다음으로 넘기는 기능은 아니다. BasicControl에서는 Finger Down이 참이어야 완료 비트가 켜진다. SFC의 Lower → Raise 재시도 조건에서는 No Copper 쪽이 거짓이 되어 센서에 의한 불필요한 재시도를 막는다. 원래의 Step 시간 만료가 참이면 Raise로 갈 수 있다. `State_raise_finger*`와 해머 동작은 계속 존재한다.

OFF로 바꾸면 다음 전처리 실행에서 실제 센서값을 사용한다. 이미 내려간 Finger를 되돌리거나 실행된 Step을 취소하지는 않는다. 단순히 버튼이 켜졌다는 이유만으로 Carriage나 Flexbar를 움직이지 않는다.

## 8. 현장 적용 순서와 합격 기준

1. 장비를 정지하고 현재 프로그램을 보관한다. 원본과 위 Rung 및 SFC 조건을 대조한다.
2. SM#1 태그 5개와 새 Routine을 만들고, MainRoutine 연결·BasicControl 두 렁·SFC 두 조건을 한 세트로 적용한다. 중간 일부만 적용한 상태로 생산하지 않는다.
3. SM#2에도 별도 세트를 적용한다. 두 장비의 태그명과 Program Scope를 혼동하지 않는다.
4. Studio Verify에서 오류가 없는지 확인하고 Online Edit 상태를 확인한다. HMI 연결값을 읽고 쓸 수 있는지 점검한다.
5. OFF에서 실제 센서값과 used 값이 일치하는지 확인한다. 원본과 같은 정상 사이클이 가능한지 확인한다.
6. ON에서 실제 센서가 0이든 1이든 used 값이 0인지 확인한다. Finger Down=0이면 완료 비트가 0인지 확인한다.
7. SM#1 ON으로 SM#2가 바뀌지 않는지, 반대도 같은지 확인한다.
8. ON 상태로 Gate/Drop이 발생해도 선택이 유지되는지 확인한다. OFF 버튼을 눌러야 실제 센서로 돌아오는지 확인한다.
9. 승인된 정지 시험에서 Run 전환 시 OFF가 되는지 확인한다. 조업 중 이를 확인하려고 PLC 모드를 전환하지 않는다.

<div class="note-identifier-table" tabindex="0" role="region" aria-label="적용 정보 표, 좁은 화면에서는 좌우로 스크롤">
<table><thead><tr><th>시험</th><th>기대 결과</th></tr></thead><tbody><tr><td>OFF, 실제 No Copper=0, Down=1</td><td>used=0, 완료=1이다.</td></tr><tr><td>OFF, 실제 No Copper=1, Down=1</td><td>used=1, 완료=0이다.</td></tr><tr><td>ON, 실제 No Copper=0 또는 1, Down=1</td><td>used=0, 완료=1이다.</td></tr><tr><td>ON, Down=0</td><td>완료=0이다.</td></tr><tr><td>ON, SFC Lower Step.DN=0</td><td>No Copper 항에 의한 Raise 전이는 거짓이다.</td></tr><tr><td>ON, SFC Lower Step.DN=1</td><td>원본 시간 만료 경로는 참이다.</td></tr><tr><td>OFF 전환</td><td>다음 계산에서 원본 센서 판단으로 복귀한다.</td></tr></tbody></table>
</div>

## 9. 원본으로 복구하는 방법

장비를 정지하고 HMI OFF와 PLC 표시값 0을 확인한다. SM별 MainRoutine의 새 JSR 한 렁을 제거하고, BasicControl 두 렁과 SFC 두 조건을 이 문서의 변경 전 원문으로 복구한다. 새 Routine과 5개 태그는 참조가 남지 않았는지 확인한 뒤 정리한다. 원래 MainRoutine Rung 0의 SM#2 `XIO(ui_i_test)`를 빠뜨리지 않는다.

## 10. 검증 범위

원본의 두 Program에서 센서 Alias 주소, 완료 Rung, MainRoutine 원문과 SFC Transition 및 앞뒤 Step 연결을 추출해 대조했다. 논리 모의시험은 선택·실제 센서·Finger Down·Step.DN의 모든 조합에서 OFF 동등성과 ON 동작을 확인한다. 이 시험은 물리 장비 전체의 동작이나 현장 Studio Verify를 대신하지 않는다.

공식 문법 대조는 아래 기준으로 수행했다. Ladder Studio의 파싱 성공은 Rockwell 컴파일러의 Verify 성공과 다르다. 현장 버전에서 태그·Routine을 만든 뒤 Verify Controller를 통과해야 하며, HMI 연결과 실제 동작 시험은 별도로 진행한다. 기존 Retry 노트는 교체하지 않는다.

## 11. 공식 문법 검토 결과와 입력할 곳

검토일은 2026-10-02이다. 이번 추가·교체 로직에서 공식 문법과 충돌하는 부분은 발견하지 못했다. 아래 세 가지 입력 형식을 섞지 않는다.

<div class="note-identifier-table" tabindex="0" role="region" aria-label="적용 정보 표, 좁은 화면에서는 좌우로 스크롤">
<table><thead><tr><th>구분</th><th>입력할 곳</th><th>이번 문서의 형식</th></tr></thead><tbody><tr><td>Ladder Neutral Text</td><td>Ladder 렁의 ASCII/Text 편집 창</td><td><code>XIC(tag)XIO(tag)OTE(tag);</code>처럼 한 렁 끝에 세미콜론을 둔다.</td></tr><tr><td>SFC Transition</td><td>해당 Transition의 BOOL 조건 편집 창</td><td><code>(조건 AND 조건) OR Step.DN</code>이라는 식만 넣는다. 대입문이나 렁 문자열을 넣지 않는다.</td></tr><tr><td>ST Routine / SFC Action</td><td>이번 안에서는 추가·수정하지 않는다.</td><td>일반 ST 대입문은 <code>tag := 식;</code>이지만, 이 형태를 Transition 조건에 붙이지 않는다.</td></tr></tbody></table>
</div>

### Ladder 검토

`XIC`·`XIO`·`OTE`·`OTU`의 피연산자는 BOOL 태그이며, 이번에 추가한 태그도 모두 BOOL이다. `OTE()`처럼 목적지가 비어 있는 렁은 없다. 새 Routine을 부르는 JSR 앞에는 접점을 넣지 않아 매 실행마다 판단값을 계산한다. 접점 없는 JSR은 빈 렁이나 빈 OTE가 아니다. 렁 종료와 명령 형식은 [1756-RM014D, 209~221쪽](https://literature.rockwellautomation.com/idc/groups/literature/documents/rm/1756-rm014_-en-p.pdf#page=209)을 대조했다. 좌우 전원 흐름과 조건·출력 배치는 [1756-PM008, Ladder Diagram](https://literature.rockwellautomation.com/idc/groups/literature/documents/pm/1756-pm008_-en-p.pdf)을 기준으로 확인했다.

추가 JSR은 원본에 있는 무인수 호출 `JSR(BasicControl,0);`와 같은 내보내기 형식을 따른다. 그래픽 편집기로 입력한다면 Routine Name에 새 Routine을 선택하고 Input/Return Parameter는 추가하지 않는다. 텍스트의 `0`을 별도 Input Parameter 값으로 입력하지 않는다. 공식 명령 표는 인수 목록을 일반형으로 설명하므로, 현장 편집기의 텍스트 입력·Verify 결과까지 확인한다.

### SFC와 ST 검토

Transition에는 TRUE/FALSE를 반환하는 BOOL 식을 넣는다. 소문자 `and`·`or`, 괄호 묶음은 허용되는 ST 표현이다. 이번 식은 원본의 형태와 `.DN`을 유지하고 BOOL 센서 참조 하나만 교체한다. 독립 ST 대입문이 아니므로 `:=`, `IF`, `END_IF`, 대입문용 세미콜론을 추가하지 않는다. [1756-PM006L, 31쪽과 61쪽](https://literature.rockwellautomation.com/idc/groups/literature/documents/pm/1756-pm006_-en-p.pdf#page=61), [1756-PM007L, 10~11쪽·14쪽·17~18쪽](https://literature.rockwellautomation.com/idc/groups/literature/documents/pm/1756-pm007_-en-p.pdf#page=14)을 대조했다.

SFC 전체를 Neutral Text 한 줄로 붙여 넣는 작업은 아니다. 기존 Step·Action·연결은 그대로 두고 지정한 Transition의 조건만 교체한다. 조건 텍스트 영역을 더블클릭해 입력하고 Ctrl+Enter로 닫는다.

### 첫 실행 초기화와 Verify

`S:FS`는 새로 만드는 사용자 태그가 아니라 시스템 첫 실행 플래그다. Run 전환뿐 아니라 Program Inhibit 해제 뒤 첫 실행에서도 켜질 수 있다. 이번 Routine은 MainRoutine 맨 앞에서 호출하고 SFC Action에서 따로 호출하지 않는다. [Rockwell 공식 Math status flags](https://www.rockwellautomation.com/en-pr/docs/studio-5000-logix-designer/38-02/contents-ditamap/math-status-flags.html)를 대조했다.

문법·BOOL 논리 검토 통과를 현장 적용 완료로 해석하지 않는다. 실제 프로젝트에서 Verify Controller 오류 0건, 호출 위치, HMI 읽기/쓰기와 표시, OFF 원본 동등성, 위치 인터록 보존을 확인한 뒤 운전을 승인한다.


## 12. 게시본 검증 기록과 복사용 파일

2026-10-02에 LD 20개를 현재 Studio 렌더러로 변환했으며 파서 경고는 0건이다. 실제 추가 RLL을 읽는 제한된 스캔 모델에서 SM1/SM2 합계 256개 조합을 확인했다. 첫 실행 초기화, ON/OFF, 두 센서 입력과 Down 조건을 포함한다. SFC는 원본 식에서 센서 참조만 바뀌었는지와 BOOL 결과를 대조했다. 전체 SFC 스케줄링·실린더 이동·현장 컨트롤러 실행은 재현하지 않았다.

- [SM#1 새 Routine의 Rung 0~4 복사용 TXT](/images/notes/csm-sm12-finger-simple-onoff/sm1_new_routine.txt)
- [SM#2 새 Routine의 Rung 0~4 복사용 TXT](/images/notes/csm-sm12-finger-simple-onoff/sm2_new_routine.txt)
