---
title: SC1 SM#1·SM#2 Finger 센서 사용과 우회를 HMI에서 고르는 작업안
date: "2026-09-09"
excerpt: 커넥터를 뽑았을 때처럼 Finger 센서 확인을 생략하거나, 실제 입력 5번과 6번을 사용하도록 SM#1과 SM#2를 따로 선택하는 작업안이다.
kicker: PLC
tags: ["PLC", "SC1", "SM1", "SM2"]
---

SM#1과 SM#2의 Finger No Copper 센서는 커넥터를 뽑아 입력이 0인 상태로 운전한 이력이 있다. 기존 로직은 Finger가 내려온 뒤 이 입력이 0이면 분리 완료로 판단하고 `DoSeparation`의 다음 동작으로 진행한다.

이번 작업안은 커넥터를 다시 연결한 뒤에도 HMI에서 장비별로 센서를 쓸지 고를 수 있게 한다.

| 선택 | 동작 |
|---|---|
| 센서 사용 ON | 실제 Finger No Copper 입력을 기존 로직처럼 사용한다. |
| 센서 사용 OFF | 커넥터를 뽑아 입력이 0이었던 상태처럼 센서 판정을 생략한다. |

SM#1과 SM#2는 서로 따로 설정한다. 센서 사용 OFF에서도 Finger가 실제로 내려왔다는 입력은 반드시 확인한다.

## 실제 입력 번호

| 장비 | 프로그램 태그 | 실제 입력 |
|---|---|---|
| SM#1 | `i_finger_1_no_copper` | `N4:1:I.5`이다. |
| SM#1 | `i_finger_2_no_copper` | `N4:1:I.6`이다. |
| SM#2 | `i_finger_1_no_copper` | `N6:1:I.5`이다. |
| SM#2 | `i_finger_2_no_copper` | `N6:1:I.6`이다. |

현재 성공 판정은 `XIO(i_finger_*_no_copper)`다. 따라서 PLC 비트가 0이면 Finger Down 뒤에 분리 완료로 판단할 수 있고, 비트가 1이면 분리 완료 판정이 나오지 않아 재시도 경로가 동작할 수 있다. 태그 이름만 보고 극성을 판단하지 말고, 적용 전에 커넥터를 뽑았을 때 Online 비트가 실제로 0인지 확인한다.

## HMI에서 쓸 태그

Controller Scope BOOL 태그 두 개를 만든다.

| 태그 | 초기값 | 뜻 |
|---|---:|---|
| `ui_sm1_finger_no_copper` | 1 | 1이면 SM#1 실제 센서를 쓰고, 0이면 센서 판정을 생략한다. |
| `ui_sm2_finger_no_copper` | 1 | 1이면 SM#2 실제 센서를 쓰고, 0이면 센서 판정을 생략한다. |

HMI에는 `SM#1 Finger 전기동 감지 사용`, `SM#2 Finger 전기동 감지 사용`으로 표시한다. ON일 때는 `실제 센서 입력으로 분리를 확인합니다.`를, OFF일 때는 `Finger 하강 뒤에 센서 확인을 생략합니다.`를 함께 보여 준다.

## 바꾸는 위치

SM#1에서는 다음 두 Rung을 바꾼다.

```text
Program: Stripping_Machine_1
Routine: BasicControl
Rung: 52, 53
```

SM#2에서는 다음 두 Rung을 바꾼다.

```text
Program: Stripping_Machine_2
Routine: BasicControl
Rung: 51, 52
```

## SM#1 원본과 수정식

Finger 1 원본:

```text
XIC(i_finger_1_down)XIO(i_finger_1_no_copper)OTE(f_finger1_separated);
```

Finger 1 수정식:

```text
XIC(i_finger_1_down)[XIO(i_finger_1_no_copper),XIO(ui_sm1_finger_no_copper)]OTE(f_finger1_separated);
```

Finger 2 원본:

```text
XIC(i_finger_2_down)XIO(i_finger_2_no_copper)OTE(f_finger2_separated);
```

Finger 2 수정식:

```text
XIC(i_finger_2_down)[XIO(i_finger_2_no_copper),XIO(ui_sm1_finger_no_copper)]OTE(f_finger2_separated);
```

