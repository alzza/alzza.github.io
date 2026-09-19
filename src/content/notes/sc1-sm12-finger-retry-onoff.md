---
title: CSM SM#1·SM#2 Finger 센서 Retry 우회 현장 적용서
date: "2026-09-16"
excerpt: SM#1과 SM#2에서 탈취 Retry가 실제로 시작된 동안만 Finger No Copper 센서를 우회하고, 전기동이 Gate에 들어오면 자동으로 정상 센서 사용으로 복귀하는 LD·SFC·InTouch 적용 절차이다.
kicker: PLC
tags: ["PLC", "InTouch", "SC1", "SM1", "SM2", "Retry", "SFC"]
---

이 문서는 현장에서 Studio 5000과 InTouch를 처음 수정하는 사람도 위에서 아래로 따라갈 수 있도록 작성했다. SM#1과 SM#2는 서로 독립적으로 기능을 켜고 끈다. 기능을 ON으로 두어도 일반 자동 운전에서는 실제 Finger No Copper 센서를 사용한다.

실제 우회는 다음 조건을 모두 만족할 때만 켜진다.

1. HMI에서 해당 장비의 Retry 우회 기능을 ON으로 선택했다.
2. 자동 운전 상태에서 탈취 실패 플래그 `f_strip_failed=1`이 발생했다.
3. 실제 Retry Step이 실행 중이다. SM#1은 `State_Manual_Retry_001.X`, SM#2는 `State_Manual_Retry_003.X`이다.
4. Retry Step의 `f_auto_mode_manual_retry=1`이 켜져 있다.
5. 전기동이 아직 Gate에 들어오지 않았고 리젝트도 발생하지 않았다.

전기동이 Gate에 들어와 `f_copper_in_gate=1`이 되면 실제 우회 Active는 즉시 꺼진다. 리젝트가 발생하거나 Retry Step을 벗어나도 Active가 꺼진다. HMI의 기능 Enable은 OFF 버튼을 누를 때까지 유지되므로, 다음 Retry에서도 같은 정책을 사용한다.

> **수정 범위:** `BasicControl`의 LD, `Finger1Separate`와 `Finger2Separate`의 SFC Transition, InTouch 버튼과 표시등을 수정한다. 별도의 ST Routine, SFC Action, 물리 입력 Alias는 수정하지 않는다.

## 먼저 이해할 작동 흐름

<section class="retry-flow" aria-label="Finger No Copper Retry 우회 작동 흐름">
  <div class="retry-flow-track">
    <div class="retry-flow-step"><b>기능 ON</b><span>Enable=1</span><small>일반 운전에서는 실제 센서를 사용한다.</small></div>
    <span class="retry-flow-arrow" aria-hidden="true">→</span>
    <div class="retry-flow-step retry-flow-alert"><b>탈취 실패</b><span><code>f_strip_failed=1</code></span><small>이 플래그가 Retry 진입을 연다.</small></div>
    <span class="retry-flow-arrow" aria-hidden="true">→</span>
    <div class="retry-flow-step"><b>실제 Retry</b><span>SM#1: <code>_001.X</code></span><span>SM#2: <code>_003.X</code></span></div>
    <span class="retry-flow-arrow" aria-hidden="true">→</span>
    <div class="retry-flow-step retry-flow-active"><b>센서 우회 중</b><span>Active=1</span><small>No Copper만 우회하고 Finger Down은 계속 확인한다.</small></div>
    <span class="retry-flow-arrow" aria-hidden="true">→</span>
    <div class="retry-flow-step retry-flow-done"><b>Gate 진입</b><span><code>f_copper_in_gate=1</code></span><small>Active=0으로 바뀌고 실제 센서 사용으로 복귀한다.</small></div>
  </div>
  <p class="retry-flow-note"><b>중단 조건:</b> <code>f_reject_cathode=1</code>이 되거나 실제 Retry Step의 <code>.X</code>가 0이 되어도 Active가 꺼진다.</p>
</section>

[전체 동작 흐름을 큰 화면으로 보기](/diagrams/sc1-sm12-finger-retry-bypass.html)

| 운전 상태 | Enable | Active | Finger No Copper 판정 |
|---|---:|---:|---|
| 일반 자동 운전 | 0 또는 1 | 0 | 실제 센서를 사용한다. |
| 탈취 실패만 발생하고 Retry Step에 들어가기 전 | 1 | 0 | 실제 센서를 사용한다. |
| 실제 Retry Step 실행 중 | 1 | 1 | No Copper 입력만 우회한다. Finger Down은 확인한다. |
| Gate 진입, 리젝트, Retry Step 이탈 | 1 | 0 | 실제 센서 사용으로 복귀한다. |
| HMI에서 기능 OFF | 0 | 0 | 항상 실제 센서를 사용한다. |

## 적용 전에 준비할 것

1. 현재 운전 중인 ACD를 날짜와 시간을 붙여 백업한다.
2. Controller에서 최신 L5X를 내보내 별도로 보관한다.
3. SM#1과 SM#2를 정지하고, 승인된 무부하 시험 조건을 만든다.
4. 입력 `i_finger_1_no_copper`, `i_finger_2_no_copper`, `i_finger_1_down`, `i_finger_2_down`의 실제 극성을 Online에서 기록한다.
5. 아래 원본 Rung과 SFC Transition이 현장 ACD에도 같은지 확인한다. 다르면 번호만 보고 수정하지 말고 작업을 중단한다.

