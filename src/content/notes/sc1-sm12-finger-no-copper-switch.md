---
title: SC1 SM#1·SM#2 Finger 센서 사용과 우회를 HMI에서 고르는 작업안
date: "2026-09-09"
excerpt: 커넥터를 뽑았을 때처럼 Finger 센서 확인을 생략하거나, 실제 입력 5번과 6번을 사용하도록 SM#1과 SM#2를 따로 선택하는 작업안이다.
kicker: PLC
tags: ["PLC", "SC1", "SM1", "SM2"]
---


## 케이블 재연결 후 사용할 ON/OFF 정의

현장 작업자는 센서 케이블을 다시 연결해 사용하되, 필요할 때 HMI에서 감지 기능만 OFF로 선택한다. 이 문서에서 `ui_sm1_finger_no_copper`와 `ui_sm2_finger_no_copper`는 **센서 기능 사용 여부**를 뜻한다.

- ON(1)이면 해당 SM의 실제 센서 입력으로 분리 완료를 판단한다.
- OFF(0)이면 실제 센서 입력이 무엇이든, 해당 Finger의 하강 입력이 들어왔을 때 감지 조건을 만족한 것으로 처리한다.
- 실제 입력 비트를 0으로 덮어쓰거나 Force하지 않는다. 케이블은 연결해 둔다.
- SM별 스위치 하나가 해당 SM의 Finger 1과 Finger 2에 함께 적용된다.

앞선 설명 중 “`XIO(ui...)`가 잘못됐으므로 `XIC(ui...)`로 바꿔야 한다”는 내용은 정정한다. 센서 기능 OFF에서 우회하려면 **`XIO(ui...)`가 맞다.** `XIC(ui...)`를 사용하면 ON일 때 우회하는 반대 동작이 된다.

### HMI 접점 하나로 우회가 되는 이유

SM#1 Finger 1의 수정식은 다음과 같다.

```text
XIC(i_finger_1_down)[XIO(i_finger_1_no_copper),XIO(ui_sm1_finger_no_copper)]OTE(f_finger1_separated);
```

대괄호 안의 두 접점은 병렬 OR 조건이다. HMI 접점을 센서와 직렬로 추가하는 것이 아니다.

```text
Finger 하강 완료
AND
(실제 no_copper 입력이 0 OR 센서 기능 선택이 OFF)
→ 분리 완료 판정
```

예를 들어 케이블을 연결한 상태에서 실제 `i_finger_1_no_copper=1`이어도, HMI 선택이 OFF이면 `XIO(ui_sm1_finger_no_copper)`가 참이 된다. 따라서 `i_finger_1_down=1`일 때 `f_finger1_separated=1`이 된다. HMI를 ON으로 돌리면 우회 접점이 거짓이 되어 기존 센서 판정으로 돌아간다.

이때 완료 비트는 실제 전기동 감지를 증명하는 값이 아니라 우회된 판정이다. HMI에는 센서 사용 상태와 실제 입력 상태를 구분해서 보여 준다.

### 적용 범위와 전환 시점

이 수정안은 BasicControl의 분리 완료 판정을 우회하는 최소안이다. 원시 입력을 직접 읽는 재시도 SFC는 계속 실제 입력을 읽으므로, **전체 프로그램에서 케이블을 뽑은 상태와 완전히 동일하다는 뜻은 아니다.** 새 사이클의 성공 경로 진행은 현장에서 확인해야 한다.

HMI는 “센서 기능 사용”으로 표시하고, OFF일 때 “센서 확인 생략 중: Finger 하강 후 완료로 판단합니다.”를 함께 표시한다. 운전 중 편집을 막는 HMI 쓰기 허용 조건을 별도로 연결한다. 이 문서의 4개 Rung 자체에는 스위치 변경을 막는 로직이 없다.

선택 변경은 단순 일시정지가 아니라 분리 동작이 끝나거나 정상 절차로 초기 상태에 복귀한 뒤, 새 사이클을 시작하기 전에 한다. 이미 재시도 SFC에 들어간 상태에서 OFF를 눌러 즉시 탈출하는 기능은 이 안에 포함하지 않는다. 다음 SFC는 carriage 복귀 등 나머지 전이 조건도 만족해야 진행한다.

### 케이블 연결 상태에서 확인할 시험

1. 각 SM의 실제 입력과 HMI 선택값을 함께 확인한다.
2. 센서 기능 ON, Finger Down=1, 실제 no_copper=1이면 해당 완료 비트가 0인지 확인한다.
3. 새 사이클 시작 전에 센서 기능을 OFF로 선택한다. 같은 입력 조건에서 완료 비트가 1이 되고 기존 성공 경로로 진행하는지 확인한다.
4. 센서 기능 OFF여도 Finger Down=0이면 해당 완료 비트가 0인지 확인한다.
5. 새 사이클 전에 ON으로 되돌리면 실제 입력에 따른 기존 판정이 복구되는지 확인한다.
6. SM#1만 OFF인 경우와 SM#2만 OFF인 경우를 각각 확인한다.

위 시험은 아직 현장에서 수행하지 않았다. 이번 변경은 작업노트 수정이며 PLC에 적용한 결과를 뜻하지 않는다.

SM#1과 SM#2는 케이블을 다시 연결해 실제 센서를 사용하고, 필요할 때 감지 기능을 OFF로 선택한다. 아래에는 원본 입력 주소와 네 개 Rung의 수정식을 정리했다.

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