## SM#2 원본과 수정식

Finger 1 원본:

```text
XIC(i_finger_1_down)XIO(i_finger_1_no_copper)OTE(f_finger1_separated);
```

Finger 1 수정식:

```text
XIC(i_finger_1_down)[XIO(i_finger_1_no_copper),XIO(ui_sm2_finger_no_copper)]OTE(f_finger1_separated);
```

Finger 2 원본:

```text
XIC(i_finger_2_down)XIO(i_finger_2_no_copper)OTE(f_finger2_separated);
```

Finger 2 수정식:

```text
XIC(i_finger_2_down)[XIO(i_finger_2_no_copper),XIO(ui_sm2_finger_no_copper)]OTE(f_finger2_separated);
```

## 판정표

| Finger Down | HMI 센서 선택 | 실제 입력 | 분리 완료 비트 |
|---:|---:|---:|---:|
| 0 | ON 또는 OFF | 0 또는 1 | 0이다. |
| 1 | OFF | 0 또는 1 | 1이 된다. |
| 1 | ON | 0 | 1이 된다. |
| 1 | ON | 1 | 0으로 남는다. |

센서 사용 OFF는 센서 확인만 생략한다. `i_finger_1_down`과 `i_finger_2_down`은 그대로 사용하므로, Finger가 실제로 내려오지 않으면 다음 동작으로 가지 않는다.

## SFC를 바꾸지 않는 이유

`DoSeparation`은 `f_finger1_separated`, `f_finger2_separated`로 성공 경로를 고른다. 두 장비의 `MainRoutine`은 `BasicControl`을 실행한 뒤 `SecondarySeparation`을 실행하고, 그 안에서 `DoSeparation`을 호출한다. 그래서 사이클을 시작하기 전에 HMI 선택을 OFF로 두면 BasicControl이 만든 완료 비트를 DoSeparation이 읽는다.

다음 재시도 SFC 전이는 이번 작업에서 바꾸지 않는다.

| 장비 | SFC 전이 |
|---|---|
| SM#1 | `Finger1Separate.Tran_099`, `Finger2Separate.Tran_103`이다. |
| SM#2 | `Finger1Separate.Tran_155`, `Finger2Separate.Tran_160`이다. |

이 방식은 새 `DoSeparation` 사이클을 시작하기 전에 선택을 정하는 경우에 쓴다. 이미 재시도 SFC 안으로 들어간 뒤에 OFF로 바꿔 즉시 다음 단계로 나가는 기능은 이번 작업에 넣지 않는다.

## 같이 바꾸지 않는 것

- 실제 입력 주소 `N4:1:I.5/6`, `N6:1:I.5/6`은 바꾸지 않는다.
- 실제 입력을 강제로 쓰지 않는다.
- Finger Down 확인은 생략하지 않는다.
- `DoSeparation`, `Finger1Separate`, `Finger2Separate` SFC는 바꾸지 않는다.
- 한 장비의 HMI 선택 태그를 다른 장비 Rung에 넣지 않는다.

## Online 시험 순서

1. 자동 사이클을 멈추고 HMI 선택을 정한다.
2. 각 SM에서 `i_finger_1_down`, `i_finger_2_down`, 입력 5번과 6번, `f_finger1_separated`, `f_finger2_separated`를 같이 본다.
3. 센서 ON에서 실제 입력 0이면 완료 비트가 켜지고, 입력 1이면 기존 재시도가 유지되는지 확인한다.
4. 센서 OFF에서 실제 입력이 0 또는 1이어도 Finger Down 뒤에 완료 비트가 켜지고 다음 동작으로 가는지 확인한다.
5. SM#1 OFF·SM#2 ON, SM#1 ON·SM#2 OFF를 각각 시험하여 서로 영향을 주지 않는지 확인한다.
6. 선택을 ON으로 되돌린 뒤 새 사이클에서 실제 센서 판정으로 복귀하는지 확인한다.

Online Rung이 검토한 원본과 같은지 확인하고, Studio 5000 Verify와 시험 결과를 남긴 뒤에 생산에 사용한다.
