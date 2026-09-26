---
title: CSM#1 VISION 등급소실 원인분석
date: "2026-09-26"
excerpt: HMI의 등급 없음 표시를 기준으로 Vision 등급 전달, Robot1 등급 대기, SM#1·SM#2 Drop Tracking을 8태그 Trend 묶음으로 나누어 점검하는 절차다.
kicker: PLC
tags: ["PLC", "VISION", "Robot1", "InTouch", "CSM", "Timing"]
---

## 증상과 현재 판단

HMI에서 `z_sm1_Grade_None` 또는 `z_sm2_Grade_None`이 켜지고 “등급 없음”이 표시된다. 이 태그는 SM#1 또는 SM#2로 제품을 넘기기 직전에 원본 버퍼의 Weight가 0일 때 켜지는 구조다.

따라서 증상은 SM에서 새로 등급이 지워졌다는 뜻보다는, 그보다 앞 단계에서 등급이 만들어지지 않았거나 Robot1이 등급을 기다리다 시간 초과로 다음 단계로 진행했을 가능성을 먼저 뜻한다.

아직 타이머를 바꾸지 않는다. 먼저 아래 Trend 묶음으로 실제 시간 순서를 확보한다. 로그를 받은 뒤 같은 실패 건을 기준으로 원인을 확정하고, 그때 한 타이머만 수정한다.

## 간단한 전달 순서

```text
카메라·ML 판정
→ VISION PLC가 등급 신호를 유지한다
→ CATHODE 1 PLC Robot1이 등급을 받는다
→ Robot1이 등급을 기다리거나 시간 초과로 Pickup Tracking을 진행한다
→ Weight가 SM#1 또는 SM#2로 이동한다
→ Weight가 0이면 HMI에 등급 없음이 표시된다
```

그리퍼 오픈은 등급을 새로 쓰는 동작이 아니다. Robot1이 앞 단계에서 확보한 Weight를 유지한 채 SM 로딩 완료 신호를 보내고, 이후 SM Drop Tracking이 그 Weight를 읽는다.

## 타이머와 수정 위치

수정 위치는 세 군데 후보가 있지만, 로그 없이 동시에 수정하면 원인을 찾을 수 없다. 우선순위는 `TON_01`이다.

| 순서 | PLC 프로그램 | Routine / Rung | 현재 타이머 | 역할 | 로그에서 확인할 조건 | 수정 판단 |
|---:|---|---|---:|---|---|---|
| 1 | CATHODE 1 PLC | `Robot1` → `prod_tracking` → Rung 9 | `TON_01.PRE = 4000 ms` | Robot1이 Vision 등급을 기다리는 최대 시간이다. 등급이 없어도 4초가 지나면 Pickup Tracking을 진행한다. | `TON_01.DN=1`일 때 `R4_*_Grade`가 모두 0인지 확인한다. | 이 조합이 확인되면 `4000 → 5000 ms`만 시험한다. |
| 2 | VISION PLC | `AUTO` Routine의 등급 출력 구간. `OTL(o_csm_Grade_*)` 바로 아래 `TON(RESET_GR)` Rung | `RESET_GR.PRE = 300 ms` | Vision 등급 출력을 유지하는 시간이다. ML 판정 시간을 늘리는 타이머는 아니다. | Vision 출력은 있었는데 CATHODE 1 PLC에서 등급 수신이 없을 때 확인한다. | 이 경우에만 `300 → 500 ms`를 단독 시험한다. |
| 3 | CATHODE 1 PLC | `Robot1` → `Background` → Rung 83~84 | `DELAY.PRE = 700 ms` | CATHODE 1 PLC 안에서 받은 `R4_*_Grade`를 유지하는 시간이다. | `R4_*_Grade`가 켜졌지만 Pickup Tracking 전에 `DELAY.DN=1`로 꺼질 때 확인한다. | 이 경우에만 `700 → 1000 ms`를 단독 시험한다. |

`prod_tracking`의 Rung 10은 `TON_01.DN`일 때 `zTimeOverGrade`를 켠다. Rung 12는 `z_Get_R1_Pickup_Bar`가 켜졌을 때 Pickup Tracking 명령을 만든다. 따라서 Rung 9, 10, 12는 항상 함께 확인한다.

