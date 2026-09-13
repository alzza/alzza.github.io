---
title: SC1 SM#1·SM#2 Finger 센서 Retry 전용 ON/OFF 적용서
date: "2026-09-13"
excerpt: 60초 타이머 없이 SM#1과 SM#2의 Retry 전용 Finger 센서 우회를 각각 ON/OFF하는 PLC·InTouch 적용서이다. ON이어도 실제 Retry 중에만 센서를 우회한다.
kicker: PLC
tags: ["PLC", "InTouch", "SC1", "SM1", "SM2", "Retry"]
---

이 문서는 60초 타이머를 사용하지 않는 별도 방식이다. 작업자가 SM#1 또는 SM#2의 기능을 ON으로 선택하면 PLC가 그 상태를 기억하지만, 실제 우회 출력은 Retry 중에만 켠다. Retry가 아닐 때는 ON 상태여도 기존 Finger No Copper 센서를 그대로 사용한다.

최신 확인 기준은 `Cathode1.L5X`(Controller `Cathode1`, SoftwareRevision 31.00, ExportDate 2026-06-20)이다. 아래 RLL과 LD는 이 파일의 현재 원본을 기준으로 다시 대조했다. L5X 자체는 수정하지 않았다.

| 기능 상태 | 실제 조건 | Finger 완료 판정 |
|---|---|---|
| OFF | 항상 일반 운전이다. | 실제 `i_finger_*_no_copper` 입력만 사용한다. |
| ON, Retry 아님 | 기능은 대기 상태다. `f_auto_mode_manual_retry=0`이면 우회하지 않는다. | 실제 센서 입력을 사용한다. |
| ON, Retry 중 | `f_auto_mode_manual_retry=1`이고 게이트 성공·리젝트 조건이 아직 없을 때만 우회한다. | `Finger Down`과 Retry 전용 우회 상태를 사용한다. |

이 버전에는 60초 버튼, TON, ACC, 남은 시간 표시가 없다. ON 상태는 OFF 버튼을 누르거나 컨트롤러가 첫 스캔을 할 때까지 유지된다. 따라서 ON으로 둔 장비는 다음 Retry에서도 같은 정책을 사용한다.

## 확인된 원본과 변경 위치

기준 파일은 `Cathode1(260714).L5X`이다. 기준 L5X, PLC, 로봇 LS는 수정하지 않았다.

| 장비 | 프로그램과 Routine | 추가 위치 | 완료 Rung 변경 |
|---|---|---|---|
| SM#1 | `Stripping_Machine_1 > BasicControl` | 원본 `f_copper_in_gate` Rung 46 바로 다음이다. | 원본 Rung 52, 53이다. |
| SM#2 | `Stripping_Machine_2 > BasicControl` | 원본 `f_copper_in_gate` Rung 45 바로 다음이다. | 원본 Rung 51, 52이다. |

### 현장 입력 순서

#### SM#1

1. Studio 5000에서 `Programs → Stripping_Machine_1 → Routines → BasicControl`을 연다.
2. 원본 Rung **46**의 내용이 `XIO(i_copper_not_in_gate_right)XIO(i_copper_not_in_gate_left)OTE(f_copper_in_gate);`인지 확인한다.
3. **Rung 46 바로 다음**에 SM#1용 추가 Rung 4개를 순서대로 삽입한다.
4. 원본 Finger 완료 Rung **52**의 `f_finger1_separated`, Rung **53**의 `f_finger2_separated`를 변경 후 RLL로 교체한다.

#### SM#2

1. `Programs → Stripping_Machine_2 → Routines → BasicControl`을 연다.
2. 원본 Rung **45**의 내용이 `XIO(i_copper_not_in_gate_left)XIO(i_copper_not_in_gate_right)OTE(f_copper_in_gate);`인지 확인한다.
3. **Rung 45 바로 다음**에 SM#2용 추가 Rung 4개를 순서대로 삽입한다.
4. 원본 Finger 완료 Rung **51**의 `f_finger1_separated`, Rung **52**의 `f_finger2_separated`를 변경 후 RLL로 교체한다.

> Rung 번호는 수정 전 L5X의 원본 번호다. 중간에 Rung을 삽입하면 Studio 5000이 뒤쪽 번호를 다시 매길 수 있으므로, 현장에서는 번호보다 위의 **Rung 내용과 태그명**을 함께 확인한다.

