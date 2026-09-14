---
title: SC1 SM#1·SM#2 Finger 센서 3모드 현장 적용서
date: "2026-09-13"
excerpt: 정상 센서, 60초 우회, Retry 자동 우회를 SM#1과 SM#2에서 따로 선택하도록 만든 PLC·InTouch 적용서이다. 변경 전후 LD와 붙여넣을 RLL을 함께 제공한다.
kicker: PLC
tags: ["PLC", "InTouch", "SC1", "SM1", "SM2", "Retry"]
---

이 작업안은 SM#1과 SM#2의 Finger No Copper 센서 운전 방법을 각각 세 가지 모드로 관리한다. HMI에는 장비별로 세 개의 순간 버튼을 두고, PLC의 DINT 상태값 하나가 항상 모드 0, 1, 2 중 하나만 가지도록 한다.

| 모드 | HMI 버튼 | 실제 동작 |
|---:|---|---|
| 0 | `정상 센서 사용` | 기존 로직처럼 실제 Finger No Copper 센서를 사용한다. 전원 재인가와 Run 전환 때도 이 모드로 시작한다. |
| 1 | `60초 우회 시작` | 이 전용 버튼을 누르는 순간 해당 SM의 센서 판정을 60초 동안 우회한다. 60초 뒤에는 PLC가 모드 0으로 자동 복귀한다. |
| 2 | `Retry 자동 우회` | 선택만 해 두었을 때는 센서를 우회하지 않는다. 실제 Retry 스텝에서 `f_auto_mode_manual_retry=1`이 될 때만 우회하고, 탈취 성공·리젝트·Retry 종료 뒤에는 모드 0으로 자동 복귀한다. |

기존 STRIP 버튼인 `ui_i_auto_separate`는 모드를 선택하거나 바꾸지 않는다. 작업자가 STRIP을 누르면 PLC가 그때 이미 선택된 모드를 적용한 상태로 기존 `DoSeparation`을 실행한다. SM#1과 SM#2의 모드, 타이머, 우회 상태는 서로 영향을 주지 않는다.

> 이 문서는 현장에서 입력할 태그, Rung 순서, HMI 동작, 시험과 복구 순서까지 정리한 적용서이다. 다만 Offline L5X 검토만 끝난 상태이므로, Studio 5000 Verify와 실제 I/O 시험을 통과하기 전에는 생산 적용이 완료된 것이 아니다.

## 변경할 파일과 정확한 위치

검토 기준은 `Cathode1(260714).L5X`이며 SHA-256은 `c98ac2a646e9ba7fdc6f6563e61f7e21ef61532db136cb50c4ca587015e624bb`이다. 기준 파일 자체는 수정하지 않았다.

| 장비 | 프로그램 | Routine | 추가 위치 | 기존 완료 Rung |
|---|---|---|---|---|
| SM#1 | `Stripping_Machine_1` | `BasicControl` | 원본 Rung 46의 `OTE(f_copper_in_gate)` 바로 다음에 11개 Rung을 순서대로 넣는다. | 원본 Rung 52와 53을 변경한다. L5X 원본 72879, 72884행이다. |
| SM#2 | `Stripping_Machine_2` | `BasicControl` | 원본 Rung 45의 `OTE(f_copper_in_gate)` 바로 다음에 11개 Rung을 순서대로 넣는다. | 원본 Rung 51과 52를 변경한다. L5X 원본 81806, 81811행이다. |

Rung을 추가하면 뒤 번호는 자동으로 바뀐다. 따라서 변경할 때는 최종 Rung 번호보다 `f_copper_in_gate`, `f_finger1_separated`, `f_finger2_separated`의 Neutral Text를 확인해야 한다.

이번 작업에서는 다음 항목을 수정하지 않는다.

- `DoAutomatic` SFC는 수정하지 않는다.
- `DoSeparation`과 `DoAutoModeManualControls`는 수정하지 않는다.
- `State_Manual_Retry_001`, `State_Manual_Retry_003`의 Action도 수정하지 않는다.
- `z_mode_manual`을 켜지 않는다. 자동 모드를 유지한다.
- 실제 입력 Alias인 `i_finger_*_no_copper`를 덮어쓰거나 Force하지 않는다.