VISION PLC의 `AUTO` Routine에서는 다음 연속 구간을 찾는다.

```text
Local:4:I.Data.2 / .3 / .15 / .1
→ GRADE_S / GRADE_E / GRADE_R / GRADE_G
→ OTL(o_csm_Grade_S / E / G / R)
→ TON(RESET_GR)
→ RESET_GR.DN에서 o_csm_Grade_* 해제
```

이 구간의 `RESET_GR`만 Vision 등급 출력 유지시간을 바꾼다. 다른 Vision 타이머나 Robot 동작 타이머는 이번 점검에서 수정하지 않는다.

## PLC Trend는 8개씩 나누어 저장한다

Trend 하나에 8개만 넣을 수 있으므로, 아래 네 묶음을 순서대로 사용한다. 한 묶음에서 “등급 없음” 사건이 한 번이라도 잡히면 그 파일을 보관하고 다음 묶음으로 바꾼다. 각 파일 이름에는 시작 시각, 종료 시각, 설정값을 적는다.

예시:

```text
2026-09-26_A_VisionOutput_TON01-4000ms.csv
2026-09-27_B_RobotWait_TON01-4000ms.csv
```

### A. VISION 판정과 출력 묶음

이 묶음은 Vision이 결과를 실제 출력했는지 확인한다. `zp_Vision_Write[0]`은 등급 출력 비트 전체를 한 번에 보는 태그다.

```text
1. i_Servo2_Ready_Status
2. Local:4:I.Data.1
3. Local:4:I.Data.2
4. Local:4:I.Data.3
5. Local:4:I.Data.15
6. zp_Vision_Write[0]
7. RESET_GR.ACC
8. RESET_GR.DN
```

`zp_Vision_Write[0]`에서 S, E, G, R 출력 비트가 바뀌는지 확인한다. 입력이 있었는데 `i_Servo2_Ready_Status=0`이면 등급 출력이 만들어지지 않을 수 있다.

### B. CATHODE 1 PLC 등급 수신과 4초 대기 묶음

이 묶음은 Vision 출력이 Robot1까지 들어왔는지와 4초 시간 초과를 확인한다.

```text
1. zc_Vision_Read[0]
2. R4_S_Grade
3. R4_E_Grade
4. R4_G_Grade
5. R4_R_Grade
6. TON_01.ACC
7. TON_01.DN
8. zTimeOverGrade
```

가장 중요한 판정은 다음이다.

```text
TON_01.DN = 1
AND R4_S_Grade / R4_E_Grade / R4_G_Grade / R4_R_Grade = 모두 0
```

이 조합이면 Robot1이 등급을 받지 못한 채 4초를 기다리고 다음 단계로 진행한 것이다. 이 경우에만 `TON_01.PRE`를 5000ms로 바꾸는 시험을 검토한다.

### C. Pickup Tracking과 HMI 등급 없음 묶음

이 묶음은 Weight가 어느 단계에서 0이 됐는지 확인한다.

```text
1. z_Get_R1_Pickup_Bar
2. z_Tracking_Commands[22]
3. a_cathode[11].Weight
4. a_cathode[7].Weight
5. z_R1_sm1_Drop_done
6. z_R1_sm2_Drop_done
7. z_sm1_Grade_None
8. z_sm2_Grade_None
```

판정은 다음과 같다.

| 결과 | 뜻 |
|---|---|
| `a_cathode[11].Weight=0` | Robot1 Pickup Tracking 이전 또는 그 시점에 등급이 없었다. |
| `a_cathode[11].Weight`는 정상이고 `a_cathode[7].Weight=0` | Pickup 이후 이동 또는 중복 처리 가능성을 확인한다. |
| `a_cathode[7].Weight=0` 직후 `z_sm1_Grade_None` 또는 `z_sm2_Grade_None=1` | HMI 표시가 실제 빈 Weight Drop과 연결된다. |
| Weight는 0이 아닌데 Grade None 태그가 이미 1이다 | 이전 사건의 표시가 남아 있는지 Reset 조건을 확인한다. |

### D. SM 로딩과 목적지 Weight 묶음

이 묶음은 SM#1·SM#2 어느 쪽으로 빈 Weight가 넘어갔는지 확인한다.