Retry를 여는 원본 판정은 `f_strip_failed`이다. 실제 Retry 스텝은 SM#1의 `State_Manual_Retry_001`, SM#2의 `State_Manual_Retry_003`이며, 두 스텝의 Action이 `f_auto_mode_manual_retry := 1`을 만든다. 새 로직은 `f_secsep_failed`, `State_Manual_Retry.X`, `z_mode_manual`을 사용하지 않는다.

### 최신 L5X 대조 결과

| 확인 항목 | SM#1 | SM#2 |
|---|---|---|
| `f_copper_in_gate` 원본 Rung | 46 | 45 |
| Finger 1 완료 원본 Rung | 52 | 51 |
| Finger 2 완료 원본 Rung | 53 | 52 |
| Retry Step | `State_Manual_Retry_001` | `State_Manual_Retry_003` |
| Retry Action | `f_auto_mode_manual_retry := 1` | `f_auto_mode_manual_retry := 1` |
| No Copper 입력 Alias | `N4:1:I.5`, `N4:1:I.6` | `N6:1:I.5`, `N6:1:I.6` |

따라서 `ld_rung_00.svg`가 현재 원본 Finger 1 완료 Rung이고, `ld_rung_03.svg`는 이 문서의 원본 Rung이 아니다. `ld_rung_03.svg`는 이전 검증 묶음의 `S:FS` 초기화 Rung이어서 변경 전 그림으로 사용하면 안 된다.

기존 STRIP 버튼 `ui_i_auto_separate`와 `DoSeparation`은 바꾸지 않는다. SFC도 바꾸지 않는다. `Finger Down` 입력도 그대로 유지한다.

## 변경 전과 변경 후 LD

아래 LD는 입력할 Neutral Text를 변환한 보기용 예시다. 이미지 안의 Rung 번호는 변환 묶음의 순번이며, 실제 L5X에 삽입할 때는 위의 프로그램명·Routine명·원본 Rung 내용으로 위치를 찾는다.

### 변경 전

![변경 전 Finger 완료 Rung](/images/notes/sc1-sm-finger-retry-onoff/ld_rung_00.svg?v=l5x-cathode1-20260913)

```text
XIC(i_finger_1_down)XIO(i_finger_1_no_copper)OTE(f_finger1_separated);
```

### 변경 후

![변경 후 SM1 Finger 완료 Rung](/images/notes/sc1-sm-finger-retry-onoff/ld_rung_05.svg?v=full-tags-20260913)

```text
XIC(i_finger_1_down)[XIO(i_finger_1_no_copper),XIC(z_sm1_finger_retry_bypass_active)]OTE(f_finger1_separated);
```

![변경 후 SM2 Finger 완료 Rung](/images/notes/sc1-sm-finger-retry-onoff/ld_rung_11.svg?v=full-tags-20260913)

SM#1과 SM#2의 Finger 완료 Rung 구조는 동일하고 프로그램 로컬 태그로 분리된다. 따라서 SM#2에서는 반드시 `Stripping_Machine_2 > BasicControl` 안에서 작업하고, SM#1의 `z_sm1_*`와 SM#2의 `z_sm2_*`를 서로 바꾸지 않는다.

### 추가 Rung 4개의 LD 보기

<details>
<summary>SM#1 추가 Rung 4개 펼치기</summary>