## 원본에서 확인한 근거

| 판정 | 내용 |
|---|---|
| 확인 | SM#1 입력은 `N4:1:I.5`, `N4:1:I.6`이고, SM#2 입력은 `N6:1:I.5`, `N6:1:I.6`이다. |
| 확인 | 원본 완료 판정은 `Finger Down`이 참이고 `No Copper` 입력이 0일 때만 `f_finger*_separated`를 켠다. |
| 확인 | Retry로 들어가는 전이 조건은 `f_strip_failed`이다. SM#1은 `State_Manual_Retry_001`, SM#2는 `State_Manual_Retry_003`이 실제 Retry 스텝이다. |
| 확인 | 실제 Retry 스텝은 `f_auto_mode_manual_retry := 1`을 실행하고 `DoAutoModeManualControls`를 호출한다. 기존 STRIP Rung은 `ui_i_auto_separate`로 `DoSeparation`을 호출한다. |
| 반박 | `f_secsep_failed`는 Retry를 직접 여는 조건이 아니다. 모드 2의 우회 조건으로 사용하면 안 된다. |
| 반박 | `MainRoutine` 3번에 남아 있는 `State_Manual_Retry.X`는 실제 `_001.X`, `_003.X`와 다른 잔여 태그이다. 모드 2 판정에 사용하면 안 된다. |
| 증거부족 | InTouch 원본 프로젝트가 없으므로 현장 Access Name, 기존 STRIP 개체 이름, 화면 스크립트 문법은 아직 확인하지 못했다. |
| 증거부족 | 센서 커넥터 연결·분리·감지 상태에 따른 실제 입력 극성은 Online에서 확인해야 한다. |

## 변경 전과 변경 후 LD