## 태그부터 만든다

태그는 Controller Scope가 아니라 각 장비의 **Program Scope**에 만든다. SM#1은 `Stripping_Machine_1`, SM#2는 `Stripping_Machine_2`의 `Parameters and Local Tags`에서 만든다. Program Scope가 이미 분리되어 있어도 태그 이름에 `sm1` 또는 `sm2`를 넣는다. 따라서 Cross Reference와 InTouch Item을 볼 때 어느 장비의 태그인지 바로 알 수 있다.

### SM#1 태그 생성 위치

`Controller Organizer → Tasks → MainTask → Stripping_Machine_1 → Parameters and Local Tags`

### SM#2 태그 생성 위치

`Controller Organizer → Tasks → MainTask → Stripping_Machine_2 → Parameters and Local Tags`

두 Program에 각각 8개 태그를 만든다. 기존 프로그램의 이름 규칙에 맞춰 HMI 입력은 `ui_i_`, HMI 출력은 `ui_o_`, 내부 상태 BOOL은 `f_`로 시작한다. ONS 저장 비트는 기존 `strip_failed_ons`처럼 `_ons`로 끝낸다.

#### SM#1에 만들 태그

| 태그 | 형식 | External Access | 역할 |
|---|---|---|---|
| `ui_i_sm1_finger_retry_bypass_on` | BOOL | Read/Write | InTouch의 SM#1 ON 순간 요청이다. |
| `ui_i_sm1_finger_retry_bypass_off` | BOOL | Read/Write | InTouch의 SM#1 OFF 순간 요청이다. |
| `ui_o_sm1_finger_retry_bypass_enabled` | BOOL | Read Only | HMI에 SM#1 기능 선택 ON 상태를 표시한다. |
| `ui_o_sm1_finger_retry_bypass_active` | BOOL | Read Only | HMI에 SM#1 실제 센서 우회 중 상태를 표시한다. |
| `f_sm1_finger_retry_bypass_enable` | BOOL | None | PLC가 기억하는 SM#1 기능 ON/OFF 상태이다. |
| `f_sm1_finger_retry_bypass_active` | BOOL | None | SM#1의 실제 Retry 중에만 켜지는 내부 우회 상태이다. |
| `sm1_finger_retry_bypass_on_ons` | BOOL | None | SM#1 ON 버튼의 ONS 저장 비트이다. |
| `sm1_finger_retry_bypass_off_ons` | BOOL | None | SM#1 OFF 버튼의 ONS 저장 비트이다. |

#### SM#2에 만들 태그

| 태그 | 형식 | External Access | 역할 |
|---|---|---|---|
| `ui_i_sm2_finger_retry_bypass_on` | BOOL | Read/Write | InTouch의 SM#2 ON 순간 요청이다. |
| `ui_i_sm2_finger_retry_bypass_off` | BOOL | Read/Write | InTouch의 SM#2 OFF 순간 요청이다. |
| `ui_o_sm2_finger_retry_bypass_enabled` | BOOL | Read Only | HMI에 SM#2 기능 선택 ON 상태를 표시한다. |
| `ui_o_sm2_finger_retry_bypass_active` | BOOL | Read Only | HMI에 SM#2 실제 센서 우회 중 상태를 표시한다. |
| `f_sm2_finger_retry_bypass_enable` | BOOL | None | PLC가 기억하는 SM#2 기능 ON/OFF 상태이다. |
| `f_sm2_finger_retry_bypass_active` | BOOL | None | SM#2의 실제 Retry 중에만 켜지는 내부 우회 상태이다. |
| `sm2_finger_retry_bypass_on_ons` | BOOL | None | SM#2 ON 버튼의 ONS 저장 비트이다. |
| `sm2_finger_retry_bypass_off_ons` | BOOL | None | SM#2 OFF 버튼의 ONS 저장 비트이다. |

모든 BOOL의 초기값은 0으로 둔다. `ui_`로 시작하는 태그만 HMI가 직접 사용한다. `f_` 태그와 `_ons`로 끝나는 태그는 PLC 내부에서만 사용한다.

## SM#1 LD를 추가한다

### 추가 위치를 찾는다

1. `Programs → Stripping_Machine_1 → Routines → BasicControl`을 연다.
2. 수정 전 Rung 46을 찾는다.
3. 원본이 다음과 같은지 확인한다.

```text
XIO(i_copper_not_in_gate_right)XIO(i_copper_not_in_gate_left)OTE(f_copper_in_gate);
```

4. 이 Rung 바로 다음, 원본 Rung 47의 `f_copper_on_pinch_roll` 로직보다 앞에 새 Rung 6개를 순서대로 넣는다.

### 복사해서 넣을 SM#1 RLL

```text
XIC(ui_i_sm1_finger_retry_bypass_on)ONS(sm1_finger_retry_bypass_on_ons)OTL(f_sm1_finger_retry_bypass_enable);
XIC(ui_i_sm1_finger_retry_bypass_off)ONS(sm1_finger_retry_bypass_off_ons)OTU(f_sm1_finger_retry_bypass_enable);
XIC(S:FS)OTU(f_sm1_finger_retry_bypass_enable);
XIC(f_sm1_finger_retry_bypass_enable)XIC(z_mode_automatic)XIC(f_strip_failed)XIC(State_Manual_Retry_001.X)XIC(f_auto_mode_manual_retry)XIO(f_copper_in_gate)XIO(f_reject_cathode)OTE(f_sm1_finger_retry_bypass_active);
XIC(f_sm1_finger_retry_bypass_enable)OTE(ui_o_sm1_finger_retry_bypass_enabled);
XIC(f_sm1_finger_retry_bypass_active)OTE(ui_o_sm1_finger_retry_bypass_active);
```