```text
1. i_sm1_loaded
2. i_sm2_loaded
3. z_signal_r1_sm1_loaded
4. z_signal_r1_sm2_loaded
5. a_cathode[9].Weight
6. a_cathode[12].Weight
7. z_GradeFault
8. z_R1_Pickup_done
```

SM#1 Loaded는 `a_cathode[9]`, SM#2 Loaded는 `a_cathode[12]`의 Weight와 시간 순서가 맞아야 한다. 서로 다른 SM 로딩 신호가 너무 가까운 시점에 생기는지도 이 묶음에서 확인한다.

## 로그 판독 순서

1. A 묶음에서 Vision 입력과 `zp_Vision_Write[0]` 변화를 본다.
2. B 묶음에서 CATHODE 1 PLC가 R4 등급을 받았는지와 `TON_01.DN` 순서를 본다.
3. C 묶음에서 Weight가 `a_cathode[11]` 또는 `a_cathode[7]` 중 어디에서 0이 됐는지 본다.
4. D 묶음에서 어느 SM으로 넘겼는지와 HMI 표시 시점을 대조한다.
5. 같은 유형의 사건이 확인되면 그 유형에 해당하는 타이머 하나만 바꾼다.

## 타이머 시험 순서

### 시험 0. 현재값에서 로그만 확보한다

```text
TON_01.PRE = 4000 ms
RESET_GR.PRE = 300 ms
DELAY.PRE = 700 ms
```

먼저 B 또는 C 묶음에서 “등급 없음” 사건 하나를 확보한다. 로그가 없으면 값을 바꾸지 않는다.

### 시험 1. `TON_01.PRE`만 5000ms로 바꾼다

```text
CATHODE 1 PLC
Robot1 → prod_tracking → Rung 9
TON_01.PRE: 4000 → 5000 ms
```

이 시험은 `TON_01.DN=1`과 R4 등급 없음이 함께 확인됐을 때만 한다. 시험 중에는 B와 C 묶음을 우선 저장한다. 개선 여부는 Grade None 발생 횟수뿐 아니라 `zTimeOverGrade` 발생 횟수도 같이 비교한다.

### 시험 2. `RESET_GR.PRE`만 500ms로 바꾼다

```text
VISION PLC
AUTO Routine → TON(RESET_GR) Rung
RESET_GR.PRE: 300 → 500 ms
```

이 시험은 A 묶음에서 Vision 출력은 확인됐지만 B 묶음의 `zc_Vision_Read[0]` 또는 `R4_*_Grade`가 빠지는 경우에만 한다. ML 판정 시간이 늦다는 사실만으로 이 값을 먼저 늘리지는 않는다.

### 시험 3. `DELAY.PRE`만 1000ms로 바꾼다

```text
CATHODE 1 PLC
Robot1 → Background → Rung 83~84
DELAY.PRE: 700 → 1000 ms
```

이 시험은 `R4_*_Grade`가 켜졌지만 Pickup Tracking 전에 `DELAY.DN=1`이 되는 경우에만 한다.

## 지금은 수정하지 않는 부분

- Robot 프로그램의 그리퍼 오픈, `DO[2]`, `DO[3]` 펄스는 이번 타이머 시험에서 수정하지 않는다.
- `z_sm1_Grade_None`, `z_sm2_Grade_None`의 Reset 로직도 로그 확인 전에는 바꾸지 않는다.
- Vision, CATHODE 1 PLC의 타이머를 같은 시험에서 함께 바꾸지 않는다.
- 시험 중 HMI에서 Grade None 태그를 임의로 0으로 쓰지 않는다.

## 로그 전달 시 함께 알려줄 내용

1. 사용한 Trend 묶음 이름과 저장 시작·종료 시각이다.
2. 당시 `TON_01.PRE`, `RESET_GR.PRE`, `DELAY.PRE` 값이다.
3. HMI에 등급 없음이 뜬 SM 번호와 시각이다.
4. 가능하면 해당 제품의 생산 순번이다.
5. Trend 화면 캡처와 CSV 또는 내보낸 파일이다.

로그를 받으면 네 묶음의 시간 순서를 맞춰서, Vision 판정 지연인지, 통신·수신 문제인지, Robot1 4초 시간 초과인지, HMI 표시가 남은 문제인지를 구분한다.
