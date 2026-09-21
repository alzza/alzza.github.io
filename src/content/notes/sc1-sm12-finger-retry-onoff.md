---
title: CSM SM#1·SM#2 Finger 센서 Retry 우회 현장 적용서 Rev.5
date: "2026-09-21"
excerpt: 기능 ON 선택은 유지하고 탈취 실패부터 Gate 진입까지만 Finger No Copper를 감지 상태로 판단하는 수정안이다. 원본 비교, RLL, LD, SFC, InTouch 태그와 검증 절차를 담았다.
kicker: PLC
tags: ["PLC", "InTouch", "CSM", "SM1", "SM2", "Retry", "SFC"]
---

## Rev.5 변경 이력

- Rev.1: Retry Step 신호를 기준으로 Finger No Copper 우회를 여는 안내였다.
- Rev.2: `f_strip_failed`를 Permits 해제 전에 보관하고 Gate 진입까지 Active를 유지하도록 수정했다.
- Rev.3: 완료 래치 조건을 한 줄에 묶은 1안과 Gate·Reject·자동모드 이탈을 세 Rung으로 나눈 2안을 함께 제공한다. 실제 현장에는 둘 중 하나만 입력한다.
- Rev.4: InTouch 버튼·표시등 표의 빈 행을 제거해 Markdown 표가 한 표로 렌더링되도록 수정했다.
- Rev.5: 접점 없는 Pending 해제 Rung을 없애고, MainRoutine의 실패 포착 Rung이 `OTE`로 Pending을 매 스캔 갱신한다. SFC 확대도는 Step과 Transition을 세로로 정렬한다.

## 이번 개정에서 달라진 점

기능 ON은 우회를 허용하는 선택이다. ON을 눌러도 첫 정상 동작에는 실제 센서를 사용한다. `f_strip_failed=1`이 발생하면 해당 장비의 Finger 두 개를 전기동이 감지된 것으로 판단하고, `f_copper_in_gate=1`이면 우회만 끝낸다. 기능 ON 선택은 유지하므로 다음 실패에서도 같은 방식으로 동작한다. 종료 기준은 실제 Drop 완료 `f_copper_dropped`가 아니라 Gate 진입 `f_copper_in_gate`이다.

> 검증 상태: 9월 15일 원본에 대한 오프라인 수정안이다. 현장에 적용된 수정 후 L5X는 아직 확보되지 않았다. 따라서 아래 번호는 이 원본의 번호이며, 현장 수정본과 대조하기 전에는 그대로 입력하지 않는다. 이전 시험에서 멈춘 원인도 이 문서만으로 확정하지 않는다.

이번 개정은 이전 안내서의 6개 추가 Rung을 교체한다. 그 위에 새 로직을 겹쳐 넣지 않는다. 기존에 같은 태그를 쓰는 OTE·OTL·OTU가 남으면 서로 덮어쓸 수 있다.

| 상태 | Enable | Active | Finger No Copper 판단 |
|---|---:|---:|---|
| 기능 OFF | 0 | 0 | 원본 입력을 사용한다. |
| 기능 ON, 정상 첫 동작 | 1 | 0 | 원본 입력을 사용한다. |
| 기능 ON, 탈취 실패 발생 | 1 | 1 | 전기동이 감지된 것으로 판단한다. |
| 우회 중 실패 플래그만 해제됨 | 1 | 1 | Gate 진입까지 우회를 유지한다. |
| Gate 진입 | 1 | 0 | 실제 센서로 돌아간다. |
| 다음 새로운 탈취 실패 | 1 | 1 | 다시 우회한다. |
| 기능 OFF, 자동 모드 이탈, 리젝트 | 선택에 따름 | 0 | 실제 센서로 돌아간다. |
| Controller Run 첫 스캔 | 0 | 0 | 기능을 OFF로 시작한다. |

실패 중에 ON을 눌러도 우회를 시작한다. Gate에서 끝난 실패 비트가 남아 있을 때는 다시 우회하지 않는다. 실패 비트와 기록이 해제돼야 다음 실패를 받는다. 리젝트나 자동 모드 이탈로 끝난 경우에도 같은 실패 건의 자동 재시작을 막는다. 기능 OFF 후 같은 실패 중에 다시 ON을 누르는 것은 허용한다. 단, Gate에서 이미 완료한 건은 다시 시작하지 않는다.

## 센서 판단과 실행 순서

원본에서 `No Copper=0`이 전기동 감지 상태이다. 새 내부 판단값은 `실제 No Copper AND NOT Active`로 만든다. Active가 0이면 실제 입력과 같고, Active가 1이면 0이다. 물리 입력 Alias에는 쓰지 않는다. Finger Down 위치 입력, Flexbar 위치, Carriage 위치와 나머지 인터록은 그대로 확인한다.

새 RLL Routine은 각 `MainRoutine`의 맨 앞에서 한 번 실행한다. 그 뒤의 SFC와 `BasicControl`은 같은 스캔에서 같은 No Copper 판단값을 읽는다. `f_finger*_separated`는 기존처럼 `BasicControl`에서 계산하며, 상위 SFC는 다음 실행에서 그 결과를 읽는다. Gate 신호가 기존 `BasicControl`에서 켜지면 다음 `MainRoutine` 시작에서 우회를 끝낸다.

OFF도 전처리가 버튼 요청을 읽은 시점부터 실제 No Copper 판단으로 돌아간다. 다만 상위 SFC가 읽는 완료 비트는 앞선 BasicControl 계산값이므로 한 번의 후속 계산·실행까지 영향이 남을 수 있다. OFF 버튼은 이미 실행된 Step이나 동작 명령을 되돌리는 정지 버튼이 아니다. 이 시간 차이를 없애려고 기존 완료 Rung을 앞으로 옮기거나 완료 비트에 두 번째 OTE를 추가하지 않는다.

`DoAutomatic` 안에서 생긴 실패가 뒤쪽 `Permits`에서 지워질 수 있으므로, 원본 `Background` 호출 직후이자 `Permits` 호출 전에 실패 기록 Rung을 한 개 넣는다. 이 `OTE`는 실패가 1이면 Pending을 세우고 0이면 내린다. 다음 스캔 시작에서 Pending을 읽는다. 실패를 지우는 원본 Rung은 Background가 아니라 Permits에 있다.

이것은 동일한 입력 상태에 대한 OFF 논리 동등성을 유지하는 방식이다. No Copper를 스캔 앞에서 한 번 읽으므로, 물리 I/O가 한 스캔 도중 바뀌는 경우까지 원본과 시각이 완전히 같다고 주장하지 않는다. 실패 발생·Gate 판정도 아래 모의시험에서 Program 스캔 경계를 기준으로 확인한다.

| 실행 순서 | 하는 일 |
|---|---|
| 새 전처리 JSR | 버튼 요청, 실패 기록, Gate·중단 조건을 처리하고 내부 센서 판단값을 만든다. |
| 기존 DoAutomatic 및 수동 처리 | 기존 SFC와 HMI STRIP 동작을 실행한다. |
| 기존 Background 직후의 새 기록 Rung | `OTE`로 현재 `f_strip_failed`를 Pending에 복사한다. |
| 기존 Permits | 기존 허가·실패 해제·실패 발생 로직을 실행한다. |
| 기존 BasicControl | 내부 판단값으로 Finger 완료 비트를 계산하고 기존 Gate 신호를 만든다. |
| 다음 Program 스캔 | 기록된 실패와 Gate 결과를 우회 상태에 반영한다. |

## 이전 적용안을 사용 중이면 먼저 정리한다