### SM#1 추가 LD

<figure class="ld-rung" data-rung="47" data-rll="XIC(ui_i_sm1_finger_retry_bypass_on)ONS(sm1_finger_retry_bypass_on_ons)OTL(f_sm1_finger_retry_bypass_enable);">
<div class="rung-meta"><span class="rung-meta-number">추가 Rung 47</span><span class="rung-status ok">ON 저장</span></div>
<img src="/images/notes/sc1-sm-finger-retry-onoff/sm1_add_01.svg" alt="SM#1 기능 ON 저장 LD" width="929" height="126">
</figure>

<figure class="ld-rung" data-rung="48" data-rll="XIC(ui_i_sm1_finger_retry_bypass_off)ONS(sm1_finger_retry_bypass_off_ons)OTU(f_sm1_finger_retry_bypass_enable);">
<div class="rung-meta"><span class="rung-meta-number">추가 Rung 48</span><span class="rung-status ok">OFF 저장</span></div>
<img src="/images/notes/sc1-sm-finger-retry-onoff/sm1_add_02.svg" alt="SM#1 기능 OFF 저장 LD" width="943" height="126">
</figure>

<figure class="ld-rung" data-rung="49" data-rll="XIC(S:FS)OTU(f_sm1_finger_retry_bypass_enable);">
<div class="rung-meta"><span class="rung-meta-number">추가 Rung 49</span><span class="rung-status ok">첫 스캔 OFF</span></div>
<img src="/images/notes/sc1-sm-finger-retry-onoff/sm1_add_03.svg" alt="SM#1 첫 스캔 기능 OFF LD" width="920" height="126">
</figure>

<figure class="ld-rung" data-rung="50" data-rll="XIC(f_sm1_finger_retry_bypass_enable)XIC(z_mode_automatic)XIC(f_strip_failed)XIC(State_Manual_Retry_001.X)XIC(f_auto_mode_manual_retry)XIO(f_copper_in_gate)XIO(f_reject_cathode)OTE(f_sm1_finger_retry_bypass_active);">
<div class="rung-meta"><span class="rung-meta-number">추가 Rung 50</span><span class="rung-status ok">Retry Active</span></div>
<img src="/images/notes/sc1-sm-finger-retry-onoff/sm1_add_04.svg" alt="SM#1 Retry 센서 우회 Active LD" width="1806" height="126">
</figure>

<figure class="ld-rung" data-rung="51" data-rll="XIC(f_sm1_finger_retry_bypass_enable)OTE(ui_o_sm1_finger_retry_bypass_enabled);">
<div class="rung-meta"><span class="rung-meta-number">추가 Rung 51</span><span class="rung-status ok">HMI Enable 표시</span></div>
<img src="/images/notes/sc1-sm-finger-retry-onoff/sm1_add_05.svg" alt="SM#1 HMI 기능 선택 표시 LD" width="920" height="126">
</figure>

<figure class="ld-rung" data-rung="52" data-rll="XIC(f_sm1_finger_retry_bypass_active)OTE(ui_o_sm1_finger_retry_bypass_active);">
<div class="rung-meta"><span class="rung-meta-number">추가 Rung 52</span><span class="rung-status ok">HMI Active 표시</span></div>
<img src="/images/notes/sc1-sm-finger-retry-onoff/sm1_add_06.svg" alt="SM#1 HMI 실제 우회 표시 LD" width="920" height="126">
</figure>

ON과 OFF가 같은 스캔에 들어오면 뒤에 있는 OFF Rung이 우선한다. `S:FS` Rung은 Controller가 Run으로 들어오는 첫 스캔에 기능 Enable을 0으로 만든다.

## SM#2 LD를 추가한다

### 추가 위치를 찾는다

1. `Programs → Stripping_Machine_2 → Routines → BasicControl`을 연다.
2. 수정 전 Rung 45를 찾는다.
3. 원본이 다음과 같은지 확인한다.

```text
XIO(i_copper_not_in_gate_left)XIO(i_copper_not_in_gate_right)OTE(f_copper_in_gate);
```

4. 이 Rung 바로 다음, 원본 Rung 46의 `f_copper_on_pinch_roll` 로직보다 앞에 새 Rung 6개를 순서대로 넣는다.

### 복사해서 넣을 SM#2 RLL

```text
XIC(ui_i_sm2_finger_retry_bypass_on)ONS(sm2_finger_retry_bypass_on_ons)OTL(f_sm2_finger_retry_bypass_enable);
XIC(ui_i_sm2_finger_retry_bypass_off)ONS(sm2_finger_retry_bypass_off_ons)OTU(f_sm2_finger_retry_bypass_enable);
XIC(S:FS)OTU(f_sm2_finger_retry_bypass_enable);
XIC(f_sm2_finger_retry_bypass_enable)XIC(z_mode_automatic)XIC(f_strip_failed)XIC(State_Manual_Retry_003.X)XIC(f_auto_mode_manual_retry)XIO(f_copper_in_gate)XIO(f_reject_cathode)OTE(f_sm2_finger_retry_bypass_active);
XIC(f_sm2_finger_retry_bypass_enable)OTE(ui_o_sm2_finger_retry_bypass_enabled);
XIC(f_sm2_finger_retry_bypass_active)OTE(ui_o_sm2_finger_retry_bypass_active);
```