다음 그림은 [L5X Ladder Studio](https://alzza.github.io/l5x-ld-studio/?v=9838c91)와 같은 렌더러가 브라우저 본문 폭에 맞춰 다시 그린다. 짧은 렁도 Studio 5000처럼 레일이 가로를 채우고, 그보다 넓은 렁만 한 화면에 맞게 줄어든다. 웹에서는 Rung 번호와 파서 상태를 그림 위에 두고, SVG 안에는 번호를 넣지 않았다. 모든 그림의 파서 경고는 0건이었다.

### 변경 전

<figure class="ld-rung" data-rung="52" data-rll="XIC(i_finger_1_down)XIO(i_finger_1_no_copper)OTE(f_finger1_separated);">
<div class="rung-meta"><span class="rung-meta-number">Rung 52</span><span class="rung-status ok">정상</span></div>
<img src="/images/notes/sc1-sm-finger-3mode/ld_rung_00.svg?v=f4b0f98" alt="변경 전 Finger 완료 Rung" width="920" height="126">
</figure>

```text
XIC(i_finger_1_down)XIO(i_finger_1_no_copper)OTE(f_finger1_separated);
```

### 변경 후 SM#1

<figure class="ld-rung" data-rung="52" data-rll="XIC(i_finger_1_down)[XIO(i_finger_1_no_copper),XIC(z_sm1_finger_bypass_active)]OTE(f_finger1_separated);">
<div class="rung-meta"><span class="rung-meta-number">Rung 52</span><span class="rung-status ok">정상</span></div>
<img src="/images/notes/sc1-sm-finger-3mode/ld_rung_01.svg?v=f4b0f98" alt="변경 후 SM1 Finger 완료 Rung" width="920" height="286">
</figure>

```text
XIC(i_finger_1_down)[XIO(i_finger_1_no_copper),XIC(z_sm1_finger_bypass_active)]OTE(f_finger1_separated);
```

### 변경 후 SM#2

<figure class="ld-rung" data-rung="51" data-rll="XIC(i_finger_1_down)[XIO(i_finger_1_no_copper),XIC(z_sm2_finger_bypass_active)]OTE(f_finger1_separated);">
<div class="rung-meta"><span class="rung-meta-number">Rung 51</span><span class="rung-status ok">정상</span></div>
<img src="/images/notes/sc1-sm-finger-3mode/ld_rung_02.svg?v=f4b0f98" alt="변경 후 SM2 Finger 완료 Rung" width="920" height="286">
</figure>

```text
XIC(i_finger_1_down)[XIO(i_finger_1_no_copper),XIC(z_sm2_finger_bypass_active)]OTE(f_finger1_separated);
```

변경 후에도 `Finger Down` 접점은 반드시 참이어야 한다. 우회 접점은 No Copper 접점만 대신하며, Finger Down과 설비 안전조건을 없애지 않는다.

## Controller Scope에 추가할 태그

HMI가 두 장비를 분명하게 구분하도록 다음 태그를 Controller Scope에 만든다. 태그의 초기값은 모두 0으로 둔다. TIMER 두 개의 `PRE`는 각각 `60000`으로 설정한다.

| SM#1 태그 | SM#2 태그 | 형식 | 용도 |
|---|---|---|---|
| `ui_sm1_finger_mode0_req` | `ui_sm2_finger_mode0_req` | BOOL | HMI의 정상 센서 순간 요청이다. |
| `ui_sm1_finger_60s_req` | `ui_sm2_finger_60s_req` | BOOL | HMI의 60초 우회 시작 순간 요청이다. 이 버튼이 모드 1 선택과 시간을 함께 시작한다. |
| `ui_sm1_finger_retry_req` | `ui_sm2_finger_retry_req` | BOOL | HMI의 Retry 자동 우회 선택 순간 요청이다. |
| `z_sm1_finger_bypass_mode` | `z_sm2_finger_bypass_mode` | DINT | PLC가 보유하는 배타적 모드값이다. 0, 1, 2만 허용한다. |
| `z_sm1_finger_60s_window` | `z_sm2_finger_60s_window` | BOOL | 모드 1의 60초 창이 열려 있음을 나타낸다. |
| `z_sm1_finger_retry_seen` | `z_sm2_finger_retry_seen` | BOOL | 모드 2를 선택한 뒤 실제 Retry가 시작되었음을 기억한다. |
| `z_sm1_finger_bypass_active` | `z_sm2_finger_bypass_active` | BOOL | 완료 판정에 실제로 사용되는 최종 우회 상태이다. |
| `ons_sm1_finger_mode0_req` | `ons_sm2_finger_mode0_req` | BOOL | 정상 센서 요청용 ONS 저장 비트이다. |
| `ons_sm1_finger_60s_req` | `ons_sm2_finger_60s_req` | BOOL | 60초 요청용 ONS 저장 비트이다. |
| `ons_sm1_finger_retry_req` | `ons_sm2_finger_retry_req` | BOOL | Retry 모드 요청용 ONS 저장 비트이다. |
| `tm_sm1_finger_bypass` | `tm_sm2_finger_bypass` | TIMER | 모드 1의 60초 TON이다. `PRE=60000`으로 설정한다. |

HMI는 `z_*_finger_bypass_mode`에 숫자를 직접 쓰지 않는다. 세 개의 요청 BOOL만 Momentary로 쓰고, PLC가 DINT를 갱신한다. 이 방식이면 동시에 두 모드가 켜지는 상태를 만들 수 없다. 요청이 같은 스캔에 겹치면 정상 센서 요청이 우선하며, 첫 스캔은 항상 모드 0이 우선한다.

## SM#1에 넣을 RLL

다음 11개 Rung을 `Stripping_Machine_1 > BasicControl`의 원본 Rung 46 바로 다음에 표시된 순서대로 넣는다.

```text
XIC(ui_sm1_finger_60s_req)ONS(ons_sm1_finger_60s_req)[MOV(1,z_sm1_finger_bypass_mode),OTL(z_sm1_finger_60s_window),OTU(z_sm1_finger_retry_seen)];
XIC(ui_sm1_finger_retry_req)ONS(ons_sm1_finger_retry_req)[MOV(2,z_sm1_finger_bypass_mode),OTU(z_sm1_finger_60s_window),OTU(z_sm1_finger_retry_seen)];
XIC(ui_sm1_finger_mode0_req)ONS(ons_sm1_finger_mode0_req)[MOV(0,z_sm1_finger_bypass_mode),OTU(z_sm1_finger_60s_window),OTU(z_sm1_finger_retry_seen)];
XIC(S:FS)[MOV(0,z_sm1_finger_bypass_mode),OTU(z_sm1_finger_60s_window),OTU(z_sm1_finger_retry_seen)];
[LES(z_sm1_finger_bypass_mode,0),GRT(z_sm1_finger_bypass_mode,2)][MOV(0,z_sm1_finger_bypass_mode),OTU(z_sm1_finger_60s_window),OTU(z_sm1_finger_retry_seen)];
NEQ(z_sm1_finger_bypass_mode,1)OTU(z_sm1_finger_60s_window);
XIC(z_sm1_finger_60s_window)TON(tm_sm1_finger_bypass,?,?);
XIC(tm_sm1_finger_bypass.DN)[MOV(0,z_sm1_finger_bypass_mode),OTU(z_sm1_finger_60s_window)];
EQU(z_sm1_finger_bypass_mode,2)XIC(f_auto_mode_manual_retry)OTL(z_sm1_finger_retry_seen);
EQU(z_sm1_finger_bypass_mode,2)XIC(z_sm1_finger_retry_seen)[XIC(f_copper_in_gate),XIC(f_reject_cathode),XIO(f_auto_mode_manual_retry)][MOV(0,z_sm1_finger_bypass_mode),OTU(z_sm1_finger_retry_seen)];
[EQU(z_sm1_finger_bypass_mode,1)XIC(z_sm1_finger_60s_window),EQU(z_sm1_finger_bypass_mode,2)XIC(f_auto_mode_manual_retry)XIO(f_copper_in_gate)XIO(f_reject_cathode)]OTE(z_sm1_finger_bypass_active);
```

그다음 원본 Rung 52와 53을 다음과 같이 바꾼다.

```text
XIC(i_finger_1_down)[XIO(i_finger_1_no_copper),XIC(z_sm1_finger_bypass_active)]OTE(f_finger1_separated);
XIC(i_finger_2_down)[XIO(i_finger_2_no_copper),XIC(z_sm1_finger_bypass_active)]OTE(f_finger2_separated);
```

## SM#2에 넣을 RLL

다음 11개 Rung을 `Stripping_Machine_2 > BasicControl`의 원본 Rung 45 바로 다음에 표시된 순서대로 넣는다.

```text
XIC(ui_sm2_finger_60s_req)ONS(ons_sm2_finger_60s_req)[MOV(1,z_sm2_finger_bypass_mode),OTL(z_sm2_finger_60s_window),OTU(z_sm2_finger_retry_seen)];
XIC(ui_sm2_finger_retry_req)ONS(ons_sm2_finger_retry_req)[MOV(2,z_sm2_finger_bypass_mode),OTU(z_sm2_finger_60s_window),OTU(z_sm2_finger_retry_seen)];
XIC(ui_sm2_finger_mode0_req)ONS(ons_sm2_finger_mode0_req)[MOV(0,z_sm2_finger_bypass_mode),OTU(z_sm2_finger_60s_window),OTU(z_sm2_finger_retry_seen)];
XIC(S:FS)[MOV(0,z_sm2_finger_bypass_mode),OTU(z_sm2_finger_60s_window),OTU(z_sm2_finger_retry_seen)];
[LES(z_sm2_finger_bypass_mode,0),GRT(z_sm2_finger_bypass_mode,2)][MOV(0,z_sm2_finger_bypass_mode),OTU(z_sm2_finger_60s_window),OTU(z_sm2_finger_retry_seen)];
NEQ(z_sm2_finger_bypass_mode,1)OTU(z_sm2_finger_60s_window);
XIC(z_sm2_finger_60s_window)TON(tm_sm2_finger_bypass,?,?);
XIC(tm_sm2_finger_bypass.DN)[MOV(0,z_sm2_finger_bypass_mode),OTU(z_sm2_finger_60s_window)];
EQU(z_sm2_finger_bypass_mode,2)XIC(f_auto_mode_manual_retry)OTL(z_sm2_finger_retry_seen);
EQU(z_sm2_finger_bypass_mode,2)XIC(z_sm2_finger_retry_seen)[XIC(f_copper_in_gate),XIC(f_reject_cathode),XIO(f_auto_mode_manual_retry)][MOV(0,z_sm2_finger_bypass_mode),OTU(z_sm2_finger_retry_seen)];
[EQU(z_sm2_finger_bypass_mode,1)XIC(z_sm2_finger_60s_window),EQU(z_sm2_finger_bypass_mode,2)XIC(f_auto_mode_manual_retry)XIO(f_copper_in_gate)XIO(f_reject_cathode)]OTE(z_sm2_finger_bypass_active);
```

그다음 원본 Rung 51과 52를 다음과 같이 바꾼다.

```text
XIC(i_finger_1_down)[XIO(i_finger_1_no_copper),XIC(z_sm2_finger_bypass_active)]OTE(f_finger1_separated);
XIC(i_finger_2_down)[XIO(i_finger_2_no_copper),XIC(z_sm2_finger_bypass_active)]OTE(f_finger2_separated);
```

[SM#1·SM#2 Neutral Text 전체를 TXT로 내려받기](/downloads/sc1-sm-finger-3mode-neutral-text.txt)

## 주요 Rung을 LD로 확인하기

60초 전용 버튼은 모드 1을 선택하면서 타이머 창을 한 번만 연다. 우회 중 버튼을 다시 눌러도 비유지형 TON Rung이 계속 참이므로 ACC가 0으로 다시 시작되지 않는다.

<figure class="ld-rung" data-rung="60초 전용 버튼" data-rll="XIC(ui_sm1_finger_60s_req)ONS(ons_sm1_finger_60s_req)[MOV(1,z_sm1_finger_bypass_mode),OTL(z_sm1_finger_60s_window),OTU(z_sm1_finger_retry_seen)];">
<div class="rung-meta"><span class="rung-meta-number">60초 전용 버튼</span><span class="rung-status ok">정상</span></div>
<img src="/images/notes/sc1-sm-finger-3mode/ld_rung_03.svg?v=f4b0f98" alt="60초 전용 버튼 LD" width="920" height="446">
</figure>

<figure class="ld-rung" data-rung="60초 타이머" data-rll="XIC(z_sm1_finger_60s_window)TON(tm_sm1_finger_bypass,?,?);">
<div class="rung-meta"><span class="rung-meta-number">60초 타이머</span><span class="rung-status ok">정상</span></div>
<img src="/images/notes/sc1-sm-finger-3mode/ld_rung_04.svg?v=f4b0f98" alt="60초 타이머 LD" width="920" height="166">
</figure>

<figure class="ld-rung" data-rung="60초 뒤 모드 0 복귀" data-rll="XIC(tm_sm1_finger_bypass.DN)[MOV(0,z_sm1_finger_bypass_mode),OTU(z_sm1_finger_60s_window)];">
<div class="rung-meta"><span class="rung-meta-number">60초 뒤 모드 0 복귀</span><span class="rung-status ok">정상</span></div>
<img src="/images/notes/sc1-sm-finger-3mode/ld_rung_05.svg?v=f4b0f98" alt="60초 뒤 모드 0 복귀 LD" width="920" height="286">
</figure>

모드 2는 `f_strip_failed`가 켜졌다는 이유만으로 우회하지 않는다. 실제 Retry 스텝이 실행되어 `f_auto_mode_manual_retry=1`이 된 순간부터 우회한다.

<figure class="ld-rung" data-rung="실제 Retry 시작 기억" data-rll="EQU(z_sm1_finger_bypass_mode,2)XIC(f_auto_mode_manual_retry)OTL(z_sm1_finger_retry_seen);">
<div class="rung-meta"><span class="rung-meta-number">실제 Retry 시작 기억</span><span class="rung-status ok">정상</span></div>
<img src="/images/notes/sc1-sm-finger-3mode/ld_rung_06.svg?v=f4b0f98" alt="실제 Retry 시작 기억 LD" width="920" height="146">
</figure>

<figure class="ld-rung" data-rung="최종 우회 Active" data-rll="[EQU(z_sm1_finger_bypass_mode,1)XIC(z_sm1_finger_60s_window),EQU(z_sm1_finger_bypass_mode,2)XIC(f_auto_mode_manual_retry)XIO(f_copper_in_gate)XIO(f_reject_cathode)]OTE(z_sm1_finger_bypass_active);">
<div class="rung-meta"><span class="rung-meta-number">최종 우회 Active</span><span class="rung-status ok">정상</span></div>
<img src="/images/notes/sc1-sm-finger-3mode/ld_rung_07.svg?v=f4b0f98" alt="최종 우회 Active LD" width="1176" height="326">
</figure>

## 모드별 작동 순서

### 모드 0

1. PLC가 `z_sm*_finger_bypass_mode=0`과 `z_sm*_finger_bypass_active=0`을 유지한다.
2. 작업자가 STRIP을 누르면 기존 `ui_i_auto_separate`와 `DoSeparation`이 동작한다.
3. `Finger Down`과 실제 `No Copper` 입력이 기존 방식으로 완료 비트를 만든다.

### 모드 1

1. 작업자가 해당 장비의 `60초 우회 시작` 전용 버튼을 누른다.
2. PLC의 ONS가 요청을 한 번 받고 모드를 1로 바꾸며 60초 창을 연다.
3. `z_sm*_finger_bypass_active`가 즉시 1이 되고 TON의 ACC가 증가한다.
4. 작업자가 기존 STRIP 버튼을 누르면 우회가 이미 적용된 완료 판정을 사용한다.
5. TON이 60000 ms에 도달한 스캔에 PLC가 모드와 Active를 0으로 돌린다.

### 모드 2

1. 작업자가 해당 장비의 `Retry 자동 우회` 버튼을 누르면 PLC가 모드를 2로 기억한다. 이때 Active는 0이다.
2. 기존 자동 운전에서 `f_strip_failed=1`이 되면 기존 SFC가 실제 Retry 스텝으로 들어간다.
3. SM#1의 `State_Manual_Retry_001` 또는 SM#2의 `State_Manual_Retry_003`이 `f_auto_mode_manual_retry=1`을 만든다.
4. PLC가 그 비트를 확인한 스캔에 Active를 1로 만든다. 작업자가 STRIP을 누르면 선택된 모드 2가 적용된다.
5. `f_copper_in_gate=1`로 탈취 성공이 확인되거나, `f_reject_cathode=1`이 되거나, 시작했던 Retry가 끝나면 PLC가 모드 0으로 자동 복귀한다.

`z_sm*_finger_retry_seen`은 모드 2를 미리 선택한 대기 상태와 실제 Retry가 끝난 상태를 구분한다. 이 비트 없이 단순히 `XIO(f_auto_mode_manual_retry)`로 모드 0을 쓰면, 모드 2를 선택하는 즉시 다시 0으로 돌아간다.

## InTouch 화면 설정

SM#1과 SM#2에 각각 같은 구성의 개체를 만든다.

| 화면 개체 | PLC 태그 | HMI 동작 |
|---|---|---|
| `정상 센서 사용` | `ui_sm*_finger_mode0_req` | Touch Down에서 1, Touch Up에서 0이 되는 Momentary 버튼으로 만든다. |
| `60초 우회 시작` | `ui_sm*_finger_60s_req` | Touch Down에서 1, Touch Up에서 0이 되는 전용 Momentary 버튼으로 만든다. |
| `Retry 자동 우회` | `ui_sm*_finger_retry_req` | Touch Down에서 1, Touch Up에서 0이 되는 Momentary 버튼으로 만든다. |
| 모드 0 선택 표시 | `z_sm*_finger_bypass_mode=0` | 녹색으로 `실제 센서를 사용합니다.`라고 표시한다. |
| 모드 1 선택 표시 | `z_sm*_finger_bypass_mode=1` | 주황색으로 `60초 우회 중입니다.`라고 표시한다. |
| 모드 2 선택 표시 | `z_sm*_finger_bypass_mode=2` | 파란색으로 `Retry 때만 우회합니다.`라고 표시한다. |
| 실제 우회 표시 | `z_sm*_finger_bypass_active` | 1일 때 주황색으로 점멸시킨다. 선택 모드가 아니라 실제 우회 여부를 보여 준다. |
| 남은 시간 | `tm_sm*_finger_bypass.ACC` | 모드 1에서 `60 - ACC/1000`초를 표시한다. 현장 InTouch 버전의 정수식 문법에 맞춘다. |
| 센서 상태 | `i_finger_1_no_copper`, `i_finger_2_no_copper` | 입력 5번과 6번의 실제 상태를 별도 램프로 보여 준다. |

기존 STRIP 버튼의 PLC 태그 `ui_i_auto_separate`는 그대로 둔다. STRIP 버튼에 모드 선택 스크립트나 우회 비트 쓰기를 추가하지 않는다. HMI 통신 주기보다 짧은 자체 펄스 스크립트를 만들지 말고, 누르는 동안만 요청 비트를 1로 보내며 PLC의 ONS가 한 번만 처리하도록 한다.

## 현장 적용 순서

1. 현재 Controller의 ACD와 L5X를 날짜와 시간까지 붙여 별도 보관한다.
2. Online에서 커넥터 연결, 전기동 감지, 전기동 없음 세 상태를 만들고 입력 5번과 6번의 극성을 기록한다.
3. Controller Scope에 표의 22개 태그를 만들고 두 TIMER의 PRE를 60000으로 설정한다.
4. SM#1 `BasicControl` 원본 Rung 46 다음에 11개 Rung을 넣고 원본 Rung 52, 53을 변경한다.
5. SM#2 `BasicControl` 원본 Rung 45 다음에 11개 Rung을 넣고 원본 Rung 51, 52를 변경한다.
6. Cross Reference에서 `z_sm1_finger_bypass_active`와 `z_sm2_finger_bypass_active`의 OTE가 각각 한 곳뿐인지 확인한다.
7. Studio 5000에서 두 Program과 전체 Controller를 Verify한다. 오류가 있으면 Online Edit를 승인하지 않는다.
8. InTouch에 장비별 세 버튼과 상태 표시를 만들고, 요청 태그는 Momentary 쓰기로 설정한다.
9. 생산물을 넣지 않은 승인된 시험 조건에서 모드 0, 1, 2를 각각 시험한다.
10. 시험표가 모두 통과하고 책임자가 승인한 뒤에만 생산 운전에 사용한다.

## Trend와 시험표

Trend에는 장비별로 21개, 두 장비 합계 42개 항목을 기록한다. 프로그램 안에 같은 이름이 있는 태그는 `Stripping_Machine_1`과 `Stripping_Machine_2`를 정확히 구분한다.

```text
z_sm*_finger_bypass_mode
ui_sm*_finger_mode0_req
ui_sm*_finger_60s_req
ui_sm*_finger_retry_req
z_sm*_finger_60s_window
tm_sm*_finger_bypass.EN
tm_sm*_finger_bypass.TT
tm_sm*_finger_bypass.DN
tm_sm*_finger_bypass.ACC
z_sm*_finger_retry_seen
z_sm*_finger_bypass_active
f_strip_failed
f_auto_mode_manual_retry
f_copper_in_gate
f_reject_cathode
i_finger_1_down
i_finger_1_no_copper
f_finger1_separated
i_finger_2_down
i_finger_2_no_copper
f_finger2_separated
```

| 시험 | 합격 기준 |
|---|---|
| Run 전환 | 두 장비 모두 모드 0, Active 0, Window 0으로 시작해야 한다. |
| 모드 배타성 | 각 장비에서 모드값이 0, 1, 2 중 하나만 가져야 한다. -1이나 3 이상을 시험으로 넣으면 다음 스캔에 0으로 돌아와야 한다. |
| 모드 0 | 실제 No Copper 입력이 기존과 같은 극성으로 완료 비트를 만들어야 한다. |
| 모드 1 시작 | 60초 전용 버튼을 누르면 해당 장비만 모드 1과 Active 1이 되어야 한다. |
| 모드 1 반복 누름 | 60초 동안 버튼을 다시 눌러도 ACC가 0으로 초기화되거나 시간이 연장되면 안 된다. |
| 모드 1 자동 복귀 | ACC가 60000에 도달한 스캔에 모드 0과 Active 0으로 돌아가야 한다. |
| HMI 통신 장애 | 모드 1 도중 통신을 끊어도 PLC가 60초 뒤 모드 0으로 돌아가야 한다. |
| 모드 2 대기 | 모드 2를 선택해도 실제 Retry 전에는 Active가 0이어야 한다. |
| 실패 플래그만 발생 | `f_strip_failed=1`만으로 Active가 켜지면 안 된다. |
| 실제 Retry 시작 | `_001` 또는 `_003` Retry 스텝에서 `f_auto_mode_manual_retry=1`이 되면 해당 장비의 Active가 1이어야 한다. |
| Retry 성공 | `f_copper_in_gate=1`이 된 스캔에 Active가 꺼지고 모드가 0으로 복귀해야 한다. |
| Retry 리젝트·중단 | `f_reject_cathode=1` 또는 시작했던 Retry 종료 때 Active가 꺼지고 모드가 0으로 복귀해야 한다. |
| STRIP 독립성 | STRIP 버튼을 눌러도 선택 모드는 바뀌지 않아야 하며, 선택된 모드로 `DoSeparation`이 동작해야 한다. |
| Finger Down 보호 | Active가 1이어도 해당 Finger Down이 0이면 완료 비트가 1이 되면 안 된다. |
| 장비 독립성 | SM#1의 버튼, 모드, 타이머가 SM#2 값을 바꾸지 않아야 하며 반대도 같아야 한다. |

## 문서 산출물 검증 결과

| 검사 | 결과 |
|---|---|
| RLL 파싱 | 이 문서와 TXT에 있는 실제 입력용 Neutral Text 26개를 `l5x-ld-studio`와 같은 파서로 검사했으며 26개 모두 경고 0건이었다. |
| 상태 전이 모의시험 | 모드 1 시작·반복 누름·60초 복귀, 모드 2 대기·Retry 시작·성공·중단, 비정상 모드 복귀, 장비 독립성에 관한 10개 단언이 모두 통과했다. |
| 사이트 빌드 | 노트 HTML, LD SVG 8장, 다운로드 TXT가 모두 정적 빌드에 포함되었다. 브라우저에서 SVG 8장의 로딩과 TXT 응답을 확인했다. |
| 아직 필요한 시험 | Studio 5000 문법 Verify, Online Edit, 실제 입력 극성, InTouch Access Name, 무부하 동작, 생산 동작은 현장에서 확인해야 한다. |

## 이상이 생겼을 때 복구하는 방법

1. HMI에서 두 장비를 모두 모드 0으로 바꾸고 Active가 0인지 확인한다.
2. InTouch의 새 버튼 여섯 개를 사용 불가로 전환한다.
3. 각 `BasicControl`에서 추가한 11개 Rung을 제거한다.
4. Finger 완료 Rung 네 개를 아래 원본으로 되돌린다.

```text
XIC(i_finger_1_down)XIO(i_finger_1_no_copper)OTE(f_finger1_separated);
XIC(i_finger_2_down)XIO(i_finger_2_no_copper)OTE(f_finger2_separated);
```

5. Verify를 통과한 뒤 승인 절차에 따라 Edit를 반영한다. 새 태그 삭제는 로직 복구와 Cross Reference 확인이 끝난 뒤에 진행한다.

이 적용서는 L5X, PLC, 로봇 LS를 직접 바꾸지 않았다. 현장 적용자는 반드시 원본 백업, Studio 5000 Verify, 실제 입력 극성 확인, 무부하 시험, 생산 승인 순서를 지켜야 한다.