1. 현장 수정본 전체 L5X와 ACD를 별도 파일로 보관한다. 원본과 현장 수정본의 차이를 확인한다.
2. 장비별 `BasicControl`에서 이전 안내서로 추가한 6개 Rung을 찾는다. ON ONS·OTL, OFF ONS·OTU, `S:FS`, Retry Step와 실패를 직렬로 읽는 Active OTE, Enable 표시 OTE, Active 표시 OTE가 그 대상이다. 이 6개는 아래 새 Routine으로 교체하므로 중복해서 남기지 않는다.
3. 이전 3모드·60초 우회 로직이 같은 완료 비트에 쓰고 있다면 함께 적용하지 않는다. Cross Reference에서 기존 쓰기 위치를 확인한다.
4. 원래 있던 Finger 완료 Rung 두 개는 지우지 않고 아래 변경 후 로직으로 교체한다. SFC의 이전 `AND NOT ...bypass_active` 식도 아래 변경 후 식 전체로 교체한다.
5. 새 Routine을 만들고 Verify한 뒤 MainRoutine에 연결한다. Online Edit의 Test·Accept 상태도 함께 확인한다. 현장 수정본에 맞춘 확인이 끝나기 전에는 다운로드하거나 시험을 진행하지 않는다.

더 오래된 4개 추가 Rung 버전은 `z_sm*_finger_retry_bypass_enable/active`, `ui_sm*_finger_retry_bypass_on_req/off_req`를 사용했다. 현장에 이 버전이 들어가 있다면 해당 추가 Rung과 HMI 연결도 식별해 교체한다. 같은 기능의 구버전과 신버전을 동시에 실행하지 않는다. 아래 12개 태그 표는 새 버전의 Program Scope 주소를 기준으로 한다.


## SM#1 적용

대상 Program은 `Stripping_Machine_1`이다. 아래 태그는 모두 이 Program의 `Parameters and Local Tags`에 만든다. 모두 BOOL이며 초기값은 0이다. Controller Scope에는 만들지 않는다. 기존 같은 이름의 태그는 재사용한다. 이전 안내서의 8개 태그에 내부 태그 4개를 추가하므로 장비당 12개이다.

| 태그 | External Access | 역할 |
|---|---|---|
| `ui_i_sm1_finger_retry_bypass_on` | Read/Write | ON 순간 요청이다. |
| `ui_i_sm1_finger_retry_bypass_off` | Read/Write | OFF 순간 요청이다. |
| `ui_o_sm1_finger_retry_bypass_enabled` | Read Only | 기능 ON 선택 상태를 표시한다. |
| `ui_o_sm1_finger_retry_bypass_active` | Read Only | 현재 실제 센서 우회 상태를 표시한다. |
| `f_sm1_finger_retry_bypass_enable` | None | 기능 선택을 기억한다. |
| `f_sm1_finger_retry_bypass_active` | None | 현재 실패 건의 우회를 기억한다. |
| `sm1_finger_retry_bypass_on_ons` | None | ON 버튼 ONS 저장 비트이다. |
| `sm1_finger_retry_bypass_off_ons` | None | OFF 버튼 ONS 저장 비트이다. |
| `f_sm1_finger_retry_bypass_done` | None | 완료·중단된 실패 건의 재시작을 막는다. |
| `f_sm1_finger_retry_failed_pending` | None | Permits에서 지워지기 전 실패 발생을 보관한다. |
| `f_sm1_finger1_no_copper_effective` | None | Finger 1에 사용할 No Copper 판단값이다. |
| `f_sm1_finger2_no_copper_effective` | None | Finger 2에 사용할 No Copper 판단값이다. |

### 1. 새 RLL Routine을 만든다

`Stripping_Machine_1 → Routines → New Routine`에서 이름을 `SM1_FingerRetryBypass`, Type을 Ladder Diagram으로 지정한다. 새 Routine의 Rung 0부터 다음 11개를 순서대로 입력한다. 이 코드는 기존 BasicControl 뒤에 붙이는 코드가 아니다.