### SM#2 추가 LD

<figure class="ld-rung" data-rung="46" data-rll="XIC(ui_i_sm2_finger_retry_bypass_on)ONS(sm2_finger_retry_bypass_on_ons)OTL(f_sm2_finger_retry_bypass_enable);">
<div class="rung-meta"><span class="rung-meta-number">추가 Rung 46</span><span class="rung-status ok">ON 저장</span></div>
<img src="/images/notes/sc1-sm-finger-retry-onoff/sm2_add_01.svg" alt="SM#2 기능 ON 저장 LD" width="929" height="126">
</figure>

<figure class="ld-rung" data-rung="47" data-rll="XIC(ui_i_sm2_finger_retry_bypass_off)ONS(sm2_finger_retry_bypass_off_ons)OTU(f_sm2_finger_retry_bypass_enable);">
<div class="rung-meta"><span class="rung-meta-number">추가 Rung 47</span><span class="rung-status ok">OFF 저장</span></div>
<img src="/images/notes/sc1-sm-finger-retry-onoff/sm2_add_02.svg" alt="SM#2 기능 OFF 저장 LD" width="943" height="126">
</figure>

<figure class="ld-rung" data-rung="48" data-rll="XIC(S:FS)OTU(f_sm2_finger_retry_bypass_enable);">
<div class="rung-meta"><span class="rung-meta-number">추가 Rung 48</span><span class="rung-status ok">첫 스캔 OFF</span></div>
<img src="/images/notes/sc1-sm-finger-retry-onoff/sm2_add_03.svg" alt="SM#2 첫 스캔 기능 OFF LD" width="920" height="126">
</figure>

<figure class="ld-rung" data-rung="49" data-rll="XIC(f_sm2_finger_retry_bypass_enable)XIC(z_mode_automatic)XIC(f_strip_failed)XIC(State_Manual_Retry_003.X)XIC(f_auto_mode_manual_retry)XIO(f_copper_in_gate)XIO(f_reject_cathode)OTE(f_sm2_finger_retry_bypass_active);">
<div class="rung-meta"><span class="rung-meta-number">추가 Rung 49</span><span class="rung-status ok">Retry Active</span></div>
<img src="/images/notes/sc1-sm-finger-retry-onoff/sm2_add_04.svg" alt="SM#2 Retry 센서 우회 Active LD" width="1806" height="126">
</figure>

<figure class="ld-rung" data-rung="50" data-rll="XIC(f_sm2_finger_retry_bypass_enable)OTE(ui_o_sm2_finger_retry_bypass_enabled);">
<div class="rung-meta"><span class="rung-meta-number">추가 Rung 50</span><span class="rung-status ok">HMI Enable 표시</span></div>
<img src="/images/notes/sc1-sm-finger-retry-onoff/sm2_add_05.svg" alt="SM#2 HMI 기능 선택 표시 LD" width="920" height="126">
</figure>

<figure class="ld-rung" data-rung="51" data-rll="XIC(f_sm2_finger_retry_bypass_active)OTE(ui_o_sm2_finger_retry_bypass_active);">
<div class="rung-meta"><span class="rung-meta-number">추가 Rung 51</span><span class="rung-status ok">HMI Active 표시</span></div>
<img src="/images/notes/sc1-sm-finger-retry-onoff/sm2_add_06.svg" alt="SM#2 HMI 실제 우회 표시 LD" width="920" height="126">
</figure>

SM#2의 Active Rung에는 반드시 `State_Manual_Retry_003.X`를 사용한다. SM#1의 `_001.X`를 복사한 채 남기면 SM#2 우회가 정상적으로 켜지지 않는다.

## Finger 완료 Rung을 변경한다

추가 Rung을 넣으면 뒤쪽 Rung 번호가 다시 매겨진다. 아래 번호는 **수정 전 원본 번호**이다. 번호보다 출력 태그 `f_finger1_separated`, `f_finger2_separated`와 원본 RLL을 먼저 확인한다.

### SM#1 Finger 1: 수정 전과 수정 후

대상은 `Stripping_Machine_1 → BasicControl`의 수정 전 Rung 52이다.

```text
XIC(i_finger_1_down)XIO(i_finger_1_no_copper)OTE(f_finger1_separated);
```

<figure class="ld-rung" data-rung="52" data-rll="XIC(i_finger_1_down)XIO(i_finger_1_no_copper)OTE(f_finger1_separated);">
<div class="rung-meta"><span class="rung-meta-number">수정 전 Rung 52</span><span class="rung-status ok">원본</span></div>
<img src="/images/notes/sc1-sm-finger-retry-onoff/sm1_f1_before.svg" alt="SM#1 Finger 1 수정 전 LD" width="920" height="126">
</figure>

```text
XIC(i_finger_1_down)[XIO(i_finger_1_no_copper),XIC(f_sm1_finger_retry_bypass_active)]OTE(f_finger1_separated);
```

<figure class="ld-rung" data-rung="58" data-rll="XIC(i_finger_1_down)[XIO(i_finger_1_no_copper),XIC(f_sm1_finger_retry_bypass_active)]OTE(f_finger1_separated);">
<div class="rung-meta"><span class="rung-meta-number">수정 후 위치 예상 Rung 58</span><span class="rung-status ok">변경</span></div>
<img src="/images/notes/sc1-sm-finger-retry-onoff/sm1_f1_after.svg" alt="SM#1 Finger 1 수정 후 LD" width="920" height="286">
</figure>