![SM#1 ON 래치 LD](/images/notes/sc1-sm-finger-retry-onoff/ld_rung_01.svg?v=full-tags-20260913)
![SM#1 OFF 래치 LD](/images/notes/sc1-sm-finger-retry-onoff/ld_rung_02.svg?v=full-tags-20260913)
![SM#1 첫 스캔 초기화 LD](/images/notes/sc1-sm-finger-retry-onoff/ld_rung_03.svg?v=full-tags-20260913)
![SM#1 Retry Active LD](/images/notes/sc1-sm-finger-retry-onoff/ld_rung_04.svg?v=full-tags-20260913)

</details>

<details>
<summary>SM#2 추가 Rung 4개 펼치기</summary>

![SM#2 ON 래치 LD](/images/notes/sc1-sm-finger-retry-onoff/ld_rung_07.svg?v=full-tags-20260913)
![SM#2 OFF 래치 LD](/images/notes/sc1-sm-finger-retry-onoff/ld_rung_08.svg?v=full-tags-20260913)
![SM#2 첫 스캔 초기화 LD](/images/notes/sc1-sm-finger-retry-onoff/ld_rung_09.svg?v=full-tags-20260913)
![SM#2 Retry Active LD](/images/notes/sc1-sm-finger-retry-onoff/ld_rung_10.svg?v=full-tags-20260913)

</details>

```text
XIC(i_finger_1_down)[XIO(i_finger_1_no_copper),XIC(z_sm2_finger_retry_bypass_active)]OTE(f_finger1_separated);
```

## Controller Scope 태그

SM#1과 SM#2는 서로 다른 태그를 사용한다. HMI는 PLC 상태를 직접 쓰지 않고 ON/OFF 요청만 Momentary로 보낸다.

| SM#1 태그 | SM#2 태그 | 형식 | 역할 |
|---|---|---|---|
| `ui_sm1_finger_retry_bypass_on_req` | `ui_sm2_finger_retry_bypass_on_req` | BOOL | 기능 ON 순간 요청이다. |
| `ui_sm1_finger_retry_bypass_off_req` | `ui_sm2_finger_retry_bypass_off_req` | BOOL | 기능 OFF 순간 요청이다. |
| `z_sm1_finger_retry_bypass_enable` | `z_sm2_finger_retry_bypass_enable` | BOOL | PLC가 기억하는 기능 ON/OFF 상태이다. |
| `z_sm1_finger_retry_bypass_active` | `z_sm2_finger_retry_bypass_active` | BOOL | 실제 Finger 완료 판정에 연결되는 우회 상태이다. |
| `ons_sm1_finger_retry_bypass_on_req` | `ons_sm2_finger_retry_bypass_on_req` | BOOL | ON 요청 ONS 저장 비트이다. |
| `ons_sm1_finger_retry_bypass_off_req` | `ons_sm2_finger_retry_bypass_off_req` | BOOL | OFF 요청 ONS 저장 비트이다. |

TIMER 태그는 만들지 않는다. `z_*_retry_bypass_enable`은 초기값 0으로 만들며, 첫 스캔에도 0으로 정리한다.

## SM#1에 넣을 RLL

`Stripping_Machine_1 > BasicControl`에서 원본 `f_copper_in_gate` Rung 직후에 다음 4개를 순서대로 넣는다.

```text
XIC(ui_sm1_finger_retry_bypass_on_req)ONS(ons_sm1_finger_retry_bypass_on_req)OTL(z_sm1_finger_retry_bypass_enable);
XIC(ui_sm1_finger_retry_bypass_off_req)ONS(ons_sm1_finger_retry_bypass_off_req)OTU(z_sm1_finger_retry_bypass_enable);
XIC(S:FS)OTU(z_sm1_finger_retry_bypass_enable);
XIC(z_sm1_finger_retry_bypass_enable)XIC(f_auto_mode_manual_retry)XIO(f_copper_in_gate)XIO(f_reject_cathode)OTE(z_sm1_finger_retry_bypass_active);
```

원본 Finger 완료 Rung은 다음 두 줄로 바꾼다.

```text
XIC(i_finger_1_down)[XIO(i_finger_1_no_copper),XIC(z_sm1_finger_retry_bypass_active)]OTE(f_finger1_separated);
XIC(i_finger_2_down)[XIO(i_finger_2_no_copper),XIC(z_sm1_finger_retry_bypass_active)]OTE(f_finger2_separated);
```

## SM#2에 넣을 RLL

`Stripping_Machine_2 > BasicControl`에서 원본 `f_copper_in_gate` Rung 직후에 다음 4개를 순서대로 넣는다.

```text
XIC(ui_sm2_finger_retry_bypass_on_req)ONS(ons_sm2_finger_retry_bypass_on_req)OTL(z_sm2_finger_retry_bypass_enable);
XIC(ui_sm2_finger_retry_bypass_off_req)ONS(ons_sm2_finger_retry_bypass_off_req)OTU(z_sm2_finger_retry_bypass_enable);
XIC(S:FS)OTU(z_sm2_finger_retry_bypass_enable);
XIC(z_sm2_finger_retry_bypass_enable)XIC(f_auto_mode_manual_retry)XIO(f_copper_in_gate)XIO(f_reject_cathode)OTE(z_sm2_finger_retry_bypass_active);
```

원본 Finger 완료 Rung은 다음 두 줄로 바꾼다.

```text
XIC(i_finger_1_down)[XIO(i_finger_1_no_copper),XIC(z_sm2_finger_retry_bypass_active)]OTE(f_finger1_separated);
XIC(i_finger_2_down)[XIO(i_finger_2_no_copper),XIC(z_sm2_finger_retry_bypass_active)]OTE(f_finger2_separated);
```

[SM#1·SM#2 Retry ON/OFF Neutral Text 다운로드](/downloads/sc1-sm-finger-retry-onoff-neutral-text.txt)

## 작동 순서

### 기능 OFF

1. HMI에서 OFF 버튼을 누르면 PLC가 `z_sm*_finger_retry_bypass_enable=0`으로 만든다.
2. Retry 중에도 `z_sm*_finger_retry_bypass_active=0`이다.
3. `Finger Down`과 실제 No Copper 센서 입력으로 완료 비트를 만든다.

### 기능 ON

1. HMI에서 ON 버튼을 누르면 PLC가 `z_sm*_finger_retry_bypass_enable=1`로 기억한다.
2. 일반 자동 운전과 일반 탈취에서는 Active가 0이다.
3. 실제 Retry 스텝에서 `f_auto_mode_manual_retry=1`이 되고, `f_copper_in_gate=0`, `f_reject_cathode=0`이면 Active가 1이다.
4. Retry 성공 또는 리젝트 조건이 되면 Active는 같은 스캔에 0으로 내려간다.
5. 기능 Enable은 유지되므로 다음 Retry에도 자동으로 같은 정책이 적용된다. 기능을 끝내려면 HMI OFF 버튼을 누른다.

기능 ON은 센서 입력을 계속 우회하는 명령이 아니다. `f_auto_mode_manual_retry`가 0이면 항상 실제 센서 경로를 사용한다.

## InTouch 화면

| 화면 개체 | PLC 태그 | 설정 |
|---|---|---|
| `SM#1 Finger Retry 우회 ON` | `ui_sm1_finger_retry_bypass_on_req` | Touch Down 1, Touch Up 0인 Momentary 버튼이다. |
| `SM#1 Finger Retry 우회 OFF` | `ui_sm1_finger_retry_bypass_off_req` | Touch Down 1, Touch Up 0인 Momentary 버튼이다. |
| `SM#2 Finger Retry 우회 ON` | `ui_sm2_finger_retry_bypass_on_req` | Touch Down 1, Touch Up 0인 Momentary 버튼이다. |
| `SM#2 Finger Retry 우회 OFF` | `ui_sm2_finger_retry_bypass_off_req` | Touch Down 1, Touch Up 0인 Momentary 버튼이다. |
| 기능 선택 표시 | `z_sm*_finger_retry_bypass_enable` | ON이면 `Retry 우회 사용`, OFF이면 `Retry 우회 미사용`으로 표시한다. |
| 실제 동작 표시 | `z_sm*_finger_retry_bypass_active` | Retry 중 실제 우회가 켜진 경우에만 표시한다. |

ON과 OFF가 같은 스캔에 들어오면 OFF Rung이 뒤에 있으므로 OFF가 우선한다. HMI 통신이 끊겨도 이미 저장된 Enable 상태는 PLC가 유지한다. 컨트롤러가 다시 Run으로 들어가면 `S:FS`가 Enable과 Active를 0으로 정리한다.

## 적용과 시험

1. 현재 Controller의 ACD와 L5X를 별도 백업한다.
2. Controller Scope 태그 12개를 만들고 초기값을 0으로 설정한다.
3. SM#1과 SM#2의 `BasicControl`에 각 4개 Rung을 넣고 완료 Rung 4개를 변경한다.
4. Cross Reference에서 각 Active 태그의 OTE가 한 곳인지 확인한다.
5. Studio 5000 Verify 후 승인된 무부하 조건에서 OFF와 ON을 시험한다.

| 시험 | 합격 기준 |
|---|---|
| OFF 일반 운전 | 실제 No Copper 입력으로만 완료 비트가 켜져야 한다. |
| ON 일반 운전 | Enable은 1이어도 Retry 전에는 Active가 0이어야 한다. |
| ON Retry | `f_auto_mode_manual_retry=1`인 동안만 Active가 1이어야 한다. |
| Retry 성공 | `f_copper_in_gate=1`이면 Active가 0이어야 한다. |
| Retry 리젝트 | `f_reject_cathode=1`이면 Active가 0이어야 한다. |
| ON 유지 | OFF 전까지 다음 Retry에서도 Enable이 유지되어야 한다. |
| 첫 스캔 | 컨트롤러 Run 전환 뒤 Enable과 Active가 0이어야 한다. |
| Finger Down | Active가 1이어도 Finger Down이 0이면 완료 비트가 1이면 안 된다. |
| SM 독립성 | SM#1 ON/OFF가 SM#2 Enable과 Active를 바꾸면 안 된다. |

이 문서는 Offline L5X 기준 적용 설계이다. 실제 InTouch Access Name, 입력 극성, Studio 5000 Verify와 생산 동작은 현장에서 별도로 확인해야 한다.