[SM#1 새 Routine RLL 다운로드](/downloads/csm-finger-retry-v5/sm1_routine.txt)

### 완료 래치 조건 입력안 선택

아래 두 안은 논리적으로 같다. 현장에서는 1안 또는 2안 중 하나만 입력한다. 두 안을 함께 넣으면 `OTL`이 중복되어 원인 추적이 어려워진다.

#### 1안: 압축형 중첩 병렬 Rung

`[A,B,C]`는 A·B·C 중 하나이고, 바로 뒤의 `[D,E,F]`와는 직렬 AND이다. L5X Ladder Studio는 이 표기를 파싱하지만, Studio 5000에서 직접 입력할 때 중첩 분기가 익숙하지 않으면 2안을 선택한다.



```text
XIC(ui_i_sm1_finger_retry_bypass_on)XIO(ui_i_sm1_finger_retry_bypass_off)ONS(sm1_finger_retry_bypass_on_ons)OTL(f_sm1_finger_retry_bypass_enable);
XIC(ui_i_sm1_finger_retry_bypass_off)ONS(sm1_finger_retry_bypass_off_ons)OTU(f_sm1_finger_retry_bypass_enable);
XIC(S:FS)[OTU(f_sm1_finger_retry_bypass_enable),OTU(f_sm1_finger_retry_bypass_active),OTU(f_sm1_finger_retry_bypass_done),OTU(f_sm1_finger_retry_failed_pending)];
XIO(f_strip_failed)XIO(f_sm1_finger_retry_failed_pending)XIO(f_sm1_finger_retry_bypass_active)OTU(f_sm1_finger_retry_bypass_done);
[XIC(f_copper_in_gate),XIC(f_reject_cathode),XIO(z_mode_automatic)][XIC(f_sm1_finger_retry_bypass_active),XIC(f_strip_failed),XIC(f_sm1_finger_retry_failed_pending)]OTL(f_sm1_finger_retry_bypass_done);
XIC(f_sm1_finger_retry_bypass_enable)XIC(z_mode_automatic)XIO(f_copper_in_gate)XIO(f_reject_cathode)XIO(f_sm1_finger_retry_bypass_done)[XIC(f_strip_failed),XIC(f_sm1_finger_retry_failed_pending)]OTL(f_sm1_finger_retry_bypass_active);
[XIO(f_sm1_finger_retry_bypass_enable),XIO(z_mode_automatic),XIC(f_copper_in_gate),XIC(f_reject_cathode)]OTU(f_sm1_finger_retry_bypass_active);
XIC(i_finger_1_no_copper)XIO(f_sm1_finger_retry_bypass_active)OTE(f_sm1_finger1_no_copper_effective);
XIC(i_finger_2_no_copper)XIO(f_sm1_finger_retry_bypass_active)OTE(f_sm1_finger2_no_copper_effective);
XIC(f_sm1_finger_retry_bypass_enable)OTE(ui_o_sm1_finger_retry_bypass_enabled);
XIC(f_sm1_finger_retry_bypass_active)OTE(ui_o_sm1_finger_retry_bypass_active);
```


#### 2안: 현장 입력용 분리 Rung

1안의 완료 Rung 4만 제거하고 아래 세 Rung을 같은 위치에 넣는다. 나머지 Rung 0~3, 5~10은 그대로 둔다. 2안은 모두 13개 Rung이다.



```text
XIC(f_copper_in_gate)[XIC(f_sm1_finger_retry_bypass_active),XIC(f_strip_failed),XIC(f_sm1_finger_retry_failed_pending)]OTL(f_sm1_finger_retry_bypass_done);
XIC(f_reject_cathode)[XIC(f_sm1_finger_retry_bypass_active),XIC(f_strip_failed),XIC(f_sm1_finger_retry_failed_pending)]OTL(f_sm1_finger_retry_bypass_done);
XIO(z_mode_automatic)[XIC(f_sm1_finger_retry_bypass_active),XIC(f_strip_failed),XIC(f_sm1_finger_retry_failed_pending)]OTL(f_sm1_finger_retry_bypass_done);
```

<details>
<summary>1안 Rung 0~10의 LD와 역할을 펼친다.</summary>


#### Rung 0

ON 요청을 기억한다. OFF가 눌려 있으면 ON 요청을 받지 않는다.

<figure class="ld-rung" data-rung="0" data-rll="XIC(ui_i_sm1_finger_retry_bypass_on)XIO(ui_i_sm1_finger_retry_bypass_off)ONS(sm1_finger_retry_bypass_on_ons)OTL(f_sm1_finger_retry_bypass_enable);">
<div class="rung-meta"><span class="rung-meta-number">SM#1 새 Routine Rung 0</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-finger-retry-v5/sm1_new_00.svg" alt="SM#1 새 Routine Rung 0" width="920" height="160">
</figure>

#### Rung 1

OFF 요청을 기억한다. 같은 스캔의 ON 요청보다 OFF가 우선한다.

<figure class="ld-rung" data-rung="1" data-rll="XIC(ui_i_sm1_finger_retry_bypass_off)ONS(sm1_finger_retry_bypass_off_ons)OTU(f_sm1_finger_retry_bypass_enable);">
<div class="rung-meta"><span class="rung-meta-number">SM#1 새 Routine Rung 1</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-finger-retry-v5/sm1_new_01.svg" alt="SM#1 새 Routine Rung 1" width="920" height="160">
</figure>

#### Rung 2

첫 스캔에 기능 선택과 이전 내부 기억을 초기화한다.

<figure class="ld-rung" data-rung="2" data-rll="XIC(S:FS)[OTU(f_sm1_finger_retry_bypass_enable),OTU(f_sm1_finger_retry_bypass_active),OTU(f_sm1_finger_retry_bypass_done),OTU(f_sm1_finger_retry_failed_pending)];">
<div class="rung-meta"><span class="rung-meta-number">SM#1 새 Routine Rung 2</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-finger-retry-v5/sm1_new_02.svg" alt="SM#1 새 Routine Rung 2" width="920" height="160">
</figure>

#### Rung 3

실패 신호와 기록이 모두 사라지고 우회가 끝나면 다음 실패를 받을 준비를 한다.

<figure class="ld-rung" data-rung="3" data-rll="XIO(f_strip_failed)XIO(f_sm1_finger_retry_failed_pending)XIO(f_sm1_finger_retry_bypass_active)OTU(f_sm1_finger_retry_bypass_done);">
<div class="rung-meta"><span class="rung-meta-number">SM#1 새 Routine Rung 3</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-finger-retry-v5/sm1_new_03.svg" alt="SM#1 새 Routine Rung 3" width="920" height="160">
</figure>

#### Rung 4

Gate 진입, 리젝트, 자동 모드 이탈로 끝난 실패 건을 기억한다.

<figure class="ld-rung" data-rung="4" data-rll="[XIC(f_copper_in_gate),XIC(f_reject_cathode),XIO(z_mode_automatic)][XIC(f_sm1_finger_retry_bypass_active),XIC(f_strip_failed),XIC(f_sm1_finger_retry_failed_pending)]OTL(f_sm1_finger_retry_bypass_done);">
<div class="rung-meta"><span class="rung-meta-number">SM#1 새 Routine Rung 4</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-finger-retry-v5/sm1_new_04.svg" alt="SM#1 새 Routine Rung 4" width="920" height="160">
</figure>

#### Rung 5

기능 ON인 자동 운전에서 현재 실패 또는 기록된 실패가 있으면 우회를 시작한다.

<figure class="ld-rung" data-rung="5" data-rll="XIC(f_sm1_finger_retry_bypass_enable)XIC(z_mode_automatic)XIO(f_copper_in_gate)XIO(f_reject_cathode)XIO(f_sm1_finger_retry_bypass_done)[XIC(f_strip_failed),XIC(f_sm1_finger_retry_failed_pending)]OTL(f_sm1_finger_retry_bypass_active);">
<div class="rung-meta"><span class="rung-meta-number">SM#1 새 Routine Rung 5</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-finger-retry-v5/sm1_new_05.svg" alt="SM#1 새 Routine Rung 5" width="920" height="160">
</figure>

#### Rung 6

기능 OFF, 자동 모드 이탈, Gate 진입, 리젝트일 때 실제 우회를 끝낸다.

<figure class="ld-rung" data-rung="6" data-rll="[XIO(f_sm1_finger_retry_bypass_enable),XIO(z_mode_automatic),XIC(f_copper_in_gate),XIC(f_reject_cathode)]OTU(f_sm1_finger_retry_bypass_active);">
<div class="rung-meta"><span class="rung-meta-number">SM#1 새 Routine Rung 6</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-finger-retry-v5/sm1_new_06.svg" alt="SM#1 새 Routine Rung 6" width="920" height="160">
</figure>

#### Rung 7

Finger 1의 내부 No Copper 판단값을 만든다. 우회 중에는 0이다.

<figure class="ld-rung" data-rung="7" data-rll="XIC(i_finger_1_no_copper)XIO(f_sm1_finger_retry_bypass_active)OTE(f_sm1_finger1_no_copper_effective);">
<div class="rung-meta"><span class="rung-meta-number">SM#1 새 Routine Rung 7</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-finger-retry-v5/sm1_new_07.svg" alt="SM#1 새 Routine Rung 7" width="920" height="160">
</figure>

#### Rung 8

Finger 2의 내부 No Copper 판단값을 만든다. 우회 중에는 0이다.

<figure class="ld-rung" data-rung="8" data-rll="XIC(i_finger_2_no_copper)XIO(f_sm1_finger_retry_bypass_active)OTE(f_sm1_finger2_no_copper_effective);">
<div class="rung-meta"><span class="rung-meta-number">SM#1 새 Routine Rung 8</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-finger-retry-v5/sm1_new_08.svg" alt="SM#1 새 Routine Rung 8" width="920" height="160">
</figure>

#### Rung 9

HMI에 기능 ON 선택 상태를 전달한다.

<figure class="ld-rung" data-rung="9" data-rll="XIC(f_sm1_finger_retry_bypass_enable)OTE(ui_o_sm1_finger_retry_bypass_enabled);">
<div class="rung-meta"><span class="rung-meta-number">SM#1 새 Routine Rung 9</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-finger-retry-v5/sm1_new_09.svg" alt="SM#1 새 Routine Rung 9" width="920" height="160">
</figure>

#### Rung 10

HMI에 실제 우회 상태를 전달한다.

<figure class="ld-rung" data-rung="10" data-rll="XIC(f_sm1_finger_retry_bypass_active)OTE(ui_o_sm1_finger_retry_bypass_active);">
<div class="rung-meta"><span class="rung-meta-number">SM#1 새 Routine Rung 10</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-finger-retry-v5/sm1_new_10.svg" alt="SM#1 새 Routine Rung 10" width="920" height="160">
</figure>
</details>


### 2. MainRoutine 두 곳에 연결한다

첫 번째 위치는 `Stripping_Machine_1 → MainRoutine`의 수정 전 Rung 0보다 앞이다. 원본 Rung 0은 자동 또는 Single Cycle에서 `DoAutomatic`을 호출하는 다음 로직이다. 원본은 그대로 두고 바로 위에 전처리 JSR 한 개를 넣는다.


```text
[XIC(z_mode_automatic) ,XIC(single_cycle) ][ONS(reset_ons) SFR(DoAutomatic,0) ,[JSR(DoAutomatic,0) ,XIO(single_cycle) JSR(prod_tracking,0) ] ];
```

<figure class="ld-rung" data-rung="0" data-rll="[XIC(z_mode_automatic) ,XIC(single_cycle) ][ONS(reset_ons) SFR(DoAutomatic,0) ,[JSR(DoAutomatic,0) ,XIO(single_cycle) JSR(prod_tracking,0) ] ];">
<div class="rung-meta"><span class="rung-meta-number">SM#1 MainRoutine 원본 Rung 0</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-finger-retry-v5/sm1_main_original.svg" alt="SM#1 MainRoutine 원본 Rung 0" width="920" height="160">
</figure>
추가 후 첫 Rung은 다음과 같다. 원본 Rung 0은 그 다음 Rung으로 밀린다.

```text
JSR(SM1_FingerRetryBypass,0);
```

<figure class="ld-rung" data-rung="0" data-rll="JSR(SM1_FingerRetryBypass,0);">
<div class="rung-meta"><span class="rung-meta-number">SM#1 MainRoutine 추가 Rung 0</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-finger-retry-v5/sm1_main_call.svg" alt="SM#1 MainRoutine 추가 Rung 0" width="920" height="160">
</figure>
두 번째 위치는 수정 전 Rung 4의 `JSR(Background,0);` 바로 뒤, 수정 전 Rung 5의 `JSR(Permits,0);` 바로 앞이다. Background는 기존 배경 처리를 실행한다. 다음 Permits가 실패를 해제하기 전에 그 값을 기록한다.

변경 전 연속 Rung:

```text
JSR(Background,0);
JSR(Permits,0);
```

변경 후 연속 Rung은 다음과 같다. 아래 세 줄은 앞뒤 맥락을 보여준다. 원래 Background와 Permits 호출은 그대로 두고, 사이에 실패 기록 Rung 한 개만 추가한다. 세 줄 전체를 다시 추가하지 않는다.

```text
JSR(Background,0);
XIC(f_strip_failed)OTE(f_sm1_finger_retry_failed_pending);
JSR(Permits,0);
```

<figure class="ld-rung" data-rung="6" data-rll="XIC(f_strip_failed)OTE(f_sm1_finger_retry_failed_pending);">
<div class="rung-meta"><span class="rung-meta-number">SM#1 MainRoutine 추가 실패 기록 Rung, 새 위치 예상 6</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-finger-retry-v5/sm1_main_capture.svg" alt="SM#1 MainRoutine 추가 실패 기록 Rung, 새 위치 예상 6" width="920" height="160">
</figure>
원본에서 두 개만 추가했다면 `Background`는 새 Rung 5, 기록은 6, `Permits`는 7, `BasicControl`은 8이다. 현장에 다른 추가 Rung이 있으면 이 번호보다 위 원문과 호출 순서를 먼저 대조한다.

### 3. BasicControl의 완료 Rung 두 개를 교체한다

이 Rung은 실제 Finger Down과 No Copper 판단으로 상위 SFC가 읽는 완료 비트를 만든다. 우회는 No Copper에만 적용한다. 별도 완료 OTE를 추가하지 않는다.


#### Finger 1: 원본 Rung 52

변경 전:

```text
XIC(i_finger_1_down)XIO(i_finger_1_no_copper)OTE(f_finger1_separated);
```

<figure class="ld-rung" data-rung="52" data-rll="XIC(i_finger_1_down)XIO(i_finger_1_no_copper)OTE(f_finger1_separated);">
<div class="rung-meta"><span class="rung-meta-number">SM#1 Finger 1 완료 변경 전</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-finger-retry-v5/sm1_f1_before.svg" alt="SM#1 Finger 1 완료 변경 전" width="920" height="160">
</figure>
변경 후:

```text
XIC(i_finger_1_down)XIO(f_sm1_finger1_no_copper_effective)OTE(f_finger1_separated);
```

<figure class="ld-rung" data-rung="52" data-rll="XIC(i_finger_1_down)XIO(f_sm1_finger1_no_copper_effective)OTE(f_finger1_separated);">
<div class="rung-meta"><span class="rung-meta-number">SM#1 Finger 1 완료 변경 후</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-finger-retry-v5/sm1_f1_after.svg" alt="SM#1 Finger 1 완료 변경 후" width="920" height="160">
</figure>

#### Finger 2: 원본 Rung 53

변경 전:

```text
XIC(i_finger_2_down)XIO(i_finger_2_no_copper)OTE(f_finger2_separated);
```

<figure class="ld-rung" data-rung="53" data-rll="XIC(i_finger_2_down)XIO(i_finger_2_no_copper)OTE(f_finger2_separated);">
<div class="rung-meta"><span class="rung-meta-number">SM#1 Finger 2 완료 변경 전</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-finger-retry-v5/sm1_f2_before.svg" alt="SM#1 Finger 2 완료 변경 전" width="920" height="160">
</figure>
변경 후:

```text
XIC(i_finger_2_down)XIO(f_sm1_finger2_no_copper_effective)OTE(f_finger2_separated);
```

<figure class="ld-rung" data-rung="53" data-rll="XIC(i_finger_2_down)XIO(f_sm1_finger2_no_copper_effective)OTE(f_finger2_separated);">
<div class="rung-meta"><span class="rung-meta-number">SM#1 Finger 2 완료 변경 후</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-finger-retry-v5/sm1_f2_after.svg" alt="SM#1 Finger 2 완료 변경 후" width="920" height="160">
</figure>
### 4. Finger SFC의 전이 조건을 교체한다

다음 그림은 원본 Step 두 개와 그 사이 Transition만 보여주는 확대도이다. Action과 상위 `DoSeparation`은 생략했다. Step·Transition 이름과 상대 간격은 L5X에서 읽었고, 그림은 L5X Ladder Studio의 SFC 렌더러로 표시한다. Step, Action, `.DN` 시간은 바꾸지 않는다.


#### Finger1Separate / Tran_099

`State_Lower_Finger1_001`가 Finger 하강 명령을 내린다. 아래 `Tran_099`은 No Copper 또는 Step 시간 만료를 판단해 `State_raise_finger1_001`로 이동한다. 변경할 곳은 이 Transition의 조건 전체이다. 원본 PRE는 2500 ms이다.

변경 전:

```text
(i_finger_1_down and i_finger_1_no_copper) or State_Lower_Finger1_001.DN
```

<div class="sfc-snippet" data-transition-id="15" data-transition-y="260" data-next-y="340">
<div class="sfc-step">State_Lower_Finger1_001</div>
<div class="sfc-transition"><b>Tran_099</b></div>
<code>(i_finger_1_down and i_finger_1_no_copper) or State_Lower_Finger1_001.DN</code>
<div class="sfc-step">State_raise_finger1_001</div>
</div>
변경 후:

```text
(i_finger_1_down and f_sm1_finger1_no_copper_effective) or State_Lower_Finger1_001.DN
```

<div class="sfc-snippet" data-transition-id="15" data-transition-y="260" data-next-y="340">
<div class="sfc-step">State_Lower_Finger1_001</div>
<div class="sfc-transition"><b>Tran_099</b></div>
<code>(i_finger_1_down and f_sm1_finger1_no_copper_effective) or State_Lower_Finger1_001.DN</code>
<div class="sfc-step">State_raise_finger1_001</div>
</div>

#### Finger2Separate / Tran_103

`State_Lower_Finger_001`가 Finger 하강 명령을 내린다. 아래 `Tran_103`은 No Copper 또는 Step 시간 만료를 판단해 `State_raise_finger_001`로 이동한다. 변경할 곳은 이 Transition의 조건 전체이다. 원본 PRE는 2500 ms이다.

변경 전:

```text
(i_finger_2_down and i_finger_2_no_copper) or State_Lower_Finger_001.DN
```

<div class="sfc-snippet" data-transition-id="15" data-transition-y="280" data-next-y="400">
<div class="sfc-step">State_Lower_Finger_001</div>
<div class="sfc-transition"><b>Tran_103</b></div>
<code>(i_finger_2_down and i_finger_2_no_copper) or State_Lower_Finger_001.DN</code>
<div class="sfc-step">State_raise_finger_001</div>
</div>
변경 후:

```text
(i_finger_2_down and f_sm1_finger2_no_copper_effective) or State_Lower_Finger_001.DN
```

<div class="sfc-snippet" data-transition-id="15" data-transition-y="280" data-next-y="400">
<div class="sfc-step">State_Lower_Finger_001</div>
<div class="sfc-transition"><b>Tran_103</b></div>
<code>(i_finger_2_down and f_sm1_finger2_no_copper_effective) or State_Lower_Finger_001.DN</code>
<div class="sfc-step">State_raise_finger_001</div>
</div>

[SM#1 전체 변경 위치·원본·변경 후 TXT 다운로드](/downloads/csm-finger-retry-v5/sm1_changes.txt)


## SM#2 적용

대상 Program은 `Stripping_Machine_2`이다. 아래 태그는 모두 이 Program의 `Parameters and Local Tags`에 만든다. 모두 BOOL이며 초기값은 0이다. Controller Scope에는 만들지 않는다. 기존 같은 이름의 태그는 재사용한다. 이전 안내서의 8개 태그에 내부 태그 4개를 추가하므로 장비당 12개이다.

| 태그 | External Access | 역할 |
|---|---|---|
| `ui_i_sm2_finger_retry_bypass_on` | Read/Write | ON 순간 요청이다. |
| `ui_i_sm2_finger_retry_bypass_off` | Read/Write | OFF 순간 요청이다. |
| `ui_o_sm2_finger_retry_bypass_enabled` | Read Only | 기능 ON 선택 상태를 표시한다. |
| `ui_o_sm2_finger_retry_bypass_active` | Read Only | 현재 실제 센서 우회 상태를 표시한다. |
| `f_sm2_finger_retry_bypass_enable` | None | 기능 선택을 기억한다. |
| `f_sm2_finger_retry_bypass_active` | None | 현재 실패 건의 우회를 기억한다. |
| `sm2_finger_retry_bypass_on_ons` | None | ON 버튼 ONS 저장 비트이다. |
| `sm2_finger_retry_bypass_off_ons` | None | OFF 버튼 ONS 저장 비트이다. |
| `f_sm2_finger_retry_bypass_done` | None | 완료·중단된 실패 건의 재시작을 막는다. |
| `f_sm2_finger_retry_failed_pending` | None | Permits에서 지워지기 전 실패 발생을 보관한다. |
| `f_sm2_finger1_no_copper_effective` | None | Finger 1에 사용할 No Copper 판단값이다. |
| `f_sm2_finger2_no_copper_effective` | None | Finger 2에 사용할 No Copper 판단값이다. |

### 1. 새 RLL Routine을 만든다

`Stripping_Machine_2 → Routines → New Routine`에서 이름을 `SM2_FingerRetryBypass`, Type을 Ladder Diagram으로 지정한다. 새 Routine의 Rung 0부터 다음 11개를 순서대로 입력한다. 이 코드는 기존 BasicControl 뒤에 붙이는 코드가 아니다.

[SM#2 새 Routine RLL 다운로드](/downloads/csm-finger-retry-v5/sm2_routine.txt)

### 완료 래치 조건 입력안 선택

아래 두 안은 논리적으로 같다. 현장에서는 1안 또는 2안 중 하나만 입력한다. 두 안을 함께 넣으면 `OTL`이 중복되어 원인 추적이 어려워진다.

#### 1안: 압축형 중첩 병렬 Rung

`[A,B,C]`는 A·B·C 중 하나이고, 바로 뒤의 `[D,E,F]`와는 직렬 AND이다. L5X Ladder Studio는 이 표기를 파싱하지만, Studio 5000에서 직접 입력할 때 중첩 분기가 익숙하지 않으면 2안을 선택한다.



```text
XIC(ui_i_sm2_finger_retry_bypass_on)XIO(ui_i_sm2_finger_retry_bypass_off)ONS(sm2_finger_retry_bypass_on_ons)OTL(f_sm2_finger_retry_bypass_enable);
XIC(ui_i_sm2_finger_retry_bypass_off)ONS(sm2_finger_retry_bypass_off_ons)OTU(f_sm2_finger_retry_bypass_enable);
XIC(S:FS)[OTU(f_sm2_finger_retry_bypass_enable),OTU(f_sm2_finger_retry_bypass_active),OTU(f_sm2_finger_retry_bypass_done),OTU(f_sm2_finger_retry_failed_pending)];
XIO(f_strip_failed)XIO(f_sm2_finger_retry_failed_pending)XIO(f_sm2_finger_retry_bypass_active)OTU(f_sm2_finger_retry_bypass_done);
[XIC(f_copper_in_gate),XIC(f_reject_cathode),XIO(z_mode_automatic)][XIC(f_sm2_finger_retry_bypass_active),XIC(f_strip_failed),XIC(f_sm2_finger_retry_failed_pending)]OTL(f_sm2_finger_retry_bypass_done);
XIC(f_sm2_finger_retry_bypass_enable)XIC(z_mode_automatic)XIO(f_copper_in_gate)XIO(f_reject_cathode)XIO(f_sm2_finger_retry_bypass_done)[XIC(f_strip_failed),XIC(f_sm2_finger_retry_failed_pending)]OTL(f_sm2_finger_retry_bypass_active);
[XIO(f_sm2_finger_retry_bypass_enable),XIO(z_mode_automatic),XIC(f_copper_in_gate),XIC(f_reject_cathode)]OTU(f_sm2_finger_retry_bypass_active);
XIC(i_finger_1_no_copper)XIO(f_sm2_finger_retry_bypass_active)OTE(f_sm2_finger1_no_copper_effective);
XIC(i_finger_2_no_copper)XIO(f_sm2_finger_retry_bypass_active)OTE(f_sm2_finger2_no_copper_effective);
XIC(f_sm2_finger_retry_bypass_enable)OTE(ui_o_sm2_finger_retry_bypass_enabled);
XIC(f_sm2_finger_retry_bypass_active)OTE(ui_o_sm2_finger_retry_bypass_active);
```


#### 2안: 현장 입력용 분리 Rung

1안의 완료 Rung 4만 제거하고 아래 세 Rung을 같은 위치에 넣는다. 나머지 Rung 0~3, 5~10은 그대로 둔다. 2안은 모두 13개 Rung이다.



```text
XIC(f_copper_in_gate)[XIC(f_sm2_finger_retry_bypass_active),XIC(f_strip_failed),XIC(f_sm2_finger_retry_failed_pending)]OTL(f_sm2_finger_retry_bypass_done);
XIC(f_reject_cathode)[XIC(f_sm2_finger_retry_bypass_active),XIC(f_strip_failed),XIC(f_sm2_finger_retry_failed_pending)]OTL(f_sm2_finger_retry_bypass_done);
XIO(z_mode_automatic)[XIC(f_sm2_finger_retry_bypass_active),XIC(f_strip_failed),XIC(f_sm2_finger_retry_failed_pending)]OTL(f_sm2_finger_retry_bypass_done);
```

<details>
<summary>1안 Rung 0~10의 LD와 역할을 펼친다.</summary>


#### Rung 0

ON 요청을 기억한다. OFF가 눌려 있으면 ON 요청을 받지 않는다.

<figure class="ld-rung" data-rung="0" data-rll="XIC(ui_i_sm2_finger_retry_bypass_on)XIO(ui_i_sm2_finger_retry_bypass_off)ONS(sm2_finger_retry_bypass_on_ons)OTL(f_sm2_finger_retry_bypass_enable);">
<div class="rung-meta"><span class="rung-meta-number">SM#2 새 Routine Rung 0</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-finger-retry-v5/sm2_new_00.svg" alt="SM#2 새 Routine Rung 0" width="920" height="160">
</figure>

#### Rung 1

OFF 요청을 기억한다. 같은 스캔의 ON 요청보다 OFF가 우선한다.

<figure class="ld-rung" data-rung="1" data-rll="XIC(ui_i_sm2_finger_retry_bypass_off)ONS(sm2_finger_retry_bypass_off_ons)OTU(f_sm2_finger_retry_bypass_enable);">
<div class="rung-meta"><span class="rung-meta-number">SM#2 새 Routine Rung 1</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-finger-retry-v5/sm2_new_01.svg" alt="SM#2 새 Routine Rung 1" width="920" height="160">
</figure>

#### Rung 2

첫 스캔에 기능 선택과 이전 내부 기억을 초기화한다.

<figure class="ld-rung" data-rung="2" data-rll="XIC(S:FS)[OTU(f_sm2_finger_retry_bypass_enable),OTU(f_sm2_finger_retry_bypass_active),OTU(f_sm2_finger_retry_bypass_done),OTU(f_sm2_finger_retry_failed_pending)];">
<div class="rung-meta"><span class="rung-meta-number">SM#2 새 Routine Rung 2</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-finger-retry-v5/sm2_new_02.svg" alt="SM#2 새 Routine Rung 2" width="920" height="160">
</figure>

#### Rung 3

실패 신호와 기록이 모두 사라지고 우회가 끝나면 다음 실패를 받을 준비를 한다.

<figure class="ld-rung" data-rung="3" data-rll="XIO(f_strip_failed)XIO(f_sm2_finger_retry_failed_pending)XIO(f_sm2_finger_retry_bypass_active)OTU(f_sm2_finger_retry_bypass_done);">
<div class="rung-meta"><span class="rung-meta-number">SM#2 새 Routine Rung 3</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-finger-retry-v5/sm2_new_03.svg" alt="SM#2 새 Routine Rung 3" width="920" height="160">
</figure>

#### Rung 4

Gate 진입, 리젝트, 자동 모드 이탈로 끝난 실패 건을 기억한다.

<figure class="ld-rung" data-rung="4" data-rll="[XIC(f_copper_in_gate),XIC(f_reject_cathode),XIO(z_mode_automatic)][XIC(f_sm2_finger_retry_bypass_active),XIC(f_strip_failed),XIC(f_sm2_finger_retry_failed_pending)]OTL(f_sm2_finger_retry_bypass_done);">
<div class="rung-meta"><span class="rung-meta-number">SM#2 새 Routine Rung 4</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-finger-retry-v5/sm2_new_04.svg" alt="SM#2 새 Routine Rung 4" width="920" height="160">
</figure>

#### Rung 5

기능 ON인 자동 운전에서 현재 실패 또는 기록된 실패가 있으면 우회를 시작한다.

<figure class="ld-rung" data-rung="5" data-rll="XIC(f_sm2_finger_retry_bypass_enable)XIC(z_mode_automatic)XIO(f_copper_in_gate)XIO(f_reject_cathode)XIO(f_sm2_finger_retry_bypass_done)[XIC(f_strip_failed),XIC(f_sm2_finger_retry_failed_pending)]OTL(f_sm2_finger_retry_bypass_active);">
<div class="rung-meta"><span class="rung-meta-number">SM#2 새 Routine Rung 5</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-finger-retry-v5/sm2_new_05.svg" alt="SM#2 새 Routine Rung 5" width="920" height="160">
</figure>

#### Rung 6

기능 OFF, 자동 모드 이탈, Gate 진입, 리젝트일 때 실제 우회를 끝낸다.

<figure class="ld-rung" data-rung="6" data-rll="[XIO(f_sm2_finger_retry_bypass_enable),XIO(z_mode_automatic),XIC(f_copper_in_gate),XIC(f_reject_cathode)]OTU(f_sm2_finger_retry_bypass_active);">
<div class="rung-meta"><span class="rung-meta-number">SM#2 새 Routine Rung 6</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-finger-retry-v5/sm2_new_06.svg" alt="SM#2 새 Routine Rung 6" width="920" height="160">
</figure>

#### Rung 7

Finger 1의 내부 No Copper 판단값을 만든다. 우회 중에는 0이다.

<figure class="ld-rung" data-rung="7" data-rll="XIC(i_finger_1_no_copper)XIO(f_sm2_finger_retry_bypass_active)OTE(f_sm2_finger1_no_copper_effective);">
<div class="rung-meta"><span class="rung-meta-number">SM#2 새 Routine Rung 7</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-finger-retry-v5/sm2_new_07.svg" alt="SM#2 새 Routine Rung 7" width="920" height="160">
</figure>

#### Rung 8

Finger 2의 내부 No Copper 판단값을 만든다. 우회 중에는 0이다.

<figure class="ld-rung" data-rung="8" data-rll="XIC(i_finger_2_no_copper)XIO(f_sm2_finger_retry_bypass_active)OTE(f_sm2_finger2_no_copper_effective);">
<div class="rung-meta"><span class="rung-meta-number">SM#2 새 Routine Rung 8</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-finger-retry-v5/sm2_new_08.svg" alt="SM#2 새 Routine Rung 8" width="920" height="160">
</figure>

#### Rung 9

HMI에 기능 ON 선택 상태를 전달한다.

<figure class="ld-rung" data-rung="9" data-rll="XIC(f_sm2_finger_retry_bypass_enable)OTE(ui_o_sm2_finger_retry_bypass_enabled);">
<div class="rung-meta"><span class="rung-meta-number">SM#2 새 Routine Rung 9</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-finger-retry-v5/sm2_new_09.svg" alt="SM#2 새 Routine Rung 9" width="920" height="160">
</figure>

#### Rung 10

HMI에 실제 우회 상태를 전달한다.

<figure class="ld-rung" data-rung="10" data-rll="XIC(f_sm2_finger_retry_bypass_active)OTE(ui_o_sm2_finger_retry_bypass_active);">
<div class="rung-meta"><span class="rung-meta-number">SM#2 새 Routine Rung 10</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-finger-retry-v5/sm2_new_10.svg" alt="SM#2 새 Routine Rung 10" width="920" height="160">
</figure>
</details>


### 2. MainRoutine 두 곳에 연결한다

첫 번째 위치는 `Stripping_Machine_2 → MainRoutine`의 수정 전 Rung 0보다 앞이다. 원본 Rung 0은 자동 또는 Single Cycle에서 `DoAutomatic`을 호출하는 다음 로직이다. 원본은 그대로 두고 바로 위에 전처리 JSR 한 개를 넣는다.


```text
[XIC(z_mode_automatic) ,XIC(single_cycle) ]XIO(ui_i_test)[ONS(reset_ons) SFR(DoAutomatic,0) ,[JSR(DoAutomatic,0) ,XIO(single_cycle) JSR(prod_tracking,0) ] ];
```

<figure class="ld-rung" data-rung="0" data-rll="[XIC(z_mode_automatic) ,XIC(single_cycle) ]XIO(ui_i_test)[ONS(reset_ons) SFR(DoAutomatic,0) ,[JSR(DoAutomatic,0) ,XIO(single_cycle) JSR(prod_tracking,0) ] ];">
<div class="rung-meta"><span class="rung-meta-number">SM#2 MainRoutine 원본 Rung 0</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-finger-retry-v5/sm2_main_original.svg" alt="SM#2 MainRoutine 원본 Rung 0" width="920" height="160">
</figure>
추가 후 첫 Rung은 다음과 같다. 원본 Rung 0은 그 다음 Rung으로 밀린다.

```text
JSR(SM2_FingerRetryBypass,0);
```

<figure class="ld-rung" data-rung="0" data-rll="JSR(SM2_FingerRetryBypass,0);">
<div class="rung-meta"><span class="rung-meta-number">SM#2 MainRoutine 추가 Rung 0</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-finger-retry-v5/sm2_main_call.svg" alt="SM#2 MainRoutine 추가 Rung 0" width="920" height="160">
</figure>
두 번째 위치는 수정 전 Rung 4의 `JSR(Background,0);` 바로 뒤, 수정 전 Rung 5의 `JSR(Permits,0);` 바로 앞이다. Background는 기존 배경 처리를 실행한다. 다음 Permits가 실패를 해제하기 전에 그 값을 기록한다.

변경 전 연속 Rung:

```text
JSR(Background,0);
JSR(Permits,0);
```

변경 후 연속 Rung은 다음과 같다. 아래 세 줄은 앞뒤 맥락을 보여준다. 원래 Background와 Permits 호출은 그대로 두고, 사이에 실패 기록 Rung 한 개만 추가한다. 세 줄 전체를 다시 추가하지 않는다.

```text
JSR(Background,0);
XIC(f_strip_failed)OTE(f_sm2_finger_retry_failed_pending);
JSR(Permits,0);
```

<figure class="ld-rung" data-rung="6" data-rll="XIC(f_strip_failed)OTE(f_sm2_finger_retry_failed_pending);">
<div class="rung-meta"><span class="rung-meta-number">SM#2 MainRoutine 추가 실패 기록 Rung, 새 위치 예상 6</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-finger-retry-v5/sm2_main_capture.svg" alt="SM#2 MainRoutine 추가 실패 기록 Rung, 새 위치 예상 6" width="920" height="160">
</figure>
원본에서 두 개만 추가했다면 `Background`는 새 Rung 5, 기록은 6, `Permits`는 7, `BasicControl`은 8이다. 현장에 다른 추가 Rung이 있으면 이 번호보다 위 원문과 호출 순서를 먼저 대조한다.

### 3. BasicControl의 완료 Rung 두 개를 교체한다

이 Rung은 실제 Finger Down과 No Copper 판단으로 상위 SFC가 읽는 완료 비트를 만든다. 우회는 No Copper에만 적용한다. 별도 완료 OTE를 추가하지 않는다.


#### Finger 1: 원본 Rung 51

변경 전:

```text
XIC(i_finger_1_down)XIO(i_finger_1_no_copper)OTE(f_finger1_separated);
```

<figure class="ld-rung" data-rung="51" data-rll="XIC(i_finger_1_down)XIO(i_finger_1_no_copper)OTE(f_finger1_separated);">
<div class="rung-meta"><span class="rung-meta-number">SM#2 Finger 1 완료 변경 전</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-finger-retry-v5/sm2_f1_before.svg" alt="SM#2 Finger 1 완료 변경 전" width="920" height="160">
</figure>
변경 후:

```text
XIC(i_finger_1_down)XIO(f_sm2_finger1_no_copper_effective)OTE(f_finger1_separated);
```

<figure class="ld-rung" data-rung="51" data-rll="XIC(i_finger_1_down)XIO(f_sm2_finger1_no_copper_effective)OTE(f_finger1_separated);">
<div class="rung-meta"><span class="rung-meta-number">SM#2 Finger 1 완료 변경 후</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-finger-retry-v5/sm2_f1_after.svg" alt="SM#2 Finger 1 완료 변경 후" width="920" height="160">
</figure>

#### Finger 2: 원본 Rung 52

변경 전:

```text
XIC(i_finger_2_down)XIO(i_finger_2_no_copper)OTE(f_finger2_separated);
```

<figure class="ld-rung" data-rung="52" data-rll="XIC(i_finger_2_down)XIO(i_finger_2_no_copper)OTE(f_finger2_separated);">
<div class="rung-meta"><span class="rung-meta-number">SM#2 Finger 2 완료 변경 전</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-finger-retry-v5/sm2_f2_before.svg" alt="SM#2 Finger 2 완료 변경 전" width="920" height="160">
</figure>
변경 후:

```text
XIC(i_finger_2_down)XIO(f_sm2_finger2_no_copper_effective)OTE(f_finger2_separated);
```

<figure class="ld-rung" data-rung="52" data-rll="XIC(i_finger_2_down)XIO(f_sm2_finger2_no_copper_effective)OTE(f_finger2_separated);">
<div class="rung-meta"><span class="rung-meta-number">SM#2 Finger 2 완료 변경 후</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-finger-retry-v5/sm2_f2_after.svg" alt="SM#2 Finger 2 완료 변경 후" width="920" height="160">
</figure>
### 4. Finger SFC의 전이 조건을 교체한다

다음 그림은 원본 Step 두 개와 그 사이 Transition만 보여주는 확대도이다. Action과 상위 `DoSeparation`은 생략했다. Step·Transition 이름과 상대 간격은 L5X에서 읽었고, 그림은 L5X Ladder Studio의 SFC 렌더러로 표시한다. Step, Action, `.DN` 시간은 바꾸지 않는다.


#### Finger1Separate / Tran_155

`State_Lower_Finger1_003`가 Finger 하강 명령을 내린다. 아래 `Tran_155`은 No Copper 또는 Step 시간 만료를 판단해 `State_raise_finger1_003`로 이동한다. 변경할 곳은 이 Transition의 조건 전체이다. 원본 PRE는 2000 ms이다.

변경 전:

```text
(i_finger_1_down and i_finger_1_no_copper) or State_Lower_Finger1_003.DN
```

<div class="sfc-snippet" data-transition-id="16" data-transition-y="260" data-next-y="400">
<div class="sfc-step">State_Lower_Finger1_003</div>
<div class="sfc-transition"><b>Tran_155</b></div>
<code>(i_finger_1_down and i_finger_1_no_copper) or State_Lower_Finger1_003.DN</code>
<div class="sfc-step">State_raise_finger1_003</div>
</div>
변경 후:

```text
(i_finger_1_down and f_sm2_finger1_no_copper_effective) or State_Lower_Finger1_003.DN
```

<div class="sfc-snippet" data-transition-id="16" data-transition-y="260" data-next-y="400">
<div class="sfc-step">State_Lower_Finger1_003</div>
<div class="sfc-transition"><b>Tran_155</b></div>
<code>(i_finger_1_down and f_sm2_finger1_no_copper_effective) or State_Lower_Finger1_003.DN</code>
<div class="sfc-step">State_raise_finger1_003</div>
</div>

#### Finger2Separate / Tran_160

`State_Lower_Finger_003`가 Finger 하강 명령을 내린다. 아래 `Tran_160`은 No Copper 또는 Step 시간 만료를 판단해 `State_raise_finger_003`로 이동한다. 변경할 곳은 이 Transition의 조건 전체이다. 원본 PRE는 2000 ms이다.

변경 전:

```text
(i_finger_2_down and i_finger_2_no_copper) or State_Lower_Finger_003.DN
```

<div class="sfc-snippet" data-transition-id="17" data-transition-y="280" data-next-y="400">
<div class="sfc-step">State_Lower_Finger_003</div>
<div class="sfc-transition"><b>Tran_160</b></div>
<code>(i_finger_2_down and i_finger_2_no_copper) or State_Lower_Finger_003.DN</code>
<div class="sfc-step">State_raise_finger_003</div>
</div>
변경 후:

```text
(i_finger_2_down and f_sm2_finger2_no_copper_effective) or State_Lower_Finger_003.DN
```

<div class="sfc-snippet" data-transition-id="17" data-transition-y="280" data-next-y="400">
<div class="sfc-step">State_Lower_Finger_003</div>
<div class="sfc-transition"><b>Tran_160</b></div>
<code>(i_finger_2_down and f_sm2_finger2_no_copper_effective) or State_Lower_Finger_003.DN</code>
<div class="sfc-step">State_raise_finger_003</div>
</div>

[SM#2 전체 변경 위치·원본·변경 후 TXT 다운로드](/downloads/csm-finger-retry-v5/sm2_changes.txt)


## InTouch 버튼과 표시등

Access Name과 통신 드라이버 설정은 현장 프로젝트를 따른다. 아래 Item은 Logix Program 태그 주소 예시이다. InTouch에서는 I/O Discrete 태그로 연결하고 실제 드라이버가 사용하는 주소 형식을 확인한다. 내부 `f_` 태그를 HMI에서 직접 쓰지 않는다.

| 장비 | HMI 기능 | PLC Item 예시 | 동작 |
|---|---|---|---|
| SM#1 | ON 버튼 | `Program:Stripping_Machine_1.ui_i_sm1_finger_retry_bypass_on` | 누를 때 1, 놓을 때 0을 쓴다. |
| SM#1 | OFF 버튼 | `Program:Stripping_Machine_1.ui_i_sm1_finger_retry_bypass_off` | 누를 때 1, 놓을 때 0을 쓴다. |
| SM#1 | 기능 선택 표시 | `Program:Stripping_Machine_1.ui_o_sm1_finger_retry_bypass_enabled` | 1이면 기능 ON이다. 실제 우회 중이라는 뜻은 아니다. |
| SM#1 | 센서 우회 중 표시 | `Program:Stripping_Machine_1.ui_o_sm1_finger_retry_bypass_active` | 1이면 해당 장비가 현재 전기동 감지 상태로 판단하고 있다. |
| SM#2 | ON 버튼 | `Program:Stripping_Machine_2.ui_i_sm2_finger_retry_bypass_on` | 누를 때 1, 놓을 때 0을 쓴다. |
| SM#2 | OFF 버튼 | `Program:Stripping_Machine_2.ui_i_sm2_finger_retry_bypass_off` | 누를 때 1, 놓을 때 0을 쓴다. |
| SM#2 | 기능 선택 표시 | `Program:Stripping_Machine_2.ui_o_sm2_finger_retry_bypass_enabled` | 1이면 기능 ON이다. 실제 우회 중이라는 뜻은 아니다. |
| SM#2 | 센서 우회 중 표시 | `Program:Stripping_Machine_2.ui_o_sm2_finger_retry_bypass_active` | 1이면 해당 장비가 현재 전기동 감지 상태로 판단하고 있다. |

ON/OFF 버튼은 순간 요청이다. 기존 STRIP 버튼 `ui_i_auto_separate`의 유지 방식은 바꾸지 않는다. 이 입력이 0이면 원본 `DoAutoModeManualControls`는 `DoSeparation`을 Reset하고, OFF 에지에서 `HomeAll`을 호출한다. 새 ON/OFF 버튼과 STRIP 버튼을 같은 태그로 연결하지 않는다.

## 이전 정지 증상과 이번 수정안의 한계

첫 동작에서 `f_strip_failed=0`이면 Enable이 ON이어도 Active는 0이어야 한다. 이때 하강 입력이 1이고 No Copper가 0이면 상위 완료 경로가, No Copper가 1이면 하위 Finger 올림·Hammer 경로가 성립한다. 어느 쪽도 진행하지 않았다면 실제 적용 조건, 하강 위치 입력, SFC 실행 여부, 다음 동작 출력 조건을 확인해야 한다. 이번 개정이 오늘 현장 정지 원인을 확정한 결과는 아니다.

상위 `DoSeparation`의 Finger 완료 전이는 완료 비트를 기다린다. 하위 Step의 `.DN`은 Finger 올림·Hammer 경로를 열 뿐, 상위 탈취 성공을 보장하지 않는다. 따라서 이전 문서의 “타임아웃이 남아 있으므로 무기한 멈추지 않는다”는 설명은 사용하지 않는다. 시간이 지났다고 완료 비트를 강제로 켜거나 다음 Step으로 넘기지 않는다.

## 모의시험과 현장 확인

모의시험은 문서와 같은 RLL을 L5X Ladder Studio 파서로 읽어 XIC·XIO·ONS·OTL·OTU·OTE를 순서대로 실행한다. SFC 조건은 원본에서 읽은 식을 평가한다. Main의 전처리, SFC, 실패 기록, Permits 해제, BasicControl 순서를 모델링한다. 전체 Controller·유압·실제 센서·InTouch를 실행하는 Studio 에뮬레이터는 아니다. Neutral Text의 명령·분기·세미콜론 형식은 [Rockwell Logix 5000 Controllers General Instructions Reference Manual](https://literature.rockwellautomation.com/idc/groups/literature/documents/rm/1756-rm014_-en-p.pdf)의 형식과 대조했다. Studio 5000 v31 Controller Verify와 현장 운전은 수행하지 않았다.

원본·수정 후 OFF·수정 후 ON을 SM#1/SM#2의 Finger 1/2에 각각 적용한 총 12개 추적(68개 스캔)을 실행했다. 제한된 시험 입력에서 OFF 경로는 원본의 SFC 전이·완료 비트·Gate 결과와 같았다. ON 경로는 첫 정상 하강에서 실제 센서를 따르고, 실패를 포착한 다음 스캔에 Active가 켜져 센서 판단을 우회하며, Gate 신호 뒤에는 Active만 꺼지고 Enable은 유지됐다. 이는 아래의 전체 상태공간·실기 시험을 대체하지 않는다.

| 시험 | 합격 기준 |
|---|---|
| OFF 동등성 | 두 Finger의 Down·No Copper·DN 조합에서 완료 비트와 SFC 조건이 원본과 같다. |
| ON, 실패 전 | 첫 정상 동작은 실제 센서로 진행한다. |
| 실패 발생 및 실패 중 ON | Retry Step 진입 전이라도 실패를 확인하면 Active가 켜진다. |
| Permits가 실패 해제 | 그 앞에서 기록한 실패가 다음 스캔에 반영된다. |
| 실패 비트 조기 해제 | 이미 시작한 Active는 Gate 전까지 유지된다. |
| Gate 진입 | 다음 Program 스캔 시작에서 Active만 0이 된다. Enable은 1이다. |
| 같은 실패 잔류 | Gate 완료 뒤 실패 비트가 남아도 다시 켜지지 않는다. |
| 다음 실패 | 실패가 해제되고 다시 발생하면 우회가 재시작한다. |
| 실제 Down 보호 | Active가 1이어도 Down이 0이면 완료 비트는 0이다. |
| OFF·리젝트·모드 이탈·첫 스캔 | 정해진 우회 해제와 재시작 제한이 동작한다. |
| ON/OFF 동시 및 OFF 유지 | OFF가 우선하며 OFF를 누르고 있는 동안 ON으로 바뀌지 않는다. |
| 장비 독립성 | SM#1 요청과 기억이 SM#2에 영향을 주지 않는다. |
| 하강 뒤 진행 | Active=1, Down=1, DN=0인 안정 입력에서 상위 완료가 다음 실행에 성립한다. |
| 센서 변화 | Active=0일 때 실제 No Copper를 따르고, Active=1일 때 내부 No Copper는 0이다. |

[스캔별 원본·OFF·ON 비교표](/downloads/csm-finger-retry-v5/simulation.md) · [시뮬레이션 JSON](/downloads/csm-finger-retry-v5/simulation.json) · [검증 결과 JSON](/downloads/csm-finger-retry-v5/validation.json) · [변경 명세 JSON](/downloads/csm-finger-retry-v5/manifest.json)

현장 수정본을 확보하면 먼저 그 파일과 이 문서의 원본 식을 비교한다. 검증된 입력값 조합과 실제 멈춘 Step을 맞춘 뒤, 승인된 시험 시간에 한 장비씩 확인한다. 기록할 값은 Enable, Active, failed_pending, bypass_done, `f_strip_failed`, `f_copper_in_gate`, 두 Finger의 실제 Down·No Copper·내부 판단값·완료 비트, 해당 하강 Step의 `.X/.T/.DN`, `ui_i_auto_separate`이다. 임의 failed 또는 물리 입력 Force만으로 합격을 판정하지 않는다.

## 원본으로 복구할 때

장비를 정지하고 기능 OFF와 Active=0을 확인한다. 두 MainRoutine에서 새 전처리 JSR과 실패 기록 Rung을 제거한다. 두 BasicControl의 완료 Rung과 네 SFC Transition은 위의 변경 전 원문으로 되돌린다. 새 Routine과 태그는 참조가 없는지 확인한 뒤 정리한다. 이전 버전의 추가 6개 Rung을 다시 넣는 것은 원본 복구가 아니다.

## 생성 기준

원본 파일: `Cathode1_260915.L5X`. Controller: `Cathode1`. ExportDate: `Tue Sep 15 05:02:19 2026`. SHA-256: `c09af47a9d79884231d944d78b94468480f8ff8e76e778d5e5f2b1d974561a7f`. 생성기는 원본 L5X를 읽기만 한다.

재생성은 작업 저장소에서 `python3 scripts/sm_finger_retry/generate.py`와 `node scripts/sm_finger_retry/verify.mjs`를 실행한다. 사이트 경로는 생성기의 `--site` 인자로 바꿀 수 있다.

Step의 PRE·DN 의미는 [Rockwell SFC Step 설명](https://www.rockwellautomation.com/en-be/docs/studio-5000-logix-designer/37-01/contents-ditamap/instruction-set/sfc-instructions/step.html)을 따른다.