### SM#1 Finger 2: 수정 전과 수정 후

대상은 같은 Routine의 수정 전 Rung 53이다.

```text
XIC(i_finger_2_down)XIO(i_finger_2_no_copper)OTE(f_finger2_separated);
```

<figure class="ld-rung" data-rung="53" data-rll="XIC(i_finger_2_down)XIO(i_finger_2_no_copper)OTE(f_finger2_separated);">
<div class="rung-meta"><span class="rung-meta-number">수정 전 Rung 53</span><span class="rung-status ok">원본</span></div>
<img src="/images/notes/sc1-sm-finger-retry-onoff/sm1_f2_before.svg" alt="SM#1 Finger 2 수정 전 LD" width="920" height="126">
</figure>

```text
XIC(i_finger_2_down)[XIO(i_finger_2_no_copper),XIC(f_sm1_finger_retry_bypass_active)]OTE(f_finger2_separated);
```

<figure class="ld-rung" data-rung="59" data-rll="XIC(i_finger_2_down)[XIO(i_finger_2_no_copper),XIC(f_sm1_finger_retry_bypass_active)]OTE(f_finger2_separated);">
<div class="rung-meta"><span class="rung-meta-number">수정 후 위치 예상 Rung 59</span><span class="rung-status ok">변경</span></div>
<img src="/images/notes/sc1-sm-finger-retry-onoff/sm1_f2_after.svg" alt="SM#1 Finger 2 수정 후 LD" width="920" height="286">
</figure>

### SM#2 Finger 1: 수정 전과 수정 후

대상은 `Stripping_Machine_2 → BasicControl`의 수정 전 Rung 51이다.

```text
XIC(i_finger_1_down)XIO(i_finger_1_no_copper)OTE(f_finger1_separated);
```

<figure class="ld-rung" data-rung="51" data-rll="XIC(i_finger_1_down)XIO(i_finger_1_no_copper)OTE(f_finger1_separated);">
<div class="rung-meta"><span class="rung-meta-number">수정 전 Rung 51</span><span class="rung-status ok">원본</span></div>
<img src="/images/notes/sc1-sm-finger-retry-onoff/sm2_f1_before.svg" alt="SM#2 Finger 1 수정 전 LD" width="920" height="126">
</figure>

```text
XIC(i_finger_1_down)[XIO(i_finger_1_no_copper),XIC(f_sm2_finger_retry_bypass_active)]OTE(f_finger1_separated);
```

<figure class="ld-rung" data-rung="57" data-rll="XIC(i_finger_1_down)[XIO(i_finger_1_no_copper),XIC(f_sm2_finger_retry_bypass_active)]OTE(f_finger1_separated);">
<div class="rung-meta"><span class="rung-meta-number">수정 후 위치 예상 Rung 57</span><span class="rung-status ok">변경</span></div>
<img src="/images/notes/sc1-sm-finger-retry-onoff/sm2_f1_after.svg" alt="SM#2 Finger 1 수정 후 LD" width="920" height="286">
</figure>

### SM#2 Finger 2: 수정 전과 수정 후

대상은 같은 Routine의 수정 전 Rung 52이다.

```text
XIC(i_finger_2_down)XIO(i_finger_2_no_copper)OTE(f_finger2_separated);
```

<figure class="ld-rung" data-rung="52" data-rll="XIC(i_finger_2_down)XIO(i_finger_2_no_copper)OTE(f_finger2_separated);">
<div class="rung-meta"><span class="rung-meta-number">수정 전 Rung 52</span><span class="rung-status ok">원본</span></div>
<img src="/images/notes/sc1-sm-finger-retry-onoff/sm2_f2_before.svg" alt="SM#2 Finger 2 수정 전 LD" width="920" height="126">
</figure>

```text
XIC(i_finger_2_down)[XIO(i_finger_2_no_copper),XIC(f_sm2_finger_retry_bypass_active)]OTE(f_finger2_separated);
```

<figure class="ld-rung" data-rung="58" data-rll="XIC(i_finger_2_down)[XIO(i_finger_2_no_copper),XIC(f_sm2_finger_retry_bypass_active)]OTE(f_finger2_separated);">
<div class="rung-meta"><span class="rung-meta-number">수정 후 위치 예상 Rung 58</span><span class="rung-status ok">변경</span></div>
<img src="/images/notes/sc1-sm-finger-retry-onoff/sm2_f2_after.svg" alt="SM#2 Finger 2 수정 후 LD" width="920" height="286">
</figure>

이 변경은 No Copper 조건만 우회한다. `i_finger_1_down`과 `i_finger_2_down`은 우회하지 않으므로 Finger가 실제로 내려오지 않으면 완료 비트가 켜지지 않는다.

## SFC Transition을 변경한다

### 왜 SFC도 바꾸는가

`BasicControl`의 완료 Rung만 바꾸면 `f_finger*_separated`는 우회할 수 있지만, `Finger1Separate`와 `Finger2Separate` SFC가 물리 `i_finger_*_no_copper` 입력을 직접 읽는 경로가 남는다. 이 경로가 남으면 센서 입력에 따라 `Finger Lower → Finger Raise → Hammer Trial` 고리가 계속 진행될 수 있다.

SFC Transition의 조건은 문자식으로 입력하므로 L5X 안에서는 `<STContent>`로 저장된다. 그러나 Studio 5000에서 수정할 곳은 별도의 ST Routine이 아니라 SFC 화면의 Transition 조건이다.

### Studio 5000에서 수정하는 방법

1. 대상 Program 아래 `Routines`에서 `Finger1Separate` 또는 `Finger2Separate`를 연다.
2. 아래 표의 `State_Lower...` Step 바로 아래에 있는 Transition 막대를 찾는다.
3. Transition 이름을 확인한 뒤 더블 클릭한다.
4. 기존 조건 전체를 복사해 별도 메모장에 보관한다.
5. 변경 후 조건을 붙여 넣고 Accept Edits와 Verify Routine을 실행한다.

| 장비 | Routine | 앞 Step | Transition | 다음 Step |
|---|---|---|---|---|
| SM#1 | `Finger1Separate` | `State_Lower_Finger1_001` | `Tran_099` | `State_raise_finger1_001` |
| SM#1 | `Finger2Separate` | `State_Lower_Finger_001` | `Tran_103` | `State_raise_finger_001` |
| SM#2 | `Finger1Separate` | `State_Lower_Finger1_003` | `Tran_155` | `State_raise_finger1_003` |
| SM#2 | `Finger2Separate` | `State_Lower_Finger_003` | `Tran_160` | `State_raise_finger_003` |

### Studio 렌더러로 본 SFC Transition 수정 전·후

아래 그림은 각 SFC Routine에서 바뀌는 Step, Transition, 다음 Step만 확대해 보여준다. 원본 L5X의 Step 간격과 Transition 이름을 사용하며, Action과 나머지 SFC 경로는 이 확대도에서 생략했다. 수정 후 그림은 아래에 적은 변경 조건을 적용했을 때의 예상 모습이다.

<div class="sfc-compare-grid">
  <section class="sfc-panel"><h3>SM#1 Finger 1: 수정 전</h3><div class="sfc-sheet"><div class="sfc-step">State_Lower_Finger1_001</div><div class="sfc-wire"></div><div class="sfc-transition"><span></span><b>Tran_099</b></div><code>(i_finger_1_down AND i_finger_1_no_copper) OR State_Lower_Finger1_001.DN</code><div class="sfc-wire"></div><div class="sfc-step">State_raise_finger1_001</div></div></section>
  <section class="sfc-panel sfc-panel-after"><h3>SM#1 Finger 1: 수정 후</h3><div class="sfc-sheet"><div class="sfc-step">State_Lower_Finger1_001</div><div class="sfc-wire"></div><div class="sfc-transition"><span></span><b>Tran_099</b></div><code>(i_finger_1_down AND i_finger_1_no_copper AND NOT f_sm1_finger_retry_bypass_active) OR State_Lower_Finger1_001.DN</code><div class="sfc-wire"></div><div class="sfc-step">State_raise_finger1_001</div></div></section>
</div>

<div class="sfc-compare-grid">
  <section class="sfc-panel"><h3>SM#1 Finger 2: 수정 전</h3><div class="sfc-sheet"><div class="sfc-step">State_Lower_Finger_001</div><div class="sfc-wire"></div><div class="sfc-transition"><span></span><b>Tran_103</b></div><code>(i_finger_2_down AND i_finger_2_no_copper) OR State_Lower_Finger_001.DN</code><div class="sfc-wire"></div><div class="sfc-step">State_raise_finger_001</div></div></section>
  <section class="sfc-panel sfc-panel-after"><h3>SM#1 Finger 2: 수정 후</h3><div class="sfc-sheet"><div class="sfc-step">State_Lower_Finger_001</div><div class="sfc-wire"></div><div class="sfc-transition"><span></span><b>Tran_103</b></div><code>(i_finger_2_down AND i_finger_2_no_copper AND NOT f_sm1_finger_retry_bypass_active) OR State_Lower_Finger_001.DN</code><div class="sfc-wire"></div><div class="sfc-step">State_raise_finger_001</div></div></section>
</div>

<div class="sfc-compare-grid">
  <section class="sfc-panel"><h3>SM#2 Finger 1: 수정 전</h3><div class="sfc-sheet"><div class="sfc-step">State_Lower_Finger1_003</div><div class="sfc-wire"></div><div class="sfc-transition"><span></span><b>Tran_155</b></div><code>(i_finger_1_down AND i_finger_1_no_copper) OR State_Lower_Finger1_003.DN</code><div class="sfc-wire"></div><div class="sfc-step">State_raise_finger1_003</div></div></section>
  <section class="sfc-panel sfc-panel-after"><h3>SM#2 Finger 1: 수정 후</h3><div class="sfc-sheet"><div class="sfc-step">State_Lower_Finger1_003</div><div class="sfc-wire"></div><div class="sfc-transition"><span></span><b>Tran_155</b></div><code>(i_finger_1_down AND i_finger_1_no_copper AND NOT f_sm2_finger_retry_bypass_active) OR State_Lower_Finger1_003.DN</code><div class="sfc-wire"></div><div class="sfc-step">State_raise_finger1_003</div></div></section>
</div>

<div class="sfc-compare-grid">
  <section class="sfc-panel"><h3>SM#2 Finger 2: 수정 전</h3><div class="sfc-sheet"><div class="sfc-step">State_Lower_Finger_003</div><div class="sfc-wire"></div><div class="sfc-transition"><span></span><b>Tran_160</b></div><code>(i_finger_2_down AND i_finger_2_no_copper) OR State_Lower_Finger_003.DN</code><div class="sfc-wire"></div><div class="sfc-step">State_raise_finger_003</div></div></section>
  <section class="sfc-panel sfc-panel-after"><h3>SM#2 Finger 2: 수정 후</h3><div class="sfc-sheet"><div class="sfc-step">State_Lower_Finger_003</div><div class="sfc-wire"></div><div class="sfc-transition"><span></span><b>Tran_160</b></div><code>(i_finger_2_down AND i_finger_2_no_copper AND NOT f_sm2_finger_retry_bypass_active) OR State_Lower_Finger_003.DN</code><div class="sfc-wire"></div><div class="sfc-step">State_raise_finger_003</div></div></section>
</div>

변경 후에도 각 Step의 `.DN` 조건은 그대로 남긴다. 우회 Active 동안 No Copper 입력이 재시도 고리를 바로 진행시키는 것만 막는다. Finger가 실제로 내려오지 않아 완료 비트가 생기지 않는 경우에는 기존 Step 타임아웃 경로가 남아 있으므로 SFC가 무기한 멈추지 않는다.

### 복사해서 넣을 SFC Transition 조건

```text
SM#1 Finger1Separate / Tran_099
(i_finger_1_down AND i_finger_1_no_copper AND NOT f_sm1_finger_retry_bypass_active) OR State_Lower_Finger1_001.DN

SM#1 Finger2Separate / Tran_103
(i_finger_2_down AND i_finger_2_no_copper AND NOT f_sm1_finger_retry_bypass_active) OR State_Lower_Finger_001.DN

SM#2 Finger1Separate / Tran_155
(i_finger_1_down AND i_finger_1_no_copper AND NOT f_sm2_finger_retry_bypass_active) OR State_Lower_Finger1_003.DN

SM#2 Finger2Separate / Tran_160
(i_finger_2_down AND i_finger_2_no_copper AND NOT f_sm2_finger_retry_bypass_active) OR State_Lower_Finger_003.DN
```

## InTouch 화면을 만든다

SM#1과 SM#2에 같은 모양의 ON 버튼, OFF 버튼, 기능 선택 표시, 실제 우회 중 표시를 각각 만든다. 버튼은 유지형 스위치가 아니라 누르는 동안만 1이 되는 Momentary 방식으로 설정한다.

| 장비 | InTouch 기능 | PLC Item 예시 | 동작 |
|---|---|---|---|
| SM#1 | ON 버튼 | `Program:Stripping_Machine_1.ui_i_sm1_finger_retry_bypass_on` | Touch Down=1, Touch Up=0이다. |
| SM#1 | OFF 버튼 | `Program:Stripping_Machine_1.ui_i_sm1_finger_retry_bypass_off` | Touch Down=1, Touch Up=0이다. |
| SM#1 | 기능 선택 표시 | `Program:Stripping_Machine_1.ui_o_sm1_finger_retry_bypass_enabled` | 1이면 `Retry 우회 기능 ON`으로 표시한다. |
| SM#1 | 실제 우회 중 표시 | `Program:Stripping_Machine_1.ui_o_sm1_finger_retry_bypass_active` | 1일 때만 적색 또는 황색으로 `센서 우회 중`을 표시한다. |
| SM#2 | ON 버튼 | `Program:Stripping_Machine_2.ui_i_sm2_finger_retry_bypass_on` | Touch Down=1, Touch Up=0이다. |
| SM#2 | OFF 버튼 | `Program:Stripping_Machine_2.ui_i_sm2_finger_retry_bypass_off` | Touch Down=1, Touch Up=0이다. |
| SM#2 | 기능 선택 표시 | `Program:Stripping_Machine_2.ui_o_sm2_finger_retry_bypass_enabled` | 1이면 `Retry 우회 기능 ON`으로 표시한다. |
| SM#2 | 실제 우회 중 표시 | `Program:Stripping_Machine_2.ui_o_sm2_finger_retry_bypass_active` | 1일 때만 적색 또는 황색으로 `센서 우회 중`을 표시한다. |

`Program:...` Item 표기는 Logix Program Scope의 일반적인 전체 경로 예시이다. 실제 InTouch Access Name과 Item 표기 방식은 현재 프로젝트에서 사용 중인 기존 Program Scope 태그 하나를 복사해 같은 형식으로 맞춘다.

표시 문구는 두 상태를 구분해야 한다.

- `Retry 우회 기능 ON`: 다음 Retry에서 기능을 사용할 준비가 되었다는 뜻이다.
- `센서 우회 중`: 지금 실제 No Copper 판정을 우회하고 있다는 뜻이다.

기존 STRIP 버튼 `ui_i_auto_separate`는 수정하지 않는다. 작업자가 Retry Step에서 기존 STRIP 버튼을 누르면 `DoAutoModeManualControls → DoSeparation`이 실행되고, 선택된 우회 정책이 이미 적용된 상태로 동작한다.

## Studio 5000 검증 순서

1. `Controller Organizer`에서 SM#1과 SM#2의 새 태그 8개씩을 다시 확인한다.
2. `BasicControl`에서 새 Rung 6개씩이 Gate 판정 Rung 바로 뒤에 있는지 확인한다.
3. Cross Reference로 SM#1의 `f_sm1_finger_retry_bypass_active`와 SM#2의 `f_sm2_finger_retry_bypass_active`를 확인한다. 각 태그의 OTE가 해당 Program에서 한 곳뿐이어야 한다.
4. Finger 완료 Rung 4개가 실제 `Finger Down` 접점을 계속 포함하는지 확인한다.
5. SFC Transition 네 곳의 이름과 앞뒤 Step을 표와 다시 대조한다.
6. `Verify Routine`을 각 수정 Routine에 실행한다.
7. `Verify Program`을 `Stripping_Machine_1`, `Stripping_Machine_2`에 실행한다.
8. 마지막으로 `Verify Controller`를 실행한다.
9. 오류가 0건일 때만 승인된 절차에 따라 Download 또는 Online Edit를 진행한다.

[LD와 SFC 복사용 텍스트 내려받기](/downloads/sc1-sm-finger-retry-sfc-bypass.txt)

## 현장 시험 순서

처음에는 SM#1만 시험하고 합격한 뒤 SM#2를 같은 순서로 시험한다. 두 장비를 동시에 시험하지 않는다.

| 시험 | 조작 | 합격 기준 |
|---|---|---|
| 첫 스캔 | Controller를 Program에서 Run으로 전환한다. | Enabled와 Active 표시가 모두 0이어야 한다. |
| 기능 OFF | HMI에서 OFF를 누르고 일반 탈취를 실행한다. | 실제 No Copper 입력으로만 Finger 완료가 만들어져야 한다. |
| 기능 ON 대기 | HMI에서 ON을 누르고 정상 탈취를 실행한다. | Enabled는 1이고 Active는 0이어야 한다. 실제 센서를 사용해야 한다. |
| 실패 플래그만 발생 | `f_strip_failed=1`이지만 실제 Retry Step 전 상태를 관찰한다. | Active는 0이어야 한다. |
| 실제 Retry 진입 | SM#1 `_001.X` 또는 SM#2 `_003.X`와 `f_auto_mode_manual_retry`를 관찰한다. | 두 비트가 켜진 동안 Active가 1이어야 한다. |
| STRIP 재시도 | Retry Step에서 기존 STRIP 버튼을 누른다. | Finger Down이 확인되면 No Copper 입력과 관계없이 완료 판정이 가능해야 한다. |
| Finger Down 보호 | Active가 1인 상태에서 Finger Down이 0인 조건을 만든다. | `f_finger*_separated`가 1이 되면 안 된다. |
| SFC 재시도 억제 | Active가 1인 동안 No Copper 입력 변화를 관찰한다. | 물리 입력만으로 해당 `Tran_099/103/155/160`이 즉시 통과하면 안 된다. |
| Gate 성공 | 전기동이 Gate에 들어오게 한다. | `f_copper_in_gate=1`이 되면 Active 표시가 0으로 꺼져야 한다. |
| 리젝트 또는 중단 | Retry를 리젝트하거나 Step에서 이탈시킨다. | Active가 0으로 꺼져야 한다. |
| 다음 Retry | Enable을 ON으로 유지한 채 다음 Retry를 만든다. | 실제 Retry 중에만 Active가 다시 켜져야 한다. |
| 장비 독립성 | SM#1 ON/OFF를 조작한다. | SM#2의 Enabled와 Active가 바뀌면 안 된다. 반대도 같아야 한다. |

시험 Trend에는 장비별로 다음 태그를 기록한다. 아래 첫 네 줄은 SM#1과 SM#2에서 이름이 다르므로 해당 장비의 목록을 사용한다.

```text
SM#1: ui_o_sm1_finger_retry_bypass_enabled
SM#1: ui_o_sm1_finger_retry_bypass_active
SM#1: f_sm1_finger_retry_bypass_enable
SM#1: f_sm1_finger_retry_bypass_active

SM#2: ui_o_sm2_finger_retry_bypass_enabled
SM#2: ui_o_sm2_finger_retry_bypass_active
SM#2: f_sm2_finger_retry_bypass_enable
SM#2: f_sm2_finger_retry_bypass_active

각 Program의 기존 태그:
z_mode_automatic
f_strip_failed
State_Manual_Retry_001.X 또는 State_Manual_Retry_003.X
f_auto_mode_manual_retry
ui_i_auto_separate
i_finger_1_down
i_finger_2_down
i_finger_1_no_copper
i_finger_2_no_copper
f_finger1_separated
f_finger2_separated
f_copper_in_gate
f_reject_cathode
```

## 문제가 생겼을 때 원복한다

1. HMI에서 해당 장비의 OFF 버튼을 눌러 Enabled와 Active가 0인지 확인한다.
2. 새 InTouch 버튼과 표시를 사용할 수 없게 만든다.
3. `BasicControl`에서 Gate 판정 바로 뒤에 추가한 Rung 6개를 제거한다.
4. Finger 완료 Rung 4개를 이 문서의 수정 전 RLL로 되돌린다.
5. SFC Transition 네 곳을 이 문서의 수정 전 조건으로 되돌린다.
6. Verify Controller를 실행하고 오류가 0건인지 확인한다.
7. 문제가 계속되면 작업 전 백업 ACD로 복구한다.

이 문서는 PLC와 HMI의 수정 절차를 제공한다. 실제 Download, Online Edit, I/O 극성 확인, 무부하 시험과 생산 승인까지 끝나야 현장 적용이 완료된다.
